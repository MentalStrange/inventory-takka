import WishlistItem from "../models/wishlistItemSchema.js";
import Wishlist from "../models/wishlistSchema.js";

export const withdrawWishlist = async (purchaseId, products) => {
	for (const product of products) {
		if (!product.orderId) continue;

		const wishlistItem = await WishlistItem.findOneAndUpdate(
			{productId: product._id, unitId: product.unit._id, wishlistId: product.orderId},
			{$inc: {amount: -product.quantity}}
		);

		await Wishlist.updateOne({_id: wishlistItem.wishlistId}, {$set: {status: 'in_progress'}});
	}

	await WishlistItem.updateMany({amount: {$lt: 0}}, {$set: {amount: 0}});

	const zeroTotalWishlists = await Wishlist.aggregate([
		{$lookup: {from: 'wishlistitems', localField: '_id', foreignField: 'wishlistId', as: 'items'}},
		{$match: {$expr: {$eq: [{$sum: '$items.amount'}, 0]}}}
	]).exec();

	for (const wishlist of zeroTotalWishlists) {
		await Wishlist.updateOne({_id: wishlist._id}, {$set: {status: 'completed'}});
	}
}