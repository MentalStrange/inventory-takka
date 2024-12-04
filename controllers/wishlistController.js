import Wishlist from "../models/wishlistSchema.js";
import WishlistItem from "../models/wishlistItemSchema.js";
import {transformationWishlist, transformationWishlistItem} from "../format/transformationObject.js";
import {ObjectId} from "mongodb";

export const getAllWishlist = async (req, res) => {
	let query = {};
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;

	if (req.query.search) {
		query.title = new RegExp(`^${req.query.search}`, 'i');
	}

	if (['new', 'in_progress', 'completed'].includes(req.query.status)) {
		query.status = req.query.status;
	}

	let pipelineAggregation = [
		{
			$lookup: {
				from: "wishlistitems",
				localField: "_id",
				foreignField: "wishlistId",
				as: "wishlistItems"
			}
		},
		{
			$unwind: "$wishlistItems"
		},
		{
			$lookup: {
				from: "products",
				localField: "wishlistItems.productId",
				foreignField: "_id",
				as: "product"
			}
		},
		{
			$unwind: "$product"
		},
		{
			$lookup: {
				from: "units",
				localField: "wishlistItems.unitId",
				foreignField: "_id",
				as: "unit"
			}
		},
		{
			$unwind: "$unit"
		},
		{
			$group: {
				_id: "$_id",
				date: {$first: "$date"},
				factoryName: {$first: "$factoryName"},
				status: {$first: "$status"},
				title: {$first: "$title"},
				wishlistItems: {
					$push: {
						_id: "$wishlistItems._id",
						productId: "$wishlistItems.productId",
						product: "$product",
						unit: "$unit",
						amount: "$wishlistItems.amount"
					}
				}
			}
		},
		{$match: query},
		{$skip: (page - 1) * limit},
		{$limit: limit}
	];

	const wishlists = await Wishlist.aggregate(pipelineAggregation).exec();

	const transformedWishlist = await Promise.all(
		wishlists.map(async (wishlist) => {
			const wishlistItems = await Promise.all(
				wishlist.wishlistItems.map(async (wishlistItem) => await transformationWishlistItem(wishlistItem))
			);

			return await transformationWishlist(wishlist, wishlistItems);
		})
	);

	return res.status(200).json({
		status: "success",
		data: transformedWishlist,
		page: page,
		totalPages: Math.ceil(await Wishlist.countDocuments(query) / limit),
	});
}

export const createWishlist = async (req, res) => {
	const wishlist = await Wishlist.create({
		title: req.body.title,
		factoryName: req.body.factoryName,
		date: req.body.date,
		status: req.body.status,
	});

	const products = req.body.products;

	const transformWishlistItems = await Promise.all(
		products.map(async ({product, amount, unit}) => {
			const wishlistItem = await WishlistItem.create({
				wishlistId: wishlist._id,
				productId: product._id,
				unitId: unit._id,
				amount: amount,
			});

			return await transformationWishlistItem(wishlistItem);
		})
	);

	return res.status(201).json({
		status: "success",
		data: await transformationWishlist(wishlist, transformWishlistItems),
	});
}

export const updateWishlist = async (req, res) => {
	try {
		const {id} = req.params;

		const updatedWishlist = await Wishlist.findByIdAndUpdate(id, req.body, {new: true});

		const products = req.body.products;
		let wishlistItems;

		if (products?.length) {
			await WishlistItem.deleteMany({wishlistId: new ObjectId(id)})

			wishlistItems = await Promise.all(
				products.map(
					async ({product, amount, unit}) => await WishlistItem.create({
						wishlistId: id,
						productId: product._id,
						unitId: unit._id,
						amount: amount,
					})
				)
			);
		} else {
			wishlistItems = await WishlistItem.find({wishlistId: new ObjectId(id)});
		}

		const transformWishlistItems = await Promise.all(
			wishlistItems.map(async (wishlistItem) => await transformationWishlistItem(wishlistItem))
		);

		return res.status(201).json({
			status: "success",
			data: await transformationWishlist(updatedWishlist, transformWishlistItems),
		});
	} catch (error) {
		console.error(error);

		return res.status(500).json({success: false, message: 'Internal Server Error'});
	}
}

export const deleteWishlist = async (req, res) => {
	try {
		const {id} = req.params;

		await WishlistItem.deleteMany({wishlistId: new ObjectId(id)})
		const wishlist = await Wishlist.deleteOne({_id: new ObjectId(id)})

		if (!wishlist) {
			return res.status(404).json({success: false, message: 'wishlist not found'});
		}

		return res.status(200).json({success: true, message: 'wishlist deleted successfully'});
	} catch (error) {
		return res.status(500).json({success: false, message: 'Internal Server Error'});
	}
}