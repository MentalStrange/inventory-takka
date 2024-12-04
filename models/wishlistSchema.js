import mongoose from "mongoose";

const wishlistSchema = mongoose.Schema({
	title: {
		type: String,
		required: [true, "Wishlist should have a title"],
	},
	factoryName: {
		type: String,
		required: [true, "Wishlist should have a factoryName"],
	},
	date: {
		type: Date,
		required: [true, "Wishlist should have a date"],
	},
	status: {
		type: String,
		required: [true, "Wishlist should have a status"],
	}
})

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist