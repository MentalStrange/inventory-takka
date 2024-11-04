import mongoose from 'mongoose';

const inventorySchema = mongoose.Schema({
  name:{
    type:String,
    required:[true,'Name is Required for Inventory'],
    unique:true
  },
})

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory