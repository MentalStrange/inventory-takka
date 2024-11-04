import Order from "../models/orderSchema.js";
import SupplierProduct from "../models/supplierProductSchema.js";
import { transformationFineOrder } from "../format/transformationObject.js";
import SupplierFine from "../models/supplierFineSchema.js";
import Supplier from "../models/supplierSchema.js";
import Group from "../models/groupSchema.js";
import DeletedProduct from "../models/deletedProductSchema.js";
import { egyptHour } from "../utils/balanceSheet.js";

export const rateOfStatistics = async (req, res) => {
  const supplierId = req.params.id;
  const { startDate, endDate } = req.query;
  try {
    let filter = { supplierId: supplierId };
    if (startDate && endDate) {
      const start = new Date(new Date(startDate).getTime() - egyptHour * 60 * 60 * 1000);
      const end = new Date(new Date(endDate).getTime() - egyptHour * 60 * 60 * 1000);
      filter.createdAt = { $gte: start, $lte: end };
    }
    const supplier = await Supplier.findById(supplierId);
    // Count total orders and products
    const totalOrdersCancelled = await Order.countDocuments(filter);
    const orderCancelled = await Order.countDocuments({ status: "cancelled", ...filter, });
    const orderTrash = await Order.countDocuments({ status: "trash", ...filter, });
    const totalProducts = await SupplierProduct.countDocuments(filter);
    const totalOrdersTrashed = await Order.countDocuments(filter);
    const totalOrdersReturned = await Order.countDocuments({ status: "returned", ...filter, });
    const totalCompletedOrders = await Order.countDocuments({ status: "complete", ...filter, });
    const totalOrders = await Order.countDocuments(filter);

    let productRemoved = 0;
    const deletedProducts = await DeletedProduct.find({ supplierId });
    const supplierProduct = await SupplierProduct.find({ supplierId });
    deletedProducts.forEach((deletedProduct) => {
      // Check if the product exists in the supplierProductsSchema
      const existsInSupplier = supplierProduct.some(
        (supplierProduct) => {
          return supplierProduct.productId === deletedProduct.productId;
        }
      );

      // If the product doesn't exist in the supplierProductsSchema, increment the count
      if (!existsInSupplier) {
        productRemoved++;
      }
    });

    // Calculate rates
    const completedRate = totalOrders === 0 ? 0 : (totalCompletedOrders / totalOrders) * 100 || 0;
    const cancellationRate = totalOrdersCancelled === 0 ? 0 : (orderCancelled / totalOrdersCancelled) * 100 || 0;
    const trashRate = totalOrdersTrashed === 0 ? 0 : (orderTrash / totalOrdersTrashed) * 100 || 0;
    const removalRate = totalProducts === 0 ? 0 : (productRemoved / totalProducts) * 100 || 0;
    const losingRate = totalProducts === 0 ? 0 :(totalOrdersTrashed + totalOrdersCancelled + totalOrdersReturned)/totalOrders * 100 || 0;
    
    // Calculate customer count per supplier
    const orders = await Order.find({ supplierId: supplierId, status : "complete"});
    const uniqueCustomers = new Set(
      orders.map((order) => order.customerId.toString())
    );
    const numberOfCustomers = uniqueCustomers.size ?? 0;

    // Calculate average order price and total price
    let totalPriceForOrder = 0;
    for (const order of orders) {
      totalPriceForOrder += order.totalPrice;
    }
    const averageOrderPrice = totalOrders === 0 ? 0 : totalPriceForOrder / totalOrders;
    const totalPrice = totalPriceForOrder || 0;

    res.status(200).json({
      status: "success",
      data: {
        cancellationRate,
        trashRate,
        removalRate,
        completedRate,
        numberOfCustomers, // Add customer count to response
        averageOrderPrice,
        totalPrice,
        rating: supplier.totalRating,
        losingRate,
        totalSupplierProduct:totalProducts
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
export const getAllFine = async (req, res) => {
  const supplierId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    let query = { supplierId };
    if (req.query.startDate && req.query.endDate) {
      const start = new Date(new Date(req.query.startDate).getTime() - egyptHour * 60 * 60 * 1000);
      const end = new Date(new Date(req.query.endDate).getTime() - egyptHour * 60 * 60 * 1000);
      query.createdAt = { $gte: start, $lte: end };
    }
    let orderIds = [];
    let groupIds = [];

    if (req.query.orderStatus) {
      const ordersWithStatus = await Order.find({ status: req.query.orderStatus });
      orderIds = ordersWithStatus.map((order) => order._id);
    }

    if (req.query.orderStatus) {
      const groupsWithStatus = await Group.find({ status: req.query.orderStatus });
      groupIds = groupsWithStatus.map((group) => group._id);
    }
    // Merge orderIds and groupIds
    const mergedIds = [...orderIds, ...groupIds];
    
    // Add merged IDs to the query
    if (mergedIds.length > 0) {
      query.$or = [
        { order: { $in: mergedIds } },
        { group: { $in: mergedIds } },
      ];
    }

    if (req.query.fineType) {
      query.typeOfFine = req.query.fineType;
    }

    const supplierFines = await SupplierFine.find(query).populate("order").sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).exec(); // Populate 'order' field
    const transformationFineOrders = await Promise.all(
      supplierFines.map(async supplierFine => await transformationFineOrder(supplierFine))
    );
    res.status(200).json({
      status: "success",
      page: page,
      totalPages: Math.ceil(await SupplierFine.countDocuments(query) / limit),
      data: transformationFineOrders,
    })
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
