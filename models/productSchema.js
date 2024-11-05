import mongoose from 'mongoose';
import SupplierProduct from './supplierProductSchema.js';
import SubSubCategory from './subSubCategorySchema.js';

const productSchema = mongoose.Schema({
  title:{
    type:String,
    required:[true, 'Product should have a name'],
    unique: [true, 'Product should have a unique title'],
  },
  desc:{
    type:String,
    // required:[true, 'Product should have a description'],
  },
  weight:{
    type:Number,
    // required:[true, 'Product should have a weight'],
  },
  images:[{
    type:String,
    // required:[true, 'Product should have images']
  }],
  units:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Unit",
    required:[true, 'Product should be associated with a Unit']
  }],
  subUnit:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"SubUnit",
    required:[true, 'Product should be associated with a SubUnit']
  },
  category:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Category",
    required:[true, 'Product should be associated with a category']
  },
  subCategory:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"SubCategory",
    required:[true, 'Product should be associated with a subCategory']
  },
  subSubCategory:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"SubSubCategory",
    required:[true, 'Product should be associated with a subSubCategory'],
    validate: {
      validator: async function(value) {
        if (!value) return true;
        const subSubCategory = await SubSubCategory.findById(value);
        return !!subSubCategory;
      },
      message: props => `SubSubCategory with ID ${props.value} does not exist`
    }
  },
  barcode:{
    type:String,
    required:[true, 'Product should have a barcode'],
    unique: true
  },
  frequency:{
    type:Number,
    default: 0
  },
  createdAt:{
    type:Date,
    default: Date.now
  }
},{
  timestamps:true
})

productSchema.pre('remove', async function(next){
  try {
    await SupplierProduct.deleteMany({ productId: this._id });
    next();
  } catch (error) {
    next(error)
  }
})
const Product = mongoose.model("Product",productSchema);
export default Product;