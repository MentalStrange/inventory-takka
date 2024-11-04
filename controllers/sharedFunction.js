import Product from "../models/productSchema.js";
import Customer from "../models/customerSchema.js";
import Rating from "../models/ratingSchema.js";
import Supplier from "../models/supplierSchema.js";
import { transformationProduct } from "../format/transformationObject.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import SupplierProduct from "../models/supplierProductSchema.js";
import Offer from "../models/offerSchema.js";

export const createProduct = async (req, res) => {
  const productData = req.body;
  const productTitle = req.body.title;
  try {
    const oldProduct = await Product.find({ title: productTitle });
    if (oldProduct.length > 0) {
      return res.status(207).json({
        status: "fail",
        message: "Title already exists",
      });
    }
    const oldBarcode = await Product.find({ barcode: productData.barcode });
    if (oldBarcode.length > 0) {
      return res.status(208).json({
        status: "fail",
        message: "Barcode already exists",
      });
    }
    console.log(req.body);
    const newProduct = new Product({
      title: productTitle,
      desc: req.body.desc ?? "",
      weight: req.body.weight ?? "",
      units: req.body.units.map(({ _id }) => _id),
      subUnit: req.body.subUnit._id,
      category: req.body.category._id,
      subCategory: req.body.subCategory ? req.body.subCategory._id : null,
      subSubCategory: req.body.subSubCategory ? req.body.subSubCategory._id : null,
      barcode: req.body.barcode,
      // images: req.files.map(file => `${process.env.SERVER_URL}${file.path.replace(/\\/g, '/').replace(/^upload\//, '')}`)
    });
    await newProduct.save();
    res.status(201).json({
      status: "success",
      data: await transformationProduct(newProduct),
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  const productId = req.params.id;
  const productData = req.body;
  try {
    if (productData.units) {
      productData.units = productData.units.map(({ _id }) => _id);
    }
    if (productData.subUnit) {
      productData.subUnit = productData.subUnit._id;
    }
    if (productData.category) {
      productData.category = productData.category._id;
    }
    if (productData.subCategory) {
      productData.subCategory = productData.subCategory._id;
    }
    if (productData.subSubCategory) {
      productData.subSubCategory = productData.subSubCategory._id;
    }
    const updatedProduct = await Product.findByIdAndUpdate(productId, productData, { new: true });
    if (updatedProduct) {
      res.status(200).json({
        status: "success",
        data: await transformationProduct(updatedProduct),
      });
    } else {
      throw new Error(`Product not found`);
    }
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.title === 1) {
      res.status(207).json({
        status: "fail",
        message: "Duplicate title",
      });
    } else if (error.code === 11000 && error.keyPattern && error.keyPattern.barcode === 1) {
      res.status(208).json({
        status: "fail",
        message: "Duplicate barcode",
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }
};

export const deleteProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    const supplierProduct = await SupplierProduct.findOne({ productId });
    if (supplierProduct) {
      return res.status(207).json({
        status: "fail",
        message: "Product is used in supplier products",
      });
    }
    const deletionResult = await Product.deleteOne({ _id: productId });
    if (deletionResult.deletedCount > 0) {
      await SupplierProduct.deleteMany({ productId: productId });
      res.status(200).json({
        status: "success",
        message: "Product deleted successfully.",
      });
    } else {
      throw new Error("Product not found.");
    }
  } catch (error) {
    res.status(error.statusCode || 404).json({
      status: "fail",
      message: error.message || "Not Found",
    });
  }
};

export const calcAvgRating = async (userId, isCustomer) => {
  if (isCustomer) {
    // If the user is a customer
    const supplier = await Supplier.findById(userId);
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    const ratings = await Rating.find({
      supplierId: userId,
      userType: "customer",
    });
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rate, 0);
    supplier.averageRating =
      ratings.length > 0 ? totalRating / ratings.length : 0;
    await supplier.save();
  } else {
    // If the user is a supplier
    const customer = await Customer.findById(userId);
    if (!customer) {
      throw new Error("Customer not found");
    }
    const ratings = await Rating.find({
      customerId: userId,
      userType: "supplier",
    });
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rate, 0);
    customer.averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;
    await customer.save();
  }
};

export const storage = (folderName) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(`upload/${folderName}`, { recursive: true });
      cb(null, `upload/${folderName}`);
    },
    filename: (req, file, cb) => {
      cb(
        null,
        `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
      );
    },
  });

export const checkActiveSupplier = async (updatedSupplier) => {
  // checkActive if any required fields are empty or missing
  let status = "active"; // Assume status is active by default
  Object.entries(updatedSupplier.toObject()).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length === 0) {
      status = "inactive";
    } else if (typeof value === "string" && value.trim() === "") {
      status = "inactive";
    } else if (typeof value === "number" && isNaN(value)) {
      status = "inactive";
    }
  });
  updatedSupplier.status = status;
  await updatedSupplier.save();
  return updatedSupplier;
};

export const backProductsToSupplierStock = async (order, isBeforeEditedOrder=false) => {
  const products = isBeforeEditedOrder ? order.beforeEditedProducts : order.products;
  const offers = isBeforeEditedOrder ? order.beforeEditedOffers : order.offers;
  for (const product of products) {
    const sp = await SupplierProduct.findById(product.product);
    sp.stock += product.quantity;
    await sp.save();
  }

  for (const offer of offers) {
    const offerData = await Offer.findById(offer.offer);
    offerData.stock += offer.quantity;
    await offerData.save();

    for (const iterProduct of offerData.products) {
      const sp = await SupplierProduct.findById(iterProduct.productId);
      sp.stock += iterProduct.quantity * offer.quantity;
      await sp.save();
    }
  }
};
