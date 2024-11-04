import mongoose from "mongoose";
import Inventory from "../../models/store.models/inventorySchema.js";
import {
  transformationDetailedAccount,
  transformationExpense,
  transformationInventory,
  transformationInventoryProduct,
  transformationSettlement,
  transformationTreasury,
} from "../../format/transformationObject.js";
import PurchaseItem from "../../models/store.models/purchaseItemSchema.js";
import Settlement from "../../models/store.models/settlementSchema.js";
import Purchase from "../../models/store.models/purchaseSchema.js";
import Sale from "../../models/store.models/saleSchema.js";
import Expense from "../../models/store.models/receiptExpenseSchema.js";
import DetailedAccountStatement from "../../models/store.models/detailedAccountStatementSchema.js";
import Treasury from "../../models/store.models/treasurySchema.js";
import GlobalCreditAndDebit from "../../models/store.models/globalCreditAndDebitSchema.js";
import { egyptHour } from "../../utils/balanceSheet.js";
import Admin from "../../models/adminSchema.js";
import Product from "../../models/productSchema.js";
import AdminInventory from "../../models/store.models/adminInventorySchema.js";

export const getAllInventory = async (req, res) => {
  try {
    // Assuming the admin ID might be provided in the request headers
    const adminId = req.query.adminId; // Adjust based on how the admin ID is sent

    let inventories;
    if (adminId) {
      // Fetch inventory IDs allowed for the admin
      const adminInventories = await AdminInventory.find({ admin: adminId }).select('inventory');
      const inventoryIds = adminInventories.map(ai => ai.inventory);

      if (inventoryIds.length > 0) {
        // Fetch only the allowed inventories
        inventories = await Inventory.find({ _id: { $in: inventoryIds } });
      } else {
        // Fetch all inventories if adminInventories is empty
        inventories = await Inventory.find();
      }
    } else {
      // Fetch all inventories if no admin ID is provided
      inventories = await Inventory.find();
    }

    const transformInventory = await Promise.all(
      inventories.map(
        async (inventory) => await transformationInventory(inventory)
      )
    );

    res.status(200).json({
      status: "success",
      data: transformInventory,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const getOneInventory = async (req, res) => {
  const id = req.params.id;
  try {
    const inventory = await Inventory.findById(id);
    res.status(200).json({
      status: "success",
      data: [await transformationInventory(inventory)],
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const createInventory = async (req, res) => {
  try {
    const newInventory = new Inventory(req.body);
    await newInventory.save();
    res.status(201).json({
      status: "success",
      data: await transformationInventory(newInventory),
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
      res.status(207).json({
        status: "fail",
        message: "Inventory already exist.",
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }
};

export const updateInventory = async (req, res) => {
  try {
    const updatedInventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json({
      status: "success",
      data: await transformationInventory(updatedInventory),
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
      res.status(207).json({
        status: "fail",
        message: "Inventory already exist.",
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const totalPurchases = await PurchaseItem.countDocuments({
      inventoryId: req.params.id,
      reminderQuantity: { $gt: 0 },
    });
    if (totalPurchases > 0) {
      res.status(207).json({
        status: "fail",
        message: "Inventory cannot be deleted because it has purchases.",
      });
    }
    await Inventory.deleteOne({ _id: req.params.id });
    res.status(204).json({
      status: "success",
      data: "Inventory deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const getProductsByInventoryId = async (req, res) => {
  let query = {};

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    if (req.query.search) {
      query.title = new RegExp("^" + req.query.search, "i");
    }
    if (req.query.barcode) {
      query.barcode = req.query.barcode;
    }
    const pipelineAggregation = [
      { $match: { inventoryId: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "products",
          let: { productId: "$product" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
            { $match: query },
          ],
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $addFields: {
          productItemId: "$_id",
          title: "$productInfo.title",
          desc: "$productInfo.desc",
          frequency: "$productInfo.frequency",
          weight: "$productInfo.weight",
          units: "$productInfo.units",
          category: "$productInfo.category",
          subCategory: "$productInfo.subCategory",
          subSubCategory: "$productInfo.subSubCategory",
          barcode: "$productInfo.barcode",
          images: "$productInfo.images",
        },
      },
      { $match: { reminderQuantity: { $gt: 0 } } },
    ];
    if (req.query.isPagination === true) {
      pipelineAggregation.push(
        { $skip: (page - 1) * limit },
        { $limit: limit }
      );
    }
    if (req.query.random) {
      pipelineAggregation.push({ $sample: { size: +req.query.random } });
    }

    const purchaseItems = await PurchaseItem.aggregate(
      pipelineAggregation
    ).exec();
    const transformInventory = await Promise.all(
      purchaseItems.map(
        async (purchaseItem) =>
          await transformationInventoryProduct(purchaseItem)
      )
    );

    if (req.query.isPagination === true) {
      res.status(200).json({
        status: "success",
        page: page,
        data: transformInventory,
      });
    } else {
      res.status(200).json({
        status: "success",
        data: transformInventory,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const getSettlement = async (req, res) => {
  let query = {};
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    if (req.query.startDate && req.query.endDate) {
      const start = new Date(
        new Date(req.query.startDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      const end = new Date(
        new Date(req.query.endDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      query.date = { $gte: start, $lte: end };
    }
    if (req.query.product) {
      query.product = new mongoose.Types.ObjectId(req.query.product);
    }
    if (req.query.admin) {
      query.admin = new mongoose.Types.ObjectId(req.query.admin);
    }
    if (req.query.inventoryId) {
      query.inventoryId = new mongoose.Types.ObjectId(req.query.inventoryId);
    }
    const settlements = await Settlement.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    const transformSettlements = await Promise.all(
      settlements.map(
        async (settlement) => await transformationSettlement(settlement)
      )
    );
    res.status(200).json({
      status: "success",
      page: page,
      totalPages: Math.ceil((await Settlement.countDocuments(query)) / limit),
      data: transformSettlements,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const postSettlement = async (req, res) => {
  let issues = [];
  try {
    for (const product of req.body.products) {
      const purchaseItemData = await PurchaseItem.findById(product.productItemId);
      if (purchaseItemData && purchaseItemData.reminderQuantity !== product.reminderQuantity) {
        issues.push(purchaseItemData);
      }
    }
    const transformIssues = await Promise.all(
      issues.map(async (issue) => await transformationInventoryProduct(issue))
    );
    res.status(200).json({
      status: "success",
      data: transformIssues,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const patchSettlement = async (req, res) => {
  try {
    for (const product of req.body.products) {
      const purchaseItemData = await PurchaseItem.findById(
        product.productItemId
      );
      const newSettlement = await Settlement.create({
        admin: req.body.admin,
        inventoryId: req.body.inventoryId,
        purchaseItemId: product.productItemId,
        product: purchaseItemData.product,
        beforeChanges: purchaseItemData.reminderQuantity,
        afterChanges: product.reminderQuantity,
      });
      await newSettlement.save();
      purchaseItemData.reminderQuantity = product.reminderQuantity;
      await purchaseItemData.save();
    }

    res.status(200).json({
      status: "success",
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const createTreasuryOperation = async (req, res) => {
  try {
    if (req.body.type === "withdraw") {
      const globalCreditAndDebit = await GlobalCreditAndDebit.findOne({});
      if (
        !globalCreditAndDebit ||
        globalCreditAndDebit.globalDebit - globalCreditAndDebit.globalCredit <
          req.body.amount
      ) {
        return res.status(207).json({
          status: "fail",
          message: "Insufficient balance",
        });
      }
    }
    const newTreasury = await Treasury.create(req.body);
    await newTreasury.save();
    res.status(201).json({
      status: "success",
      data: await transformationTreasury(newTreasury),
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const getTreasury = async (req, res) => {
  try {
    const matchMap = {};
    if (req.query.startDate && req.query.endDate) {
      const start = new Date(
        new Date(req.query.startDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      const end = new Date(
        new Date(req.query.endDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      matchMap.date = { $gte: start, $lte: end };
    }

    const purchases = await Purchase.aggregate([
      { $match: matchMap },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalReturnAmount: { $sum: "$totalReturnAmount" },
        },
      },
      {
        $project: {
          total: { $subtract: ["$totalAmount", "$totalReturnAmount"] },
        },
      },
    ]);
    const sales = await Sale.aggregate([
      { $match: matchMap },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalReturnAmount: { $sum: "$totalReturnAmount" },
        },
      },
      {
        $project: {
          total: { $subtract: ["$totalAmount", "$totalReturnAmount"] },
        },
      },
    ]);
    const expenses = await Expense.aggregate([
      { $match: matchMap },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const addToTreasury = await Treasury.aggregate([
      { $match: { ...matchMap, type: { $eq: "deposit" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const subtractFromTreasury = await Treasury.aggregate([
      { $match: { ...matchMap, type: { $eq: "withdraw" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const detailedSuppliers = await DetailedAccountStatement.aggregate([
      { $match: { ...matchMap, supplierInventoryId: { $ne: null } } },
      {
        $group: {
          _id: null,
          totalNonDeposite: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "depositeToSupplier"] },
                    { $ne: ["$status", "returnPurchase"] },
                    { $ne: ["$status", "returnCashPurchase"] },
                  ],
                },
                "$balance",
                0,
              ],
            },
          },
          totalReturn: {
            $sum: {
              $cond: [{ $eq: ["$status", "returnPurchase"] }, "$balance", 0],
            },
          },
          totalCashReturn: {
            $sum: {
              $cond: [
                { $eq: ["$status", "returnCashPurchase"] },
                "$balance",
                0,
              ],
            },
          },
          totalDeposite: {
            $sum: {
              $cond: [
                { $eq: ["$status", "depositeToSupplier"] },
                "$balance",
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          total: {
            $subtract: [
              {
                $subtract: [
                  { $subtract: ["$totalNonDeposite", "$totalDeposite"] },
                  "$totalReturn",
                ],
              },
              "$totalCashReturn",
            ],
          },
        },
      },
    ]);

    const detailedCustomers = await DetailedAccountStatement.aggregate([
      { $match: { ...matchMap, customerInventoryId: { $ne: null } } },
      {
        $group: {
          _id: null,
          totalNonDeposite: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "depositeFromCustomer"] },
                    { $ne: ["$status", "returnSale"] },
                    { $ne: ["$status", "returnCashSale"] },
                  ],
                },
                "$balance",
                0,
              ],
            },
          },
          totalReturn: {
            $sum: {
              $cond: [{ $eq: ["$status", "returnSale"] }, "$balance", 0],
            },
          },
          totalCashReturn: {
            $sum: {
              $cond: [{ $eq: ["$status", "returnCashSale"] }, "$balance", 0],
            },
          },
          totalDeposite: {
            $sum: {
              $cond: [
                { $eq: ["$status", "depositeFromCustomer"] },
                "$balance",
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          total: {
            $subtract: [
              {
                $subtract: [
                  { $subtract: ["$totalNonDeposite", "$totalDeposite"] },
                  "$totalReturn",
                ],
              },
              "$totalCashReturn",
            ],
          },
        },
      },
    ]);

    const totalPurchases = purchases.length > 0 ? purchases[0].total : 0;
    const totalSales = sales.length > 0 ? sales[0].total : 0;
    const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;
    const totalSuppliers =
      detailedSuppliers.length > 0 ? detailedSuppliers[0].total : 0;
    const totalCustomers =
      detailedCustomers.length > 0 ? detailedCustomers[0].total : 0;
    const totalAddToTreasury =
      addToTreasury.length > 0 ? addToTreasury[0].total : 0;
    const totalSubtractFromTreasury =
      subtractFromTreasury.length > 0 ? subtractFromTreasury[0].total : 0;
    const totalCredits =
      totalPurchases +
      totalExpenses +
      totalSuppliers +
      totalSubtractFromTreasury;
    const totalDebits = totalSales + totalCustomers + totalAddToTreasury;
    const totalBalance = totalDebits - totalCredits;

    res.status(200).json({
      status: "success",
      data: {
        balance: totalBalance,
        credit: totalCredits,
        debit: totalDebits,
        purchases: totalPurchases,
        sales: totalSales,
        expenses: totalExpenses,
        customers: totalCustomers,
        suppliers: totalSuppliers,
        addCashToTreasury: totalAddToTreasury,
        subtractCashFromTreasury: totalSubtractFromTreasury,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const getEntries = async (req, res) => {
  let query = {};
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    if (req.query.admin) {
      // only for admin
      query.admin = new mongoose.Types.ObjectId(req.query.admin);
    }

    if (req.query.period) {
      // only for period
      const admins = await Admin.find({ period: { $in: req.query.period } })
        .select("_id")
        .lean();
      const adminIds = admins.map((admin) => admin._id);
      query.admin = { $in: adminIds };
    }

    if (req.query.startDate && req.query.endDate) {
      // only for date
      const start = new Date(
        new Date(req.query.startDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      const end = new Date(
        new Date(req.query.endDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      query.date = { $gte: start, $lte: end };
    } else if (req.query.endDate) {
      const startDate = new Date(req.query.endDate).setUTCHours(0, 0, 0, 0);
      const start = new Date(
        new Date(startDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      const end = new Date(
        new Date(req.query.endDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      query.date = { $gte: start, $lte: end };
    }

    const expensesPipeline = [
      { $match: query },
      { $sort: { date: -1 } },
      {
        $project: {
          date: 1,
          amount: 1,
          description: 1,
          operationType: { $literal: "expenses" },
        },
      },
    ];

    const detailedAccountStatementsPipeline = [
      {
        $match: {
          ...query,
          status: { $nin: ["returnSale", "returnPurchase"] },
        },
      },
      { $sort: { date: -1 } },
      {
        $project: {
          date: 1,
          details: 1,
          statementId: 1,
          operationType: { $literal: "customerSupplierDeposite" },
        },
      },
    ];

    const treasuriesPipeline = [
      { $match: query },
      { $sort: { date: -1 } },
      {
        $project: {
          date: 1,
          treasuryId: 1,
          balance: 1,
          operationType: { $literal: "treasuryOperation" },
        },
      },
    ];

    const combinedPipeline = [
      {
        $unionWith: {
          coll: "detailedaccountstatements",
          pipeline: detailedAccountStatementsPipeline,
        },
      },
      { $unionWith: { coll: "treasuries", pipeline: treasuriesPipeline } },
      { $sort: { date: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const paginatedData = await Expense.aggregate([
      ...expensesPipeline,
      ...combinedPipeline,
    ]).exec();
    const transformEntries = await Promise.all(
      paginatedData.map(async (entry) => {
        if (entry.operationType === "expenses") {
          const expenseData = await Expense.findById(entry._id);
          return await transformationExpense(expenseData);
        } else if (entry.operationType === "customerSupplierDeposite") {
          const detailedAccountStatemententryData =
            await DetailedAccountStatement.findById(entry._id);
          return await transformationDetailedAccount(
            detailedAccountStatemententryData
          );
        } else if (entry.operationType === "treasuryOperation") {
          const treasuryData = await Treasury.findById(entry._id);
          return await transformationTreasury(treasuryData);
        }
      })
    );
    return res.status(200).json({
      status: "success",
      data: transformEntries,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const getGlobalCreditAndDebit = async (req, res) => {
  let query = {};
  try {
    if (req.query.admin) {
      query.admin = new mongoose.Types.ObjectId(req.query.admin);
    }

    if (req.query.startDate && req.query.endDate) {
      const start = new Date(
        new Date(req.query.startDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      const end = new Date(
        new Date(req.query.endDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      query.date = { $gte: start, $lte: end };
    } else if (req.query.endDate) {
      const startDate = new Date(req.query.endDate).setUTCHours(0, 0, 0, 0);
      const start = new Date(
        new Date(startDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      const end = new Date(
        new Date(req.query.endDate).getTime() - egyptHour * 60 * 60 * 1000
      );
      query.date = { $gte: start, $lte: end };
    }

    if (Object.keys(query).length === 0) {
      const getlobalCreditAndDebitData = await GlobalCreditAndDebit.findOne();
      return res.status(200).json({
        status: "success",
        data: {
          globalCredit: getlobalCreditAndDebitData
            ? getlobalCreditAndDebitData.globalCredit
            : 0,
          globalDebit: getlobalCreditAndDebitData
            ? getlobalCreditAndDebitData.globalDebit
            : 0,
          globalBlance: getlobalCreditAndDebitData
            ? getlobalCreditAndDebitData.globalDebit -
              getlobalCreditAndDebitData.globalCredit
            : 0,
        },
      });
    }

    const purchases = await Purchase.aggregate([
      // credit
      { $match: query },
      { $group: { _id: null, paidAmount: { $sum: "$paidAmount" } } },
    ]);
    const sales = await Sale.aggregate([
      // debit
      { $match: query },
      { $group: { _id: null, paidAmount: { $sum: "$paidAmount" } } },
    ]);
    const expenses = await Expense.aggregate([
      // credit
      { $match: query },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]);
    const addToTreasury = await Treasury.aggregate([
      // debit
      { $match: { ...query, type: { $eq: "deposit" } } },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]);
    const subtractFromTreasury = await Treasury.aggregate([
      // credit
      { $match: { ...query, type: { $eq: "withdraw" } } },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]);
    const detailedSuppliers1 = await DetailedAccountStatement.aggregate([
      // credit
      {
        $match: {
          ...query,
          supplierInventoryId: { $ne: null },
          status: { $eq: "supplierStartingBalance" },
        },
      },
      { $group: { _id: null, credit: { $sum: "$credit" } } },
    ]);
    const detailedSuppliers2 = await DetailedAccountStatement.aggregate([
      // credit
      {
        $match: {
          ...query,
          supplierInventoryId: { $ne: null },
          status: { $eq: "depositeToSupplier" },
        },
      },
      { $group: { _id: null, debit: { $sum: "$debit" } } },
    ]);
    const detailedSuppliers3 = await DetailedAccountStatement.aggregate([
      // debit
      {
        $match: {
          ...query,
          supplierInventoryId: { $ne: null },
          status: { $eq: "returnCashPurchase" },
        },
      },
      { $group: { _id: null, debit: { $sum: "$debit" } } },
    ]);
    const detailedCustomers1 = await DetailedAccountStatement.aggregate([
      // debit
      {
        $match: {
          ...query,
          customerInventoryId: { $ne: null },
          status: { $eq: "customerStartingBalance" },
        },
      },
      { $group: { _id: null, debit: { $sum: "$debit" } } },
    ]);
    const detailedCustomers2 = await DetailedAccountStatement.aggregate([
      // debit
      {
        $match: {
          ...query,
          customerInventoryId: { $ne: null },
          status: { $eq: "depositeFromCustomer" },
        },
      },
      { $group: { _id: null, credit: { $sum: "$credit" } } },
    ]);
    const detailedCustomers3 = await DetailedAccountStatement.aggregate([
      // credit
      {
        $match: {
          ...query,
          customerInventoryId: { $ne: null },
          status: { $eq: "returnCashSale" },
        },
      },
      { $group: { _id: null, credit: { $sum: "$credit" } } },
    ]);

    const purchasesCredit = purchases.length > 0 ? purchases[0].paidAmount : 0;
    const salesDebit = sales.length > 0 ? sales[0].paidAmount : 0;
    const expensesCredit = expenses.length > 0 ? expenses[0].amount : 0;
    const addToTreasuryDebit =
      addToTreasury.length > 0 ? addToTreasury[0].amount : 0;
    const subtractFromTreasuryCredit =
      subtractFromTreasury.length > 0 ? subtractFromTreasury[0].amount : 0;
    const detailedSuppliersCredit1 =
      detailedSuppliers1.length > 0 ? detailedSuppliers1[0].credit : 0;
    const detailedSuppliersCredit2 =
      detailedSuppliers2.length > 0 ? detailedSuppliers2[0].debit : 0;
    const detailedSuppliersCredit3 =
      detailedSuppliers3.length > 0 ? detailedSuppliers3[0].debit : 0;
    const detailedCustomersDebit1 =
      detailedCustomers1.length > 0 ? detailedCustomers1[0].debit : 0;
    const detailedCustomersDebit2 =
      detailedCustomers2.length > 0 ? detailedCustomers2[0].credit : 0;
    const detailedCustomersDebit3 =
      detailedCustomers3.length > 0 ? detailedCustomers3[0].credit : 0;

    const globalCredit =
      purchasesCredit +
      expensesCredit +
      subtractFromTreasuryCredit +
      detailedSuppliersCredit1 +
      detailedSuppliersCredit2 +
      detailedCustomersDebit3;
    const globalDebit =
      salesDebit +
      addToTreasuryDebit +
      detailedCustomersDebit1 +
      detailedCustomersDebit2 +
      detailedSuppliersCredit3;

    res.status(200).json({
      status: "success",
      data: {
        globalCredit: globalCredit,
        globalDebit: globalDebit,
        globalBlance: globalDebit - globalCredit,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const transferProductBetweenInventories = async (req, res) => {
  const { sourceInventoryId, targetInventoryId, productId, quantity } = req.body;
  try {
    const sourceInventory = await Inventory.findById(sourceInventoryId);
    if (!sourceInventory) {
      return res.status(404).json({
        status: "fail",
        message: "the source inventory not found",
      });
    }
    const targetInventory = await Inventory.findById(targetInventoryId);
    if (!targetInventory) {
      return res.status(404).json({
        status: "fail",
        message: "the target inventory not found",
      });
    }
    const product = await PurchaseItem.findOne({
      product: productId,
      inventoryId: sourceInventory,
      reminderQuantity: { $gt: 0 }
    });
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "the product not found or reminderQuantity is zero",
      });
    }
    if (product.reminderQuantity < quantity) {
      return res.status(400).json({
        status: "fail",
        message: "the quantity to transfer exceeds the available reminderQuantity",
      });
    }
    const productTargetInventory = await PurchaseItem.findOne({
      product: productId,
      inventoryId: targetInventory,
      reminderQuantity: { $gt: 0 },
      expiryDate: product.expiryDate
    });
    if (productTargetInventory) {
      productTargetInventory.reminderQuantity += +quantity;
      await productTargetInventory.save();
    } else {
      const newPurchaseItem = await PurchaseItem.create({
        product: productId,
        quantity: +quantity,
        totalSubQuantity: +quantity,
        unit: product.unit,
        reminderQuantity: quantity,
        expiryDate: product.expiryDate,
        costPrice: product.costPrice,
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        haveWholeSalePrice: product.haveWholeSalePrice,
        purchaseId: product.purchaseId,
        inventoryId: targetInventoryId
      });
      if (!newPurchaseItem) {
        return res.status(400).json({
          status: "fail",
          message: "an error happened while creating the new purchase item",
        });
      }
    }
    product.reminderQuantity -= quantity;
    await product.save();
    res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// create admin inventory (every admin can have more inventory and vice verses)
export const createAdminInventory = async (req, res) => {
  const { admin, inventory } = req.body;

  try {
    const newInventory = await AdminInventory.create({
      admin: admin,
      inventory: inventory
    });
    res.status(200).json({
      status: "success",
      data: newInventory,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
}
// get the purchases and sales for specific admin
export const getTotalPurchasesAndSalesByAdmin = async (req, res) => {
  const adminId = req.params.id;
  const { startDate, endDate } = req.query;
  let query = { admin: adminId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate) {
      query.date.$lte = new Date(endDate);
    }
  }

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "the admin not found",
      });
    }
    const purchases = await Purchase.find(query);
    const sales = await Sale.find(query);

    res.status(200).json({
      status: "success",
      data: {
        purchases: purchases,
        sales: sales,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
}

