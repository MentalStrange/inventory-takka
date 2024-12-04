import mongoose from "mongoose";

const wishlistItemSchema = mongoose.Schema({
	wishlistId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'wishlist',
		required: [true, 'WishlistId is required'],
	},
	productId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'wishlist',
		required: [true, 'ProductId is required'],
	},
	unitId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'units',
		required: [true, 'Unit is required'],
	},
	amount: {
		type: mongoose.Schema.Types.Number,
		required: [true, 'Amount is required'],
	}
})

const WishlistItem = mongoose.model('WishlistItem', wishlistItemSchema);
export default WishlistItem