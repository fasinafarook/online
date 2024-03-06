const express = require('express');
const admin_route = express();
const config = require('../config/config');
const auth = require('../middleware/adminAuth');
const upload = require('../config/productMulter')
const uploads = require('../config/categoryMulter')
const bannerUplods = require('../config/bannerMulter')

const errorHandler = require('../handler/errorHandler');
const fs = require('fs')




const adminsession = require('express-session');
admin_route.use(adminsession({
    secret: config.secretSession,
    resave: false,
    saveUninitialized: true,
}));



const bodyparser = require('body-parser');
admin_route.use(bodyparser.json());
admin_route.use(bodyparser.urlencoded({ extended: true }));

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');

admin_route.use(express.static('public'));


const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/coupenController');
const offerController = require('../controllers/offerController');
const bannerController = require('../controllers/bannerController');






admin_route.get('/', auth.isLogout, adminController.loadLogin);
admin_route.post('/', adminController.veryfyLogin);
admin_route.get('/logout', auth.isLogin, adminController.adminLogout);
admin_route.get('/home', auth.isLogin, adminController.loadDashboard);
admin_route.post('/home', auth.isLogin, adminController.loadDashboard);



admin_route.get('/report', auth.isLogin, adminController.reportDetails)



admin_route.get('/users', auth.isLogin, adminController.loadUsers);
admin_route.post('/users/toggleUserStatus/:userId', adminController.loadtoggleUserStatus)
admin_route.get('/products', auth.isLogin, productController.loadProducts);
admin_route.post('/products/toggleproductStatus/:productId', productController.loadtoggleProductStatus);
admin_route.get('/addproducts', auth.isLogin, productController.loadAddProduct);
admin_route.post('/addproducts', auth.isLogin, upload.array('image', 4), productController.addProduct);
admin_route.get('/category', auth.isLogin, categoryController.loadCategory);
admin_route.post('/category/toggleCategoryStatus/:categoryId', categoryController.loadtoggleCategoryStatus);
admin_route.get('/addcategory', auth.isLogin, categoryController.loadAddCategory);
admin_route.post('/addcategory', uploads.single('image'), categoryController.addCategory);

admin_route.post('/applycategoryOffer', categoryController.applycategoryOffer);
admin_route.post('/removeCategoryOffer', categoryController.removeCategoryOffer);

admin_route.post('/applyProductOffer', productController.applyProductOffer);
admin_route.post('/removeProductOffer', productController.removeProductOffer);




admin_route.get('/edit-product', auth.isLogin, productController.editProductLoad)
admin_route.post('/edit-product', auth.isLogin, upload.array('image', 4), productController.editProduct)
admin_route.post('/edit-product/deleteimg', auth.isLogin, productController.deleteImg)

admin_route.get('/edit-category', categoryController.editCategoryLoad);
admin_route.post('/edit-category', uploads.single('image'), categoryController.updateCategory);


admin_route.get('/order', auth.isLogin, orderController.orderManagement)
admin_route.get('/orderStatus', auth.isLogin, orderController.orderStatus)
admin_route.get('/vieworders', auth.isLogin, orderController.viewsorders)
admin_route.post('/orderstatus', auth.isLogin, orderController.adminCancelOrder)


admin_route.get('/coupon', auth.isLogin, couponController.couponManagement)
admin_route.post('/coupon', auth.isLogin, couponController.addCoupons)
admin_route.post('/updateCouponStatus', auth.isLogin, couponController.updateCouponStatus)
admin_route.get('/editCoupon', auth.isLogin, couponController.loadEditCoupon)
admin_route.post('/editCoupon', auth.isLogin, couponController.EditCoupon)

admin_route.get('/offer', auth.isLogin, offerController.offerManagement)
admin_route.post('/offer', auth.isLogin, offerController.addOffers)
admin_route.post('/updateOfferStatus', auth.isLogin, offerController.updateOfferStatus)
admin_route.get('/editOffer', auth.isLogin, offerController.loadEditOffer)
admin_route.post('/editOffer', auth.isLogin, offerController.EditOffer)




admin_route.get('/banner', auth.isLogin, bannerController.banneranagement)
admin_route.get('/addbanner', auth.isLogin, bannerController.loadAddBanner)
admin_route.post('/addbanner', auth.isLogin, bannerUplods.array('image', 5), bannerController.addBanner)
admin_route.post('/updateBannerStatus', auth.isLogin, bannerController.blockBanner)
admin_route.get('/edit-banner', auth.isLogin, bannerController.loadEditBanner)
admin_route.post('/edit-banner', auth.isLogin, bannerUplods.array('image', 5), bannerController.editBanner)






module.exports = admin_route;