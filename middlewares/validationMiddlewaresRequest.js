
import { body, check, validationResult } from "express-validator";
import mongoose from "mongoose";
import Period from "../models/store.models/periodSchema.js";
import Admin from "../models/adminSchema.js";
import Unit from "../models/unitSchema.js";
import SubUnit from "../models/subUnitSchema.js";
import Product from "../models/productSchema.js";
import Inventory from "../models/store.models/inventorySchema.js";
import SupplierInventory from "../models/store.models/supplierInventorySchema.js";
import PurchaseItem from "../models/store.models/purchaseItemSchema.js";
import CustomerInventory from "../models/store.models/customerInventorySchema.js";
import SaleItem from "../models/store.models/saleItemSchema.js";
import Category from "../models/categorySchema.js";
import SubCategory from "../models/subCategorySchema.js";
import SubSubCategory from "../models/subSubCategorySchema.js";

/************************************ Admin Middlewares ************************************/
export const validateCreateAdmin = [
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email"),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be a string"),

  check("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["admin", "subAdmin"])
    .withMessage("Type must be admin or subAdmin"),

  check("period")
    .isArray()
    .withMessage("Period must be an array")
    .custom(async (value) => {
      if (!Array.isArray(value)) {
        throw new Error("Period must be an array");
      }

      for (const id of value) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid period ID: ${id}`);
        }

        const periodExists = await Period.findById(id);
        if (!periodExists) {
          throw new Error(`Period with ID ${id} does not exist`);
        }
      }
      return true;
    }),

  check("roles")
    .optional()
    .isObject()
    .withMessage("Roles must be an object")
    .custom((roles) => {
      if (roles) {
        for (const [key, value] of Object.entries(roles)) {
          if (typeof value !== "boolean") {
            throw new Error(`Role key ${key} must have a boolean value`);
          }
        }
      }
      return true;
    }),


  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateAdmin = [
  check("id")
    .isMongoId()
    .withMessage("Admin ID must be a valid MongoDB ObjectId")
    .custom(async (id) => {
      const admin = await Admin.findById(id);
      if (!admin) {
        throw new Error("Admin ID does not exist");
      }
      return true;
    }),

  check("name").optional().isString().withMessage("Name must be a string"),

  check("email")
    .optional()
    .isEmail()
    .withMessage("Email must be a valid email"),

  check("password")
    .optional()
    .isString()
    .withMessage("Password must be a string"),

  check("type")
    .optional()
    .isIn(["admin", "subAdmin"])
    .withMessage("Type must be admin or subAdmin"),

  check("period")
    .optional()
    .isArray()
    .withMessage("Period must be an array")
    .custom(async (value) => {
      if (!Array.isArray(value)) {
        throw new Error("Period must be an array");
      }

      for (const id of value) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid period ID: ${id}`);
        }

        const periodExists = await Period.findById(id);
        if (!periodExists) {
          throw new Error(`Period with ID ${id} does not exist`);
        }
      }
      return true;
    }),

  check("roles")
    .optional()
    .isObject()
    .withMessage("Roles must be an object")
    .custom((roles) => {
      if (roles) {
        for (const [key, value] of Object.entries(roles)) {
          if (typeof value !== "boolean") {
            throw new Error(`Role: ${key} must have a boolean value`);
          }
        }
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

/************************************ Product Middlewares ************************************/
export const validateCreateProduct = [
  check("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),

  // check("desc")
  //   .notEmpty()
  //   .withMessage("Desc is required")
  //   .isString()
  //   .withMessage("Desc must be a string"),

  // check("weight")
  //   .notEmpty()
  //   .withMessage("Weight is required")
  //   .isFloat({ min: 0 })
  //   .withMessage("Weight must be a positive integer"),

  check("barcode")
    .notEmpty()
    .withMessage("Barcode is required")
    .isString()
    .withMessage("Barcode must be a string"),

  check("units")
    .notEmpty()
    .withMessage("Units is required")
    .isArray()
    .withMessage("Units must be an array"),

  body("units.*._id")
    .notEmpty()
    .withMessage("_id is required")
    .isMongoId()
    .withMessage("_id must be a valid MongoDB ID")
    .custom(async (_id) => {
      const unitExists = await Unit.findById(_id);
      if (!unitExists) {
        throw new Error("unit not found in Unit collection");
      }
      return true;
    }),

  check("subUnit._id")
    .notEmpty()
    .withMessage("SubUnit is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid SubUnit");
      }
      const subUnitExist = await SubUnit.findById(value);
      if (!subUnitExist) {
        throw new Error("SubUnit does not exist");
      }
    }),

  check("category._id")
    .notEmpty()
    .withMessage("Category is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Category");
      }
      const categoryExist = await Category.findById(value);
      if (!categoryExist) {
        throw new Error("Category does not exist");
      }
    }),

  // check("subCategory._id")
  //   .notEmpty()
  //   .withMessage("SubCategory is required")
  //   .custom(async (value) => {
  //     if (!mongoose.Types.ObjectId.isValid(value)) {
  //       throw new Error("Invalid SubCategory");
  //     }
  //     const subCategoryExist = await SubCategory.findById(value);
  //     if (!subCategoryExist) {
  //       throw new Error("SubCategory does not exist");
  //     }
  //   }),

  // check("subSubCategory._id")
  //   .notEmpty()
  //   .withMessage("SubSubCategory is required")
  //   .custom(async (value) => {
  //     if (!mongoose.Types.ObjectId.isValid(value)) {
  //       throw new Error("Invalid SubSubCategory");
  //     }
  //     const subSubCategoryExist = await SubSubCategory.findById(value);
  //     if (!subSubCategoryExist) {
  //       throw new Error("SubSubCategory does not exist");
  //     }
  //   }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateProduct = [
  check("title")
    .optional()
    .isString()
    .withMessage("Title must be a string"),

  check("desc")
    .optional()
    .isString()
    .withMessage("Desc must be a string"),

  check("weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive integer"),

  check("barcode")
    .optional()
    .isString()
    .withMessage("Barcode must be a string"),

  check("units")
    .optional()
    .isArray()
    .withMessage("Units must be an array"),

  body("units.*._id")
    .notEmpty()
    .withMessage("_id is required")
    .isMongoId()
    .withMessage("_id must be a valid MongoDB ID")
    .custom(async (_id) => {
      const unitExists = await Unit.findById(_id);
      if (!unitExists) {
        throw new Error("unit not found in Unit collection");
      }
      return true;
    }),

  check("subUnit._id")
    .optional()
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid SubUnit");
      }
      const subUnitExist = await SubUnit.findById(value);
      if (!subUnitExist) {
        throw new Error("SubUnit does not exist");
      }
    }),

  check("category._id")
    .optional()
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Category");
      }
      const categoryExist = await Category.findById(value);
      if (!categoryExist) {
        throw new Error("Category does not exist");
      }
    }),

  check("subCategory._id")
    .optional()
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid SubCategory");
      }
      const subCategoryExist = await SubCategory.findById(value);
      if (!subCategoryExist) {
        throw new Error("SubCategory does not exist");
      }
    }),

  check("subSubCategory._id")
    .optional()
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid SubSubCategory");
      }
      const subSubCategoryExist = await SubSubCategory.findById(value);
      if (!subSubCategoryExist) {
        throw new Error("SubSubCategory does not exist");
      }
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

/************************************ Unit Middlewares ************************************/
export const validateCreateUnit = [
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  check("maxNumber")
    .notEmpty()
    .withMessage("MaxNumber is required")
    .isFloat({ min: 0 })
    .withMessage("MaxNumber must be a positive integer"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateUnit = [
  check("id")
    .isMongoId()
    .withMessage("Unit ID must be a valid MongoDB ObjectId")
    .custom(async (id) => {
      const unit = await Unit.findById(id);
      if (!unit) {
        throw new Error("Unit ID does not exist");
      }
      return true;
    }),

  check("name").optional().isString().withMessage("Name must be a string"),

  check("maxNumber")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("MaxNumber must be a positive integer"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

/************************************ SubUnit Middlewares ************************************/
export const validateCreateSubUnit = [
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateSubUnit = [
  check("id")
    .isMongoId()
    .withMessage("SubUnit ID must be a valid MongoDB ObjectId")
    .custom(async (id) => {
      const subUnit = await SubUnit.findById(id);
      if (!subUnit) {
        throw new Error("SubUnit ID does not exist");
      }
      return true;
    }),

  check("name").optional().isString().withMessage("Name must be a string"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

/************************************ Inventory Middlewares ************************************/
export const validateCreateInventory = [
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

/************************************ SupplierInventory Middlewares ************************************/
export const validateCreateSupplierInventory = [
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  check("phoneNumber")
    .notEmpty()
    .withMessage("PhoneNumber is required")
    .isString()
    .withMessage("PhoneNumber must be a string"),

  check("address")
    .notEmpty()
    .withMessage("Address is required")
    .isString()
    .withMessage("Address must be a string"),

  check("credit")
    .notEmpty()
    .withMessage("Credit is required")
    .isFloat()
    .withMessage("Credit must be a float"),

  check("debit")
    .notEmpty()
    .withMessage("Debit is required")
    .isFloat()
    .withMessage("Debit must be a float"),

  check("admin")
    .notEmpty()
    .withMessage("Admin is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Admin");
      }
      const adminExists = await Admin.findById(value);
      if (!adminExists) {
        throw new Error("Admin does not exist");
      }
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateSupplierInventory = [
  check("name")
    .optional()
    .isString()
    .withMessage("Name must be a string"),

  check("phoneNumber")
    .optional()
    .isString()
    .withMessage("PhoneNumber must be a string"),

  check("address")
    .optional()
    .isString()
    .withMessage("Address must be a string"),

  check("credit")
    .optional()
    .isFloat()
    .withMessage("Credit must be a float"),

  check("debit")
    .optional()
    .isFloat()
    .withMessage("Debit must be a float"),

  check("admin")
    .optional()
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Admin");
      }
      const adminExists = await Admin.findById(value);
      if (!adminExists) {
        throw new Error("Admin does not exist");
      }
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

/************************************ CustomerInventory Middlewares ************************************/
export const validateCreateCustomerInventory = [
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  check("phoneNumber")
    .notEmpty()
    .withMessage("PhoneNumber is required")
    .isString()
    .withMessage("PhoneNumber must be a string"),

  check("address")
    .notEmpty()
    .withMessage("Address is required")
    .isString()
    .withMessage("Address must be a string"),

  check("credit")
    .notEmpty()
    .withMessage("Credit is required")
    .isFloat()
    .withMessage("Credit must be a float"),

  check("debit")
    .notEmpty()
    .withMessage("Debit is required")
    .isFloat()
    .withMessage("Debit must be a float"),

  check("admin")
    .notEmpty()
    .withMessage("Admin is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Admin");
      }
      const adminExists = await Admin.findById(value);
      if (!adminExists) {
        throw new Error("Admin does not exist");
      }
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateCustomerInventory = [
  check("name")
    .optional()
    .isString()
    .withMessage("Name must be a string"),

  check("phoneNumber")
    .optional()
    .isString()
    .withMessage("PhoneNumber must be a string"),

  check("address")
    .optional()
    .isString()
    .withMessage("Address must be a string"),

  check("credit")
    .optional()
    .isFloat()
    .withMessage("Credit must be a float"),

  check("debit")
    .optional()
    .isFloat()
    .withMessage("Debit must be a float"),

  check("admin")
    .optional()
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Admin");
      }
      const adminExists = await Admin.findById(value);
      if (!adminExists) {
        throw new Error("Admin does not exist");
      }
    }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];
/************************************ Purchase Middlewares ************************************/
export const validateCreatePurchase = [
  check("admin")
    .notEmpty()
    .withMessage("Admin is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Admin");
      }
      const adminExists = await Admin.findById(value);
      if (!adminExists) {
        throw new Error("Admin does not exist");
      }
    }),

  check("inventory._id")
    .notEmpty()
    .withMessage("Inventory is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Inventory");
      }
      const inventoryExists = await Inventory.findById(value);
      if (!inventoryExists) {
        throw new Error("Inventory does not exist");
      }
    }),

  check("customerSupplierInventory._id")
    .notEmpty()
    .withMessage("customerSupplierInventory is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid SupplierInventory");
      }
      const supplierInventoryExists = await SupplierInventory.findById(value);
      if (!supplierInventoryExists) {
        throw new Error("SupplierInventory does not exist");
      }
    }),

  check("note").custom(async (note) => {
    if (note === null || typeof note === "string") {
      return true;
    } else {
      throw new Error("Note must be a string or null");
    }
  }),

  check("totalAmount")
    .notEmpty()
    .withMessage("TotalAmount is required")
    .isFloat()
    .withMessage("TotalAmount must be a float"),

  check("paidAmount")
    .notEmpty()
    .withMessage("PaidAmount is required")
    .isFloat()
    .withMessage("PaidAmount must be a float"),

  check("dueAmount")
    .notEmpty()
    .withMessage("DueAmount is required")
    .isFloat()
    .withMessage("DueAmount must be a float"),

  check("taxes")
    .notEmpty()
    .withMessage("Taxes is required")
    .isFloat({ min: 0 })
    .withMessage("Taxes must be a float, min: 0"),

  /** products */
  check("products")
    .notEmpty()
    .withMessage("Products is required")
    .isArray()
    .withMessage("Products must be an array"),

  body("products.*._id")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ID")
    .custom(async (productId) => {
      const productExists = await Product.findById(productId);
      if (!productExists) {
        throw new Error("Product not found in Product collection");
      }
      return true;
    }),

  body("products.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a Integer"),

  body("products.*.costPrice")
    .notEmpty()
    .withMessage("CostPrice is required")
    .isFloat()
    .withMessage("CostPrice must be a float"),

  body("products.*.retailPrice")
    .notEmpty()
    .withMessage("RetailPrice is required")
    .isFloat()
    .withMessage("RetailPrice must be a float"),

  body("products.*.wholesalePrice")
    .notEmpty()
    .withMessage("WholesalePrice is required")
    .isFloat()
    .withMessage("WholesalePrice must be a float"),

  body("products.*.haveWholeSalePrice")
    .notEmpty()
    .withMessage("HaveWholeSalePrice is required")
    .isFloat()
    .withMessage("HaveWholeSalePrice must be a float"),

  // body("products.*.productionDate")
  //   .notEmpty()
  //   .withMessage("ProductionDate weight is required")
  //   .isISO8601()
  //   .withMessage("ProductionDate weight must be a date"),

  body("products.*.expiryDate")
    .custom((value) => {
      if (value === null) {    // Allow null value
        return true;
      }
      
      // Check if it's a valid ISO8601 date
      // if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
      //   throw new Error("ExpiryDate must be a valid ISO8601 date");
      // }

      const expiryDate = new Date(value);
      const maxDate = new Date("2500-01-01T00:00:00.000Z");

      if (expiryDate > maxDate) { // Check if the date is less than 2500-01-01T00:00:00.000Z
        throw new Error("ExpiryDate must be before 2500-01-01T00:00:00.000Z");
      }

      return true;
    }),

  body("products.*.unit._id")
    .notEmpty()
    .withMessage("Product UnitId is required")
    .isMongoId()
    .withMessage("Product UnitId must be a valid MongoDB ID")
    .custom(async (unitId) => {
      const unitExists = await Unit.findById(unitId);
      if (!unitExists) {
        throw new Error("UnitId not found in Unit collection");
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

export const validateReturnPurchase = [
  check("cash")
    .notEmpty()
    .withMessage("Cash is required")
    .isBoolean()
    .withMessage("Cash must be a boolean"),

  check("admin")
    .notEmpty()
    .withMessage("Admin is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Admin");
      }
      const adminExists = await Admin.findById(value);
      if (!adminExists) {
        throw new Error("Admin does not exist");
      }
    }),


  /** products */
  check("products")
    .notEmpty()
    .withMessage("Products is required")
    .isArray()
    .withMessage("Products must be an array"),

  body("products.*.productItemId")
    .notEmpty()
    .withMessage("ProductItemId is required")
    .isMongoId()
    .withMessage("ProductItemId must be a valid MongoDB ID")
    .custom(async (productItemId) => {
      const productItemExists = await PurchaseItem.findById(productItemId);
      if (!productItemExists) {
        throw new Error("Product not found in PurchaseItem collection");
      }
      return true;
    }),

  body("products.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a Integer"),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

/************************************ Sale Middlewares ************************************/
export const validateCreateSale = [
  check("admin")
    .notEmpty()
    .withMessage("Admin is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Admin");
      }
      const adminExists = await Admin.findById(value);
      if (!adminExists) {
        throw new Error("Admin does not exist");
      }
    }),

  check("inventory._id")
    .notEmpty()
    .withMessage("Inventory is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Inventory");
      }
      const inventoryExists = await Inventory.findById(value);
      if (!inventoryExists) {
        throw new Error("Inventory does not exist");
      }
    }),

  check("customerSupplierInventory._id")
    .optional()
    .custom(async (value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid SupplierInventory");
      }
      if (value) {
        const customerInventoryExists = await CustomerInventory.findById(value);
        if (!customerInventoryExists) {
          throw new Error("CustomerInventory does not exist");
        }
      }
    })
    .withMessage("customerSupplierInventory is required when present"),

  check("note").custom(async (note) => {
    if (note === null || typeof note === "string") {
      return true;
    } else {
      throw new Error("Note must be a string or null");
    }
  }),

  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isString()
    .withMessage("Type must be a string")
    .custom((value) => {
      const allowedTypes = ['gomla', 'nosGomla', 'retail'];
      if (!allowedTypes.includes(value)) {
        throw new Error("Type must be one of 'gomla', 'nosGomla' or 'retail'");
      }
      return true;
    }),

  check("totalAmount")
    .notEmpty()
    .withMessage("TotalAmount is required")
    .isFloat()
    .withMessage("TotalAmount must be a float"),

  check("paidAmount")
    .notEmpty()
    .withMessage("PaidAmount is required")
    .isFloat()
    .withMessage("PaidAmount must be a float"),

  check("dueAmount")
    .notEmpty()
    .withMessage("DueAmount is required")
    .isFloat()
    .withMessage("DueAmount must be a float"),

  check("taxes")
    .notEmpty()
    .withMessage("Taxes is required")
    .isFloat({ min: 0 })
    .withMessage("Taxes must be a float, min: 0"),

  /** products */
  check("products")
    .notEmpty()
    .withMessage("Products is required")
    .isArray()
    .withMessage("Products must be an array"),

  body("products.*._id")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ID")
    .custom(async (productId) => {
      const productExists = await Product.findById(productId);
      if (!productExists) {
        throw new Error("Product not found in Product collection");
      }
      return true;
    }),

  body("products.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a Integer"),

  body("products.*.salePrice")
    .notEmpty()
    .withMessage("SalePrice is required")
    .isFloat()
    .withMessage("SalePrice must be a float"),

  body("products.*.unit._id")
    .custom(async (value, { req }) => {
      const type = req.body.type;
      if (type === 'retail') {
        return true;
      }

      if (!value) {
        throw new Error("Product UnitId is required when type is not 'retail'");
      }
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Product UnitId must be a valid MongoDB ID");
      }
      const unitExists = await Unit.findById(value);
      if (!unitExists) {
        throw new Error("unit not found in Unit collection");
      }

      return true;
    }),

  body("products.*.subUnit._id")
    .notEmpty()
    .withMessage("Product SubUnitId is required")
    .isMongoId()
    .withMessage("Product SubUnitId must be a valid MongoDB ID")
    .custom(async (subUnitId) => {
      const subUnitExists = await SubUnit.findById(subUnitId);
      if (!subUnitExists) {
        throw new Error("SubUnitId not found in SubUnit collection");
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

export const validateReturnSale = [
  check("cash")
    .notEmpty()
    .withMessage("Cash is required")
    .isBoolean()
    .withMessage("Cash must be a boolean"),

  check("admin")
    .notEmpty()
    .withMessage("Admin is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Admin");
      }
      const adminExists = await Admin.findById(value);
      if (!adminExists) {
        throw new Error("Admin does not exist");
      }
    }),

  /** products */
  check("products")
    .notEmpty()
    .withMessage("Products is required")
    .isArray()
    .withMessage("Products must be an array"),

  body("products.*.productItemId")
    .notEmpty()
    .withMessage("ProductItemId is required")
    .isMongoId()
    .withMessage("ProductItemId must be a valid MongoDB ID")
    .custom(async (productItemId) => {
      const saleItemExists = await SaleItem.findById(productItemId);
      if (!saleItemExists) {
        throw new Error("Product not found in SaleItem collection");
      }
      return true;
    }),

  body("products.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a Integer"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

/************************************ Settlement Middlewares ************************************/
export const validatePostSettlement = [
  check("inventoryId")
    .notEmpty()
    .withMessage("Inventory is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Inventory");
      }
      const inventoryExists = await Inventory.findById(value);
      if (!inventoryExists) {
        throw new Error("Inventory does not exist");
      }
    }),

  /** products */
  check("products")
    .notEmpty()
    .withMessage("Products is required"),

  body("products.*.productItemId")
    .notEmpty()
    .withMessage("ProductItemId is required")
    .isMongoId()
    .withMessage("ProductItemId must be a valid MongoDB ID")
    .custom(async (productItemId) => {
      const productItemExists = await PurchaseItem.findById(productItemId);
      if (!productItemExists) {
        throw new Error("ProductItem not found in PurchaseItem collection");
      }
      return true;
    }),

  body("products.*.reminderQuantity")
    .notEmpty()
    .withMessage("ReminderQuantity is required")
    .isInt({ min: 0 })
    .withMessage("ReminderQuantity must be a Integer"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

export const validatePatchSettlement = [
  check("admin")
    .notEmpty()
    .withMessage("Admin is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Admin");
      }
      const adminExists = await Admin.findById(value);
      if (!adminExists) {
        throw new Error("Admin does not exist");
      }
    }),

  check("inventoryId")
    .notEmpty()
    .withMessage("Inventory is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Inventory");
      }
      const inventoryExists = await Inventory.findById(value);
      if (!inventoryExists) {
        throw new Error("Inventory does not exist");
      }
    }),

  /** products */
  check("products")
    .notEmpty()
    .withMessage("Products is required")
    .isArray()
    .withMessage("Products must be an array"),

  body("products.*.productItemId")
    .notEmpty()
    .withMessage("productItemId is required")
    .isMongoId()
    .withMessage("productItemId must be a valid MongoDB ID")
    .custom(async (productId) => {
      const purchaseItemExists = await PurchaseItem.findById(productId);
      if (!purchaseItemExists) {
        throw new Error("PurchaseItem not found in PurchaseItem collection");
      }
      return true;
    }),

  body("products.*.reminderQuantity")
    .notEmpty()
    .withMessage("ReminderQuantity is required")
    .isInt({ min: 0 })
    .withMessage("ReminderQuantity must be a Integer"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];

/************************************ DetailedAccount Middlewares ************************************/
export const validateCreateDetailedAccount = [
  check("admin")
    .notEmpty()
    .withMessage("Admin is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Admin");
      }
      const adminExists = await Admin.findById(value);
      if (!adminExists) {
        throw new Error("Admin does not exist");
      }
    }),

  body("deposit")
    .notEmpty()
    .withMessage("Deposit is required")
    .isFloat()
    .withMessage("Deposit must be a float"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }
    next();
  },
];