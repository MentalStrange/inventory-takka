import mongoose from "mongoose";
import SupplierProduct from "./supplierProductSchema.js";

const supplierSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Supplier Should have a name"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Supplier Should have an phoneNumber"],
    unique: [true, "PhoneNumber Should be unique"],
  },
  password: {
    type: String,
    required: [true, "Supplier Should have a password"],
  },
  nationalId: {
    type: Number,
    required: [true, "Supplier Should have a National Id"],
    // unique: true,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  desc: {
    type: String,
  },
  minOrderPrice: {
    type: Number,
    required: [true, "Supplier Should have a Minimum Receipt"],
  },
  deliveryRegion: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
    },
  ],
  workingDays: [
    {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },
  ],
  resetCode: {
    type: Number
  },
  workingHours: [
    {
      type: Number,
    },
  ],
  type: {
    type: String,
    enum: ["gomla", "nosGomla", "gomlaGomla", "company", "blackHorse"],
  },
  image: {
    type: String,
  },
  placeImage: [
    {
      type: String,
    },
  ],
  deliveryDaysNumber: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    // default: "active",
  },
  totalRating: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deviceToken:{
    type:String,
  }
});
supplierSchema.pre("remove", async function (next) {
  try {
    await SupplierProduct.deleteMany({ supplierId: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;
