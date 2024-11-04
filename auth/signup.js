import Customer from "../models/customerSchema.js";
import Supplier from "../models/supplierSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { transformationCustomer, transformationSupplier } from "../format/transformationObject.js";
import Region from "../models/regionSchema.js";
import { return5RandomNumber, sendSMS } from "../utils/pushNotificationAndSendSMS.js";
const salt = 10;

export const createSupplier = async (req, res) => {
  const supplierData = req.body;
  const supplierPhoneNumber = req.body.phoneNumber;
  const regionsId = req.body.deliveryRegion;
  try {
    // Check for existing supplier using findOne
    const existingSupplier = await Supplier.findOne({ phoneNumber: supplierPhoneNumber });
    if (existingSupplier) {
      return res.status(207).json({
        status: "fail",
        message: "Supplier already exists",
      });
    }  
    // Initialize deliveryRegion
    let deliveryRegion = [];
    if (regionsId && regionsId.length > 0) {
      for (let i = 0; i < regionsId.length; i++) {
        const region = regionsId[i];
        const regionName = await Region.findById(region);
        if (!regionName) {
          return res.status(208).json({
            status: "fail",
            message: `Region with ID ${region} not found`,
          });
        }
        deliveryRegion.push(regionName._id);
      }
    }
    // const workingHours = req.body.workingHours;
    // if (!validateWorkingHours(workingHours)) {
    //   return res.status(208).json({
    //     status: "fail",
    //     message: "Invalid working hours. Please make sure the start hour is before the end hour and both are within the range of 0 to 23.",
    //   });
    // }
    // All regions are valid, proceed with supplier creation
    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, salt);
    const newSupplier = await Supplier.create({
      name: supplierData.name,
      phoneNumber: supplierPhoneNumber,
      image: supplierData.image || "",
      nationalId: supplierData.nationalId,
      minOrderPrice: supplierData.minOrderPrice,
      deliveryRegion: deliveryRegion, // Assign deliveryRegion here
      workingDays: supplierData.workingDays,
      workingHours: supplierData.workingHours,
      deliveryDaysNumber: supplierData.deliveryDaysNumber || 0,
      type: supplierData.type,
      password: hashedPassword,
      desc: supplierData.desc,
      wallet: supplierData.wallet,
      placeImage: supplierData.placeImage,
    });
    // Determine supplier status
    let status = "active";
    Object.entries(newSupplier.toObject()).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length === 0) {
        status = "inactive";
      } else if (typeof value === "string" && value.trim() === "") {
        status = "inactive";
      } else if (typeof value === "number" && isNaN(value)) {
        status = "inactive";
      }
    });

    newSupplier.status = status;
    await newSupplier.save();
    return res.status(201).json({
      status: "success",
      data: await transformationSupplier(newSupplier),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const createCustomer = async (req, res) => {
  const customerData = req.body;
  const customerPhoneNumber = req.body.phoneNumber;
  try {
    const customerVerifyCode = return5RandomNumber();
    let newCustomer = new Customer({
      ...customerData,
      verifyCode: customerVerifyCode,
      password: await bcrypt.hash(req.body.password.toString(), salt),
    });

    const oldCustomer = await Customer.findOne({ phoneNumber: customerPhoneNumber});
    if (oldCustomer && oldCustomer.isVerify === true) {
      return res.status(219).json({
        status: "fail",
        message: req.headers["language"] === "en" ? "phoneNumber already exists" : "رقم الهاتف موجود بالفعل",
      });
    } else if (oldCustomer && oldCustomer.isVerify === false) {
      delete newCustomer._doc._id;
      newCustomer = await Customer.findByIdAndUpdate(oldCustomer._id, newCustomer, { new: true });
    } else {
      await newCustomer.save();
    }

    sendSMS(customerPhoneNumber, customerVerifyCode, "verify");
    const customer = await transformationCustomer(newCustomer);
    res.status(201).json({
      status: "success",
      data: {...customer, access_token: jwt.sign({_id: newCustomer._id, role: "customer"}, process.env.JWT_SECRET, {})},
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message
    });
  }
};
