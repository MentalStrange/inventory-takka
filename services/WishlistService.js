import WishlistItem from "../models/wishlistItemSchema.js";
import {ObjectId} from "mongodb";
import Wishlist from "../models/wishlistSchema.js";

export const withdrawWishlist = async (purchaseId) => {
	const wishlistItems = await WishlistItem.aggregate([{
		$lookup: {
			from: "purchaseitems", let: {productId: "$productId", unitId: "$unitId"}, pipeline: [{
				$match: {
					$expr: {
						$and: [{$eq: ["$product", "$$productId"]}, {$eq: ["$unit", "$$unitId"]}, {$eq: ["$purchaseId", new ObjectId(purchaseId)]}]
					}
				}
			}], as: "purchaseItem"
		}
	}, {$unwind: "$purchaseItem"}]).exec();

	for (const wishlistItem of wishlistItems) {
		const newQuantity = Math.max(wishlistItem.amount - wishlistItem.purchaseItem.quantity, 0);

		await WishlistItem.updateOne({_id: wishlistItem._id}, {$set: {amount: newQuantity}});
		await Wishlist.updateOne({_id: wishlistItem.wishlistId}, {$set: {status: 'in_progress'}});
	}

	const zeroTotalWishlists = await Wishlist.aggregate([
		{
			$lookup: {
				from: 'wishlistitems',
				localField: '_id',
				foreignField: 'wishlistId',
				as: 'items'
			}
		},
		{
			$match: {
				$expr: {
					$eq: [
						{ $sum: '$items.amount' },
						0
					]
				}
			}
		}
	]).exec();

	for (const wishlist of zeroTotalWishlists) {
		await Wishlist.updateOne({ _id: wishlist._id }, { $set: { status: 'completed' } });
	}
}