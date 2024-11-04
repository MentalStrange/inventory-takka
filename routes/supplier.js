import express from 'express';
// import multer from 'multer';
// import {
//     createProductSupplier, deleteProductSupplier,
//     getCompany,
//     getOrdersForSupplierInCurrentMonth,
//     getSupplier,
//     lastOrdersBySupplierId,
//     totalSalesBySupplierId,
//     updateProductSupplier,
//     updateSupplier,
//     uploadPhoto,
//     uploadPlaceImages,
//     deletePlaceImages,
//     getRegionBySupplierId,
//     getBalanceSheetBySupplier,
//     updateBalanceSheet,
//     deleteBalanceSheet,
//     getBalanceSheetSummaryBySupplier,
//     deleteSupplier,
//     getGraphSalesBySupplierId,
// } from '../controllers/supplierController.js';
// import { changeImageOffer, createOffer, deleteOffer, getAllOffer, getOffer, getOfferBySupplierId, updateOffer } from '../controllers/offerController.js';
// import { editProductsAndOffersInOrder, getAllOrderBySupplierId, getBestSellerForSupplier, totalOrderBySupplierId } from '../controllers/orderController.js';
// import { createPromoCode } from '../controllers/promoCodeController.js';
// import { getAllProduct, getAllProductAssignedToSupplier, getProductBySupplier } from '../controllers/productsController.js';
// import { storage } from '../controllers/sharedFunction.js';
// import { getDeliveryBoyByRegion } from '../controllers/deliveryBoyController.js';
// import { getAllGroupCompleteForSupplier, getGroupByDeliveryRoute, updateGroup } from '../controllers/groupController.js';
// import { getAllFine, rateOfStatistics } from '../controllers/reportController.js';

// const uploadSupplier = multer({ storage: storage('supplier') });
// const uploadPlaceImage = multer({ storage: storage('placeimages') });
// const uploadOffer = multer({ storage: storage('offer') });

const Router = express.Router();

// Router.patch('/uploadPhoto/:id', uploadSupplier.single('image'), uploadPhoto);
// Router.post('/uploadPlaceImage/:id', uploadPlaceImage.single('placeImage'), uploadPlaceImages);
// Router.delete('/deletePlaceImage/:id', deletePlaceImages);

// Router.get('/company', getCompany);
// Router.get('/:id', getSupplier);
// Router.patch('/:id', updateSupplier);
// Router.delete('/:id', deleteSupplier);

// Router.get('/offer/all', getAllOffer);
// Router.get('/offer/:id', getOffer);
// Router.get('/offer/supplier/:id', getOfferBySupplierId);
// Router.post('/offer', createOffer);
// Router.post('/offer/changeImage/:id', uploadOffer.single('image'), changeImageOffer);
// Router.patch('/offer/:id', updateOffer);
// Router.delete('/offer/:id', deleteOffer);

// Router.get('/product/all', getAllProduct)
// Router.post('/createProduct', createProductSupplier);
// Router.patch('/product/:id', updateProductSupplier);
// Router.delete('/product/:id', deleteProductSupplier);

// Router.get('/order/:id', getAllOrderBySupplierId);
// Router.get('/totalNumberOfOrder/:id', totalOrderBySupplierId);
// Router.get('/order/thisMonth/:id', getOrdersForSupplierInCurrentMonth);
// Router.get('/order/last/:id', lastOrdersBySupplierId);
// Router.get('/totalSales/:id', totalSalesBySupplierId);
// Router.get('/graphSales/:id', getGraphSalesBySupplierId);
// Router.patch('/editProductsAndOffersInOrder/:id', editProductsAndOffersInOrder);

// Router.post('/promoCode', createPromoCode);

// Router.get('/deliveryBoy/region/:regionName', getDeliveryBoyByRegion);
// Router.get('/getRegionBySupplierId/:id', getRegionBySupplierId);

// Router.patch('/group/:id', updateGroup);
// Router.get('/group/:id', getAllGroupCompleteForSupplier);
// Router.get('/group/getGroupByDelivery/:deliveryId', getGroupByDeliveryRoute);

// Router.get('/product/all', getAllProductAssignedToSupplier);
// Router.get('/product/supplierId/:id', getProductBySupplier);
// Router.get('/product/bestSeller/:id', getBestSellerForSupplier)

// Router.get('/statistics/:id',rateOfStatistics)
// Router.get('/fine/:id', getAllFine);

// Router.get('/balanceSheet/:supplierId', getBalanceSheetBySupplier);
// Router.get('/balanceSheetSummary/:supplierId', getBalanceSheetSummaryBySupplier);
// Router.patch('/balanceSheet/:id', updateBalanceSheet);
// Router.delete('/balanceSheet/:id', deleteBalanceSheet);

export default Router;
