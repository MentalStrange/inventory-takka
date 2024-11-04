import fs from "fs";
import mongoose from "mongoose";
import Product from "../models/productSchema.js";
import Offer from "../models/offerSchema.js";
import Order from "../models/orderSchema.js";
import SupplierProduct from "../models/supplierProductSchema.js";
import { transformationOrderProduct, transformationProduct, transformationSupplierProduct } from "../format/transformationObject.js";

export const getProductBySupplier = async (req, res) => { // done
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sortDirection = req.query.price === '1' ? -1 : 1;
  try {
    const titleSearch = req.query.search ? new RegExp(`^${req.query.search}`, 'i') : null;
    const supplierProducts = await SupplierProduct.aggregate([
      { $match: { supplierId: new mongoose.Types.ObjectId(req.params.id), stock: { $gt: 0 } } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: "$productInfo" },
      ...(titleSearch ? [{ $match: { "productInfo.title": titleSearch } }] : []),
      { $sort: req.headers['user-type'] === 'supplier' ? { createdAt: -1 } : { price: sortDirection } },
      { $skip: skip },
      { $limit: limit },
    ]);
    
    const transformedProducts = await Promise.all(
      supplierProducts.map(async (supplierProduct) => {
        return await transformationSupplierProduct(supplierProduct);
      })
    );
    res.status(200).json({
      status: "success",
      page: page,
      data: transformedProducts,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
export const getOutOfStockProductBySupplier = async (req, res) => { // done
  let query = {};
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try{
    if(req.query.search){
      query.title = new RegExp(`^${req.query.search}`, 'i');
    }
    const supplierProducts = await SupplierProduct.aggregate([
      {
        $lookup: {
          from: "products",
          let: { productId: "$productId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
            { $match: query }
          ],
          as: "productData"
        }
      },
      { $unwind: "$productData" },

      { $match: { supplierId: new mongoose.Types.ObjectId(req.params.id), stock: 0 } },
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit }, { $limit: limit }
    ]);

    const transformedProducts = await Promise.all(
      supplierProducts.map(async (supplierProduct) => {
        return await transformationSupplierProduct(supplierProduct);
      })
    );
    res.status(200).json({
      status: "success",
      page: page,
      data: transformedProducts,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
}
export const getProductByCategory = async (req, res) => { // done
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const titleSearch = req.query.search ? new RegExp(req.query.search, 'i') : null;
    const supplierProducts = await SupplierProduct.aggregate([
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplierId',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      { $unwind: "$supplierInfo" },
      { $match: { "supplierInfo.isDeleted": false } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: "$productInfo" },
      { $match: { "productInfo.category": new mongoose.Types.ObjectId(req.params.id) } },
      ...(titleSearch ? [{ $match: { "productInfo.title": titleSearch } }] : []),
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          createdAt: 1,
          supplierId: 1,
          supplierName: "$supplierInfo.name"
        }
      }
    ]);

    const transformedProducts = await Promise.all(
      supplierProducts.map(async (supplierProduct) => {
        const supplierProductData = await SupplierProduct.findById(supplierProduct._id);
        return await transformationSupplierProduct(supplierProductData);
      })
    );
    res.status(200).json({
      status: "success",
      page: page,
      data: transformedProducts,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
export const getAllProductAssignedToSupplier = async (req, res) => { // done
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sortDirection = req.query.price === '1' ? -1 : 1;
  try {
    const titleSearch = req.query.search ? new RegExp(req.query.search, 'i') : null;
    const supplierProducts = await SupplierProduct.aggregate([
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplierId',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      { $unwind: "$supplierInfo" },
      { $match: { "supplierInfo.isDeleted": false } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: "$productInfo" },
      ...(titleSearch ? [{ $match: { "productInfo.title": titleSearch } }] : []),
      { $sort: { price: sortDirection } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          createdAt: 1,
          supplierId: 1,
          supplierName: "$supplierInfo.name"
        }
      }
    ]);

    const transformedProducts = await Promise.all(
      supplierProducts.map(async (supplierProduct) => {
        const supplierProductData = await SupplierProduct.findById(supplierProduct._id);
        return await transformationSupplierProduct(supplierProductData);
      })
    );
    res.status(200).json({
      status: "success",
      page: page,
      data: transformedProducts,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
export const getAllProduct = async (req, res) => { // done
  let query = {};
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    let products;
    if(req.query.search){
      query.$or = [
        { title: new RegExp(`^${req.query.search}`, 'i') },
        { barcode: req.query.search }
      ];
    }
    if(req.query.searchToPurchase){
      query.title = new RegExp('^' + req.query.searchToPurchase, 'i');
    }
    if(req.query.category){
      query.category = new mongoose.Types.ObjectId(req.query.category);
    }
    if(req.query.subCategory){
      query.subCategory = new mongoose.Types.ObjectId(req.query.subCategory);
    }
    if(req.query.subSubCategory){
      query.subSubCategory = new mongoose.Types.ObjectId(req.query.subSubCategory);
    }

    let pipelineAggregation = [{ $match: query }];
    if(req.query.random){
      pipelineAggregation.push({ $sample: { size: +req.query.random } });
    } else {
      pipelineAggregation.push({ $skip: (page - 1) * limit }, { $limit: limit });
    }

    if(req.query.pagination === "notExist"){
      products = await Product.find(query);
    } else {
    products = await Product.aggregate(pipelineAggregation).exec();
    }
    const transformedProducts = await Promise.all(
      products.map(async (product) => await transformationProduct(product))
    );
    res.status(200).json({
      status: "success",
      page: page,
      totalPages: Math.ceil(await Product.countDocuments(query) / limit),
      data: transformedProducts,
    })
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
export const getProductsByOfferId = async (req, res) => { // done
  const offerId = req.params.id;
    try {
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(200).json({
        status: "success",
        data:[],
        message: "Offer not found",
      })
    }
    let offerProducts = [];
    for (const prod of offer.products) {
      const sp = await SupplierProduct.findById(prod.productId);
      offerProducts.push(await transformationSupplierProduct(sp, prod.quantity))
    }
    res.status(200).json({
      status: "success",
      data: offerProducts
    })
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
export const getProductByOrderId = async (req, res) => { // done
  const orderId = req.params.id;
  try {
    const order = await Order.findById(orderId).sort({createdAt: -1});
    res.status(200).json({
      status: "success",
      data: await transformationOrderProduct(order)
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
export const uploadProductImage = async (req, res) => { // done
  const productId = req.params.id;
  try{
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(207).json({
        status: "fail",
        message: "product not found"
      });
    }

    if (!req.file) {  // Check if the file is uploaded
      return res.status(400).json({  // 400 Bad Request
        status: "fail",
        message: "No image file provided"
      });
    }

    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';  // Default URL if SERVER_URL is not set
    const imagePath = `${serverUrl}${req.file.path.replace(/\\/g, '/').replace(/^upload\//, '')}`;
    product.images = product.images.concat([imagePath]);
    await product.save();
    res.status(200).json({
      status: "success",
      data: await transformationProduct(product),
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};
export const deleteProductImage = async (req, res) => { // done
  const productId = req.params.id;
  const productImage = req.body.image;
  try{
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(207).json({
        status: "fail",
        message: "product not found"
      });
    }

    const pathName = productImage.split('/').slice(3).join('/');
    fs.unlink('upload/' + pathName, (err) => {});
    product.images = product.images.filter(image => image !== productImage);
    await product.save();
    res.status(200).json({
      status: "success",
      data: await transformationProduct(product),
    });
   } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};
export const averagePriceForProduct = async (req, res) => { // done
  const productId = req.params.id;
  let gomlaAveragePrice = 0;
  let nosGomlaAveragePrice = 0;
  try {
    const supplierProducts = await SupplierProduct.find({ productId: productId });
    const NumberOfGomlaProduct = supplierProducts.filter(sp => sp.unit).length;
    const NumberOfNosGomlaProduct = supplierProducts.filter(sp => !sp.unit).length;
    for (const sp of supplierProducts) {
      if (sp.unit) {
        gomlaAveragePrice += sp.price
      } else {
        nosGomlaAveragePrice += sp.price
      }
    }
    res.status(200).json({
      status: "success",
      data: {
        gomlaAveragePrice: gomlaAveragePrice / NumberOfGomlaProduct,
        nosGomlaAveragePrice: nosGomlaAveragePrice / NumberOfNosGomlaProduct
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
}
export const getProductBySubCategory = async (req, res) => { // done
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const titleSearch = req.query.search ? new RegExp(req.query.search, 'i') : null;
    const supplierProducts = await SupplierProduct.aggregate([
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplierId',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      { $unwind: "$supplierInfo" },
      { $match: { "supplierInfo.isDeleted": false } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: "$productInfo" },
      { $match: { "productInfo.subCategory": new mongoose.Types.ObjectId(req.params.id) } },
      ...(titleSearch ? [{ $match: { "productInfo.title": titleSearch } }] : []),
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          createdAt: 1,
          supplierId: 1,
          supplierName: "$supplierInfo.name"
        }
      }
    ]);

    const transformedProducts = await Promise.all(
      supplierProducts.map(async (supplierProduct) => {
        const supplierProductData = await SupplierProduct.findById(supplierProduct._id);
        return await transformationSupplierProduct(supplierProductData);
      })
    );
    res.status(200).json({
      status: "success",
      page: page,
      data: transformedProducts,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
}
export const getBestProduct = async (req, res) => { // done
  try {
    const supplierProducts = await SupplierProduct.aggregate([
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplierId',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      { $unwind: "$supplierInfo" },
      { $match: { "supplierInfo.isDeleted": false } },
      { $group: { _id: "$productId", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { frequency: -1 } },
      { $limit: 10 }
    ]);
    const formattedProducts = await Promise.all(
      supplierProducts.map(async (supplierProduct) => await transformationSupplierProduct(supplierProduct))
    );
    res.status(200).json({
      status: "success",
      data: formattedProducts
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message
    });
  }
}
export const getProductByMl5saty = async (req, res) => { // done
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    let query = {};
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    } else if (req.query.subSubCategory) {
      query.subSubCategory = new mongoose.Types.ObjectId(req.query.subSubCategory);
    } else if (req.query.subCategory) {
      query.subCategory = new mongoose.Types.ObjectId(req.query.subCategory);
    } else if (req.query.category) {
      query.category = new mongoose.Types.ObjectId(req.query.category);
    }

    const products = await Product.find(query);
    const results = await SupplierProduct.aggregate([
      { $match: { productId: { $in: products.map(product => product._id) } } },
      {
        $lookup: {
          from: "suppliers",
          localField: "supplierId",
          foreignField: "_id",
          as: "supplier"
        }
      },
      { $match: { "supplier.isDeleted": false } },
      {
        $facet: {
          unitProducts: [
            { $match: { unit: { $ne: null } } },
            {
              $group: {
                _id: "$productId",
                minPriceDoc: { $min: "$price" },
                docs: { $push: "$$ROOT" }
              }
            },
            {
              $addFields: {
                minPriceDoc: {
                  $filter: {
                    input: "$docs",
                    as: "doc",
                    cond: { $eq: ["$$doc.price", "$minPriceDoc"] }
                  }
                }
              }
            },
            { $unwind: "$minPriceDoc" },
            {
              $project: {
                _id: 1,
                minPrice: "$minPriceDoc.price",
                supplierProductId: "$minPriceDoc._id"
              }
            },
            { $sort: { minPrice: 1 } },
            { $skip: skip },
            { $limit: limit }
          ],
          subUnitProducts: [
            { $match: { unit: { $eq: null } } },
            {
              $group: {
                _id: "$productId",
                minPriceDoc: { $min: "$price" },
                docs: { $push: "$$ROOT" }
              }
            },
            {
              $addFields: {
                minPriceDoc: {
                  $filter: {
                    input: "$docs",
                    as: "doc",
                    cond: { $eq: ["$$doc.price", "$minPriceDoc"] }
                  }
                }
              }
            },
            { $unwind: "$minPriceDoc" },
            {
              $project: {
                _id: 1,
                minPrice: "$minPriceDoc.price",
                supplierProductId: "$minPriceDoc._id"
              }
            },
            { $sort: { minPrice: 1 } },
            { $skip: skip },
            { $limit: limit }
          ]
        }
      }
    ]);
    
    // Combine and sort the results if needed
    const unitProducts = results[0].unitProducts;
    const subUnitProducts = results[0].subUnitProducts;
    const combinedResults = [...unitProducts, ...subUnitProducts];
    combinedResults.sort((a, b) => a.minPrice - b.minPrice);
    
    const transformedProducts = await Promise.all(
      combinedResults.map(async (supplierProduct) => {
        const supplierProductData = await SupplierProduct.findById(supplierProduct.supplierProductId);
        return await transformationSupplierProduct(supplierProductData);
      })
    );
    return res.status(200).json({
      status: "success",
      page: page,
      data: transformedProducts
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
export const getProductByProductId = async (req, res) => { // done
  try{
    const product = await Product.findById(req.params.id);
    res.status(200).json({
      status: "success",
      data: await transformationProduct(product)
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
}

