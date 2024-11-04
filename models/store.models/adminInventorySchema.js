import mongoose from "mongoose";


const adminInventorySchema = mongoose.Schema({
  admin:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required:true
  },
  inventory:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required:true
  }
},{
  timestamps: true
})

const AdminInventory = mongoose.model('AdminInventory', adminInventorySchema);
export default AdminInventory