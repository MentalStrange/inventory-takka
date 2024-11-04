import mongoose from 'mongoose';
// تخزين العنوان بتاع المصاريف الا انا صارفتها زي الكهرباء المايه كده يعني
const fixedExpenseSchema = mongoose.Schema({
  title:{
    type:String,
    required:[true, "Expense should have a title"],
    unique:true
  },
})

const FixedExpense = mongoose.model("FixedExpense", fixedExpenseSchema);
export default FixedExpense;