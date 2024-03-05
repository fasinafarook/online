const express=require('express');
const user_route=express();
const config = require('../config/config');
const auth = require('../middleware/auth');

const session = require('express-session');

user_route.use(session({
    secret: config.secretSession,
    resave: false,
    saveUninitialized: true,
}));



const bodyparser=require('body-parser');
user_route.use(bodyparser.json());
user_route.use(bodyparser.urlencoded({extended:true}));

 const path = require('path');

user_route.set('view engine','ejs');
user_route.set('views','./views/users');




const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const wishlistController = require('../controllers/wishlistController');
const orderController = require('../controllers/orderController');
const cartController = require('../controllers/cartController');
const couponController = require('../controllers/coupenController');






user_route.get('/', userController.loadHome);

user_route.get('/signup',auth.isLogout,userController.loadRegister);
user_route.post('/signup',auth.isLogout,userController.insertUser);

user_route.get('/login',auth.isLogout,userController.loginLoad);
user_route.post('/login',auth.isLogout,userController.verifyLogin);

user_route.get('/logout',auth.isLogin,userController.userLogout);

user_route.get('/email-verified',auth.isLogout,userController.loadotp);
user_route.post('/resend-otp',auth.isLogout,userController.updateLastResendTime, userController.resendOTP);
user_route.post('/email-verified',auth.isLogout,userController.veryfyotp);

user_route.get('/product',productController.loadUserProducts);
user_route.get('/productDetails/:id',productController.productDetails);

user_route.get('/wishlist',auth.isLogin,wishlistController.wishlistManagement)
user_route.post('/addTowish',auth.isLogin,wishlistController.addTowish)
user_route.post('/wishlist',auth.isLogin,wishlistController.wishManagementAddtowish)
user_route.get('/deleteWishlistItem',auth.isLogin,wishlistController.deleteWishlistItem)

user_route.get('/cart',auth.checkBlock,auth.isLogin,cartController.cartManagement)
user_route.get('/addtocart',auth.isLogin,cartController.addToCart)
user_route.post('/cart',auth.isLogin,cartController.cartManagementAddtocart)
user_route.get('/deleteCartitem',auth.isLogin,cartController.deleteCartitem)
user_route.get('/quantitymanagement',auth.isLogin,cartController.quantityCheck)

user_route.get('/payment-policy',auth.isLogin,userController.paymentPolicy)


user_route.get('/qtycheck',auth.isLogin,cartController.qtycheck)
user_route.get('/checkout',auth.isLogin,orderController.checkoutOrder)
user_route.post('/checkout',auth.isLogin,orderController.checkoutaddress)

user_route.post('/applycoupon',auth.isLogin,couponController.applycoupons)
user_route.post('/couponCheck',auth.isLogin,couponController.pushingCoupon)
user_route.post('/onlinepayment',auth.isLogin,orderController.onlinePay)

user_route.post('/walletpayment',auth.isLogin,orderController. walletPayment)
user_route.post('/proceedtoPayment',auth.isLogin,auth.isLogin,orderController.paymentManagement)


user_route.get('/account',auth.isLogin,userController.accountManagment)
user_route.get('/orderstatus',auth.isLogin,orderController.cancerlOrReturn)
user_route.post('/orderstatus',auth.isLogin,orderController.userCancelOrder)
user_route.get('/invoice',auth.isLogin,orderController.invoiceDownload)

user_route.get('/editAddress',auth.isLogin,userController.showeditaddress)
user_route.post('/editAddress',auth.isLogin,userController.editaddress)
user_route.get('/editProfile',auth.isLogin,userController.profileEdit)
user_route.post('/addaddress',auth.isLogin,userController.addaddress)
user_route.post('/changePassword',auth.isLogin,userController.changePassword)
user_route.get('/deleteAddress',auth.isLogin,userController.deleteAddress)








module.exports = user_route;



