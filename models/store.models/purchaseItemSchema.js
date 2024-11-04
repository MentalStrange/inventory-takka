import mongoose, { Schema } from "mongoose";

const purchaseItemSchema =  mongoose.Schema({
  product:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Product",
    required:[true, 'Product is required']
  },
  // quantity with unit.
  quantity:{
    type:Number,
    required:[true, 'Quantity is required']
  },
  // quantity with sub unit like (5 unit and sub unit 2 => 2*5 = 10)
  totalSubQuantity:{
    type:Number,
    required:[true, 'TotalSubQuantity is required']
  },
  unit:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Unit",
    required:[true, 'Unit is required']
  },
  // = total sub quantity above (totalSubQuantity)
  reminderQuantity:{
    type:Number,
    required:true,
    validate: {
      validator: function(v) {
        return typeof v === 'number';
      },
      message: props => `${props.value} is not a valid number!`
    }
  },
  expiryDate:{
    type:Date,
    required:true
  },
  // اشتريت القهوة ب 30 جنيه يبقي هو ده ال 30
  costPrice:{
    type:Number,
    required:true
  },
  // سعر البيع القطاعي الا هو سعر الوحدة بس الا داخل الكرتونه او الجملة كلها
  retailPrice:{
    type:Number,
    required:true
  },
  // سعر البيع بالجملة
  wholesalePrice:{
    type:Number,
    required:true
  },
  // سعر البيع بنص الجملة
  haveWholeSalePrice:{
    type:Number,
    required:true
  },
  purchaseId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Purchase",
    required:[true, 'PurchaseId is required']
  },
  inventoryId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Inventory",
    required:true
  },
  date:{
    type:Date,
    default:Date.now
  },
});

const PurchaseItem = mongoose.model('PurchaseItem', purchaseItemSchema);
export default PurchaseItem