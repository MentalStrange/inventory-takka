import { transformationPurchase, transformationReturnPurchase } from '../../format/transformationObject.js';
import DetailedAccountStatement from '../../models/store.models/detailedAccountStatementSchema.js';
import PurchaseItem from '../../models/store.models/purchaseItemSchema.js';
import PurchaseReturn from '../../models/store.models/purchaseReturnSchema.js';
import Purchase from '../../models/store.models/purchaseSchema.js';
import SupplierInventory from '../../models/store.models/supplierInventorySchema.js';
import Unit from '../../models/unitSchema.js';
import mongoose from "mongoose";
import {withdrawWishlist} from "../../services/WishlistService.js";
export const getAllPurchases = async (req, res) => {
  let query = {};
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  console.log("hello");
  const queryDate = {};
  try {
    if (req.query.receiptNumber) {
      query.receiptNumber = req.query.receiptNumber;
    }
    if (req.query.paymentType) {
      query.paymentType = new mongoose.Types.ObjectId(req.query.paymentType);
    }
    if (req.query.startDate || req.query.endDate) {
      if (req.query.startDate) {
        queryDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        queryDate.$lte = new Date(req.query.endDate);
      }
      query.date = queryDate;
    }
    const purchases = await Purchase.find(query).populate('paymentType').sort({ date: -1 }).limit(limit).skip((page - 1) * limit).exec(); 
    const transformedPurchases = await Promise.all(
      purchases.map(async (purchase) => await transformationPurchase(purchase))
    );
    res.status(200).json({
      status: 'success',
      page: page,
      totalPages: Math.ceil(await Purchase.countDocuments(query) / limit),
      data: transformedPurchases,
    })
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};

export const getPurchaseById = async (req, res) => {
  const purchaseId = req.params.id;
  try {
    const purchase = await Purchase.findById(purchaseId);
    res.status(200).json({
      status: 'success',
      data: await transformationPurchase(purchase),
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};

export const createPurchase = async (req, res) => {
  const purchaseData = req.body;

  // Ensure the date ends with 'Z'
  if (purchaseData.date && !purchaseData.date.endsWith('Z')) {
    purchaseData.date += 'Z';
  }

  if (purchaseData.createDate) {
    // Check if the format is correct by adding leading zeroes where necessary
    const parsedDate = purchaseData.createDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);

    if (parsedDate) {
      // Ensure month and day have leading zeros
      const year = parsedDate[1];
      const month = parsedDate[2].padStart(2, '0');
      const day = parsedDate[3].padStart(2, '0');
      const time = `${parsedDate[4]}:${parsedDate[5]}:${parsedDate[6]}.${parsedDate[7]}`;

      // Rebuild the date string with proper formatting
      purchaseData.createDate = `${year}-${month}-${day}T${time}Z`;
    } else {
      // If parsing fails, send an error response
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid date format in createDate',
      });
    }

    // Convert the properly formatted string to a Date object
    purchaseData.createDate = new Date(purchaseData.createDate);
  }

  try {
    const purchase = await Purchase.create({
      ...purchaseData,
      supplierInventoryId: purchaseData.customerSupplierInventory._id,
      inventoryId: purchaseData.inventory._id,
      date: purchaseData.createDate
    });

    const unitIds = purchaseData.products.map(product => product.unit._id);
    const units = await Unit.find({ _id: { $in: unitIds } }).lean();
    const unitMap = units.reduce((map, unit) => {
      map[unit._id] = unit;
      return map;
    }, {});

    const bulkOperations = [];
    for (const product of purchaseData.products) {
      const unitData = unitMap[product.unit._id];
      const query = { 
        inventoryId: new mongoose.Types.ObjectId(purchaseData.inventory._id),
        product: new mongoose.Types.ObjectId(product._id),
        expiryDate: new Date(product.expiryDate)
      };

      const inventoryItemsAggregate = await PurchaseItem.aggregate([
        { $match: query }, { $group: { _id: null, totalReminderQuantity: { $sum: "$reminderQuantity" } } }
      ]);
      
      const totalReminderQuantity = inventoryItemsAggregate.length > 0 ? inventoryItemsAggregate[0].totalReminderQuantity : 0;

      bulkOperations.push({
        updateMany: { filter: query, update: { $set: { reminderQuantity: 0 } } }
      });

      const purchaseItem = new PurchaseItem({
        product: product._id,
        quantity: product.quantity,
        totalSubQuantity: product.quantity * unitData.maxNumber,
        unit: unitData._id,
        reminderQuantity: product.quantity * unitData.maxNumber + totalReminderQuantity,
        expiryDate: product.expiryDate ?? "2500-01-01T00:00:00.000Z",
        costPrice: product.costPrice,
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        haveWholeSalePrice: product.haveWholeSalePrice,
        purchaseId: purchase._id,
        inventoryId: purchaseData.inventory._id,
        date: purchaseData.createDate
      });

      bulkOperations.push({
        insertOne: { document: purchaseItem }
      });
    }
    await PurchaseItem.bulkWrite(bulkOperations);

    await DetailedAccountStatement.create({
      purchaseId: purchase._id,
      supplierInventoryId: purchaseData.customerSupplierInventory._id,
      credit: purchaseData.totalAmount,
      debit: purchaseData.paidAmount,
      balance: purchaseData.dueAmount,
      status: 'purchase',
      admin: purchaseData.admin
    });
    await SupplierInventory.updateOne(
      { _id: purchaseData.customerSupplierInventory._id },
      { $inc: { credit: purchaseData.totalAmount, debit: purchaseData.paidAmount } }
    );

    await withdrawWishlist(purchase._id, purchaseData.products);

    res.status(200).json({
      status: 'success',
      data: await transformationPurchase(purchase),
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};
export const deletePurchase = async (req, res) => {
  const purchaseId = req.params.id;
  try {
    await PurchaseItem.deleteMany({ purchaseId });
    await Purchase.deleteMany({_id: purchaseId});
    res.status(204).json({
      status: 'success',
      data: 'purchase deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};

export const getReturnsByPurchaseId = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: await transformationReturnPurchase(purchase)
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

export const returnPurchase = async (req, res) => {
  const purchaseId = req.params.id;
  const products = req.body.products;
  try {
    const purchase = await Purchase.findById(purchaseId);
    if(!purchase){
      return res.status(404).json({
        status: 'fail',
        message: 'Purchase not found'
      });
    }

    const inventoryId = purchase.inventoryId;
    for(const product of products){
      const purchaseItem = await PurchaseItem.findById(product.productItemId);
      if(product.quantity > purchaseItem.quantity){
        return res.status(208).json({
          status: 'fail',
          message: `The returned quantity for product ${product.productItemId} is greater than the quantity in the purchase.`
        });
      }
    }
    
    for(const product of products){
      const purchaseItem = await PurchaseItem.findById(product.productItemId);
      const unitData = await Unit.findById(purchaseItem.unit);

      const totalProductItem = await PurchaseItem.aggregate([
        {
          $match: { 
            inventoryId: new mongoose.Types.ObjectId(inventoryId), 
            product: new mongoose.Types.ObjectId(purchaseItem.product),
            expiryDate: new Date(purchaseItem.expiryDate)
          } 
        },
        { $group: { _id: null, totalReminderQuantity: { $sum: "$reminderQuantity" } } }
      ]);

      if(totalProductItem[0].totalReminderQuantity < product.quantity * unitData.maxNumber){
        return res.status(207).json({
          status: 'fail',
          message: 'Not enough product in inventory'
        });
      }
    }

    for(const product of products){
      const purchaseItemData = await PurchaseItem.findById(product.productItemId);
      const unitData = await Unit.findById(purchaseItemData.unit);
      
      const purchaseItems = await PurchaseItem.find({
        inventoryId: new mongoose.Types.ObjectId(inventoryId), 
        product: new mongoose.Types.ObjectId(purchaseItemData.product), 
        expiryDate: new Date(purchaseItemData.expiryDate)
      });

      let productQuantity = product.quantity * unitData.maxNumber;
      for(let i = 0; i < purchaseItems.length; i++){
        if(purchaseItems[i].reminderQuantity >= productQuantity){
          purchaseItems[i].reminderQuantity -= productQuantity;
          await purchaseItems[i].save();
          break;
        } else {
          productQuantity -= purchaseItems[i].reminderQuantity;
          purchaseItems[i].reminderQuantity = 0;
          await purchaseItems[i].save();
        }
      }
    }

    let returnPrice = 0;
    let returnProductIDs = [];
    for(const product of products){
      const purchaseItemData = await PurchaseItem.findById(product.productItemId);
      purchaseItemData.quantity -= product.quantity;
      returnPrice += product.quantity * purchaseItemData.costPrice;
      await purchaseItemData.save();
      
      const purchaseReturn = await PurchaseReturn.create({
        purchaseId: purchaseId,
        inventoryId: inventoryId,
        product: purchaseItemData.product,
        unit: purchaseItemData.unit,
        quantity: product.quantity,
        costPrice: purchaseItemData.costPrice
      });
      returnProductIDs.push(purchaseReturn._id);
    }

    returnPrice = returnPrice + returnPrice * (purchase.taxes / 100);
    await DetailedAccountStatement.create({
      purchaseId: purchaseId,
      supplierInventoryId: purchase.supplierInventoryId,
      credit: 0,
      debit: returnPrice,
      balance: returnPrice,
      status: req.body.cash ? 'returnCashPurchase' : 'returnPurchase',
      admin: req.body.admin,
      returnProductIDs: returnProductIDs
    });
    await SupplierInventory.updateOne({ _id: purchase.supplierInventoryId }, { $inc: { debit: returnPrice } });
    await Purchase.updateOne({ _id: purchaseId }, { $inc: { totalReturnAmount: returnPrice }})
    const purchaseData = await Purchase.findById(purchaseId);
    res.status(200).json({
      status: 'success',
      data: await transformationPurchase(purchaseData)
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};

export const calcTotalAmountPurchase = async (req, res) => {
  let query = {};
  const queryDate = {};
  try {
    if(req.query.admin){
      query.admin = new mongoose.Types.ObjectId(req.query.admin);
    }

    if(req.query.startDate || req.query.endDate){
      if (req.query.startDate) {
        queryDate.$gte = new Date(new Date(req.query.startDate).getTime() - egyptHour * 60 * 60 * 1000);
      }
      if (req.query.endDate) {
        queryDate.$lte = new Date(new Date(req.query.endDate).getTime() - egyptHour * 60 * 60 * 1000);
      }
      query.date = queryDate;
    }

    const totalAmount = await Purchase.aggregate([
      { $match: query },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }
    ]).exec();

    const totalReturn = await DetailedAccountStatement.aggregate([
      { $match: { ...query, status: { $in: ['returnCashPurchase', 'returnPurchase'] } } },
      { $group: { _id: null, totalAmount: { $sum: "$debit" } } }
    ]).exec();

    const totalAmountData = totalAmount[0] ? totalAmount[0].totalAmount : 0;
    const totalReturnData = totalReturn[0] ? totalReturn[0].totalAmount : 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalAmount: totalAmountData,
        totalReturn: totalReturnData,
        difference: totalAmountData - totalReturnData
      }
    });
   } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};

// function to return the total receipt and the tax for each receipt (tax * totalAmount of the recept = amount of tak for the one receipt and i will sum of all of them)
export const getTotalReceiptsAndTaxesForPurchase = async (req, res) => {
  try {
    const match = {};
    if (req.query.startDate || req.query.endDate) {
      match.date = {};
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        if (!isNaN(startDate.getTime())) {
          match.date.$gte = startDate;
        } else {
          throw new Error("Invalid start date");
        }
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        if (!isNaN(endDate.getTime())) {
          match.date.$lte = endDate;
        } else {
          throw new Error("Invalid end date");
        }
      }
    }

    const result = await Purchase.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalReceipt: { $sum: 1 },
          totalTaxes: { $sum: { $multiply: ["$totalAmount", { $divide: ["$taxes", 100] }] } }
        }
      }
    ]);

    const totals = result.length > 0 ? { totalReceipt: result[0].totalReceipt, totalTaxes: result[0].totalTaxes } : { totalReceipt: 0, totalTaxes: 0 };

    res.status(200).json({
      status: 'success',
      data: totals
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};

