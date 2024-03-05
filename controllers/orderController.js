const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/coupenModel");
const crypto = require('crypto');
require("dotenv").config();
const Razorpay = require("razorpay");
const Offer = require("../models/offerModel");
const puppeteer = require('puppeteer')
const moment = require ('moment')
const path = require('path');
const ejs = require('ejs');


//------------------razorpay instance-------------------

var instance = new Razorpay({
  key_id: process.env.REZORPAY_ID_KEY,
  key_secret: process.env.REZORPAY_SECRET_KEY,
});

//--------------------adminSide---------------------------

const orderManagement = async (req, res) => {
  try {
    const filter = req.query.filter || 'week'; 
    const status = req.query.status; 
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    let startDate, endDate;
    switch (filter) {
      case 'day':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0); 
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999); 
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        endDate = new Date();
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        endDate = new Date();
        break;
      default: 
        startDate = new Date();
        endDate = new Date();
        break;
    }
    const filterQuery = {
      currentData: { $gte: startDate, $lte: endDate }
    };
    if (status) {
      filterQuery['items.status'] = status;
    }

    const totalOrders = await Order.countDocuments({
      currentData: { $gte: startDate, $lte: endDate }
    });

    const categories = await Category.find({ is_active: 1 });
    const products = await Product.find({ is_product: 1 }).populate('category');
    const orderData = await Order.find({
      currentData: { $gte: startDate, $lte: endDate }
    })
      .populate("userId")
      .populate({
        path: 'items.productId',
        select: 'name price quantity',
        populate: [{
          path: 'offer'
        }, {
          path: 'category',
          populate: {
            path: 'offer'
          }
        }]
      })
      .sort({ currentData: -1 }).skip(skip)
      .limit(limit);

    res.render("order", {
      orderData: orderData || [],
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      filter: filter,
      filterStartDate: startDate,
      filterEndDate: endDate ,
      selectedStatus: status,
      req: req 
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error fetching orders");
  }
};


 //---------order status--------------
const orderStatus = async (req, res) => {
  try {
      const orderId = req.query.orderId;
      const itemId = req.query.itemId;
      const selectedStatus = req.query.selectedStatus;
      const order = await Order.findById(orderId);

      if (!orderId || !itemId || !selectedStatus) {
          return res.status(400).json({ message: "Missing required parameters" });
      }
      if (order.paymentStatus === "Failed") {
        return res.status(400).json({ message: "Payment status is Failed. Cannot update order status." });
      }
      
      let updateStatus;

      if (selectedStatus === "Delivered") {
          updateStatus = await Order.findOneAndUpdate(
              { _id: orderId, "items._id": itemId },
              {
                  $set: {
                      "items.$.status": selectedStatus,
                      "paymentStatus": "Success"
                  }
              }
          );
      } else {
          updateStatus = await Order.findOneAndUpdate(
              { _id: orderId, "items._id": itemId },
              { $set: { "items.$.status": selectedStatus } }
          );
      }

      if (!updateStatus) {
          return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
};



//-------------order product details page------------------
const viewsorders = async (req, res) => {
  try {
      const orderId = req.query.id;
      const productId = req.query.productId;

      const categories = await Category.find({ is_active: 1 });
      const offers = await Offer.find({ is_active: 1 });

      const productData = await Product.findOne({ _id: productId })
      .populate({
          path: 'category',
          populate: {
              path: 'offer',
              model: 'Offer'
          }
      })
      .populate('offer');
  
        if (!productData.offer && productData.category && productData.category.offer) {
            productData.offer = productData.category.offer;
        } else if (productData.offer && productData.category && productData.category.offer) {
            if (productData.offer.percentage < productData.category.offer.percentage) {
                productData.offer = productData.category.offer;
            }
        }
        
        let offerPrice;
        if (productData.offer) {
            offerPrice = productData.price - (productData.price * productData.offer.percentage / 100);
        }
        
      const orderData = await Order.findOne({ _id: orderId }).populate('items');

      if (!orderData) {
          return res.status(404).send("Order not found");
      }

      const productFound = orderData.items.some(item => item.productId.toString() === productId);
      console.log('pro:',productFound)


      if (productFound) {
          res.render("orderView", { orderData, productData, offerPrice });
      } else {
          return res.status(404).send("Product not found in the order");
      }
  } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
  }
};


//----------------cancel order---------------------
const adminCancelOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const productId = req.body.productId; 
    console.log('Order ID:', orderId);
    console.log('Product ID:', productId);

    const orderData = await Order.findOne({ _id: orderId });

    if (!orderData) {
      return res.status(404).send('Order not found');
    }

    const productItem = orderData.items.find(item => item.productId.toString() === productId);

    if (!productItem) {
      return res.status(404).send('Product not found in the order');
    }

    productItem.status = 'Cancelled';
    await orderData.save();

    const editQuantity = await Product.findOneAndUpdate(
      { _id: productId },
      { $inc: { Quantity: 1 * productItem.quantity } }
    );

    const product = await Product.findOne({ _id: productId }).populate({
      path: 'category',
      populate: {
        path: 'offer',
        model: 'Offer' 
      }
    }).populate('offer');


    let refundAmount;

    if (!product.offer && product.category && product.category.offer) {
      product.offer = product.category.offer;
    } else if (product.offer && product.category && product.category.offer) {
      if (product.offer.percentage < product.category.offer.percentage) {
        product.offer = product.category.offer;
      }
    }

    if (product.offer) {
      refundAmount = product.offer.percentage * product.price * productItem.quantity / 100;
    } else {
      refundAmount = product.price * productItem.quantity;
    }

    console.log(refundAmount);

    if (orderData.paymentMethod !== 'Cash on delivery' && orderData.paymentStatus !== "Failed") {
      const addToWallet = await User.findOneAndUpdate(
        { _id: orderData.userId },
        { $inc: { wallet: refundAmount } }
      );
    }
    res.redirect('/admin/order');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};




//-------------------------------userSide offer--------------------------------------


const checkoutOrder = async (req, res, next) => {
  try {
      id = req.session.user_id;
      const user = await User.findById({ _id: id });
      const userData = await User.findById(id, { address: 1, _id: 0 });
      const CartData = await Cart.findOne({
          userId: req.session.user_id,
      }) .populate({
        path: 'product.productId',
       populate:[{
        path:'offer'
       },{
        path:'category',
        populate:{
          path:'offer'
        }
       }]
    });

      if (!CartData || !CartData.product || CartData.product.length === 0) {
        return res.render("cart", { userData: userData, user: user });
    }

      for (const cartItem of CartData.product) {
          const productId = cartItem.productId;
          const productData = await Product.findById(productId);

          if (!productData || cartItem.Quantity > productData.Quantity) {
              return res.status(400).render('error', { message: 'Some items in your cart are out of stock.' });
          }
      }

      const categories = await Category.find({ is_active: 1 });
      const offer = await Offer.find({ is_active: 1 });

      const products = await Product.find({ is_product: 1 }).populate({
        path: 'category',
        populate: {
            path: 'offer',
            model: 'Offer' 
        }
    }).populate('offer');
      const couponData = await Coupon.find({ is_active: 1 });
      if (CartData) {
        CartData.product.forEach(productItem => {
            if (!productItem.offer && productItem.productId.offer) {
                productItem.offer = productItem.productId.offer;
            } else if (productItem.offer && productItem.productId.offer) {
                if (productItem.offer.percentage < productItem.productId.offer.percentage) {
                    productItem.offer = productItem.productId.offer;
                }
            } else if (!productItem.offer && productItem.productId.category && productItem.productId.category.offer) {
                productItem.offer = productItem.productId.category.offer;
            } else if (productItem.offer && productItem.productId.category && productItem.productId.category.offer) {
                if (productItem.offer.percentage < productItem.productId.category.offer.percentage) {
                    productItem.offer = productItem.productId.category.offer;
                }
            }
        });
        res.render("checkout", {
          userData: userData,
          cartData: CartData,
          couponData: couponData,
          user: user,
          user: req.session.user_id,
          categories,
          products,
          offer:offer
      });    } else {
        res.render("checkout", {
          userData: userData,
          cartData: CartData,
          couponData: couponData,
          user: user,
          user: req.session.user_id,
          categories,
          products,
          offer:offer
      });    }
     
  } catch (error) {
      next(new Error("An error occurred"));
  }
};

//---------------------address----------------------------
  const checkoutaddress = async (req, res, next) => {
    try {
      const userId = req.session.user_id;
      const addressDetails = {
        firstName: req.body.fname,
        lastName: req.body.lname,
        City: req.body.city,
        District: req.body.district,
        State: req.body.state,
        Pincode: req.body.pincode,
      };
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      user.address.push(addressDetails);
  
      await user.save();
     
      res.redirect("/checkout");
    } catch (error) {
      next(new Error("An error occurred"));
    }
  };
  
  function generateUniqueNumber() {
    const digits = [];
    while (digits.length < 8) {
      const digit = Math.floor(Math.random() * 10);
      if (!digits.includes(digit)) {
        digits.push(digit);
      }
    }
    return digits.join("");
  }
  
  const uniqueNumber = generateUniqueNumber();


  //-----------------online payment----------------------
  const onlinePay = async (req, res) => {
    try {
      const id = req.session.user_id;
      const cartData = await Cart.findOne({ userId: id });
  
      if (cartData) {
        for (const cartItem of cartData.product) {
          const productId = cartItem.productId;
          const productData = await Product.findById(productId);
          if (productData) {
            const cartQuantity = cartItem.Quantity;
            const availableQuantity = productData.Quantity;
  
            if (cartQuantity > availableQuantity) {
              return res.status(200).json({ product: productData.name});
            }
          }
        }
      }
  
      var options = {
        amount: req.body.amount * 100,
        currency: "INR",
        receipt: "order_rcptid_11",
      };
      instance.orders.create(options, function (err, order) {
        let razorOrderId = order;
        let paymentStatus = order.status;
        res
          .status(200)
          .json({
            message: "Order placed successfully.",
            razorOrderId,
            paymentStatus,
          });
      });
    } catch (error) {
      console.log(error.message)
      next(new Error("An error occurred"));
    }
  };
  
  

  //---------------------payment--------------------------
  const paymentManagement = async (req, res, next) => {
    try {
      id = req.session.user_id;
      totalAmount = req.body.totalAmount;
      payment = req.body.paymentMethod;
      const userData = await User.findById({ _id: id });
      const addressAtIndex = userData.address[req.body.address];

      
      const address = {
        firstName: addressAtIndex.firstName,
        lastName: addressAtIndex.lastName,
        Country: addressAtIndex.Country,
        City: addressAtIndex.City,
        District: addressAtIndex.District,
        State: addressAtIndex.State,
        Pincode: addressAtIndex.Pincode,
      };
      const cartData = await Cart.findOne({ userId: id });
  
      if (cartData) {
        for (const cartItem of cartData.product) {
          const productId = cartItem.productId;
          const productData = await Product.findById(productId);
          if (productData) {
            const cartQuantity = cartItem.Quantity;
            const availableQuantity = productData.Quantity;
  
            if (cartQuantity > availableQuantity) {
              return res
                .status(200)
                .json({
                  product: productData.name,
                  message: "Out of stock",
                });
            }
          }
        }
      }
  
      const productDetails = [];
  
      if (cartData && cartData.product) {
        cartData.product.forEach((item) => {
          const { productId, Quantity } = item;
          const product = { productId, Quantity, quantity: Quantity };
          productDetails.push(product);
        });
      }
      if (payment == "Cash on delevery") {
        const order = new Order({
          userId: id,
          items: productDetails,
          totalAmount: totalAmount,
          paymentMethod: payment,
          address: address,
          orderId: uniqueNumber,
          productId: uniqueNumber,
        });
        await order.save();
      } else {
        const order = new Order({
          userId: id,
          items: productDetails,
          totalAmount: totalAmount,
          paymentMethod: payment,
          address: address,
          orderId: uniqueNumber,
          productId: uniqueNumber,
          paymentStatus: "Success",
        });
        await order.save();
      }
  
      if (cartData && cartData.product) {
        for (const item of cartData.product) {
          const productData = item.productId;
          const Quantity = item.Quantity;
          const status = item.status;
          const product = await Product.findById(productData);
  
          if (product && product.Quantity > 0) {
            await Product.findOneAndUpdate(
              { _id: productData, Quantity: { $gt: 0 } },
              { $inc: { Quantity: -1 * Quantity } }
            );
          }
        }
      }
      const deleteCart = await Cart.deleteOne({ userId: id });
      res.status(200).json({ message: "Order placed successfully" });
    } catch (error) {
      console.log(error.message)
      next(new Error("An error occurred"));
    }
  };



  //-------------wallet payment--------------------

  const walletPayment = async (req, res, next) => {
    try {
      id = req.session.user_id;
      const userData = await User.findById({ _id: id });
      const cartData = await Cart.findOne({ userId: id });
      if (cartData) {
        for (const cartItem of cartData.product) {
          const productId = cartItem.productId;
          const productData = await Product.findById(productId);
          if (productData) {
            const cartQuantity = cartItem.Quantity;
            const availableQuantity = productData.Quantity;
  
            if (cartQuantity > availableQuantity) {
              return res
                .status(200)
                .json({
                  product: productData.productName,
                  message: "Out of stock",
                });
            } else {
              const totalAmount = req.body.amount;
              if (userData.wallet >= totalAmount) {
                const addToWallet = await User.findOneAndUpdate(
                  { _id: id },
                  { $inc: { wallet: -totalAmount } }
                );
                res.status(200).json({ message: "success" });
              } else {
                res.status(200).json({ message: "failed" });
              }
            }
          }
        }
      }
    } catch (error) {
      next(new Error("An error occurred"));
    }
  };
  
 
  //---------------------cancel / return ---------------------------
const cancerlOrReturn = async (req, res, next) => {
  try {
      const orderId = req.query.id;
      const productId = req.query.productId;
      const categories = await Category.find({ is_active: 1 });
      const offers = await Offer.find({ is_active: 1 });
      const products = await Product.find({ is_product: 1 }).populate('category');

      const productData = await Product.findOne({ _id: productId })
          .populate({
              path: 'category',
              populate: {
                  path: 'offer',
                  model: 'Offer'
              }
          })
          .populate('offer');

          if (!productData.offer && productData.category && productData.category.offer) {
            productData.offer = productData.category.offer;
        } else if (productData.offer && productData.category && productData.category.offer) {
            if (productData.offer.percentage < productData.category.offer.percentage) {
                productData.offer = productData.category.offer;
            }
        }

      let offerPrice;
      if (productData.offer) {
          offerPrice = productData.price - (productData.price * productData.offer.percentage / 100);
      }

      const orderData = await Order.findOne({ _id: orderId });
      if (!orderData) {
          return res.status(404).send("Order not found");
      }

      const productFound = orderData.items.some(item => item.productId.toString() === productId);

      if (productFound) {
          res.render('cancelOrder', { categories, products, orderData, user: req.session.user_id,productData ,offerPrice});
        } else {
          return res.status(404).send("Product not found in the order");
      }

  } catch (error) {
    console.log(error.message)
      next(new Error('An error occurred'));
  }
};


//--------------------invoice----------------------
const invoiceDownload = async (req, res) => {
  try {
      const { orderId } = req.query;
      const { user_id } = req.session;
      let sumTotal = 0;

      const userData = await User.findById(user_id);
      console.log(userData)
      const orderData = await Order.findById(orderId).populate('items.productId');

      orderData.items.forEach((item) => {
          const total = item.productId.price * item.quantity;
          sumTotal += total;
      });

      const date = new Date();
      const data = {
          order: orderData,
          user: userData,
          date,
          sumTotal,
          moment
      };

      const ejsTemplate = path.resolve(__dirname, '../views/users/invoice.ejs');
      const ejsData = await ejs.renderFile(ejsTemplate, data);

      const browser = await puppeteer.launch({ headless: "new", executablePath: "/snap/bin/chromium" });
       const page = await browser.newPage();
      await page.setContent(ejsData, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=order_invoice.pdf');
      res.send(pdfBuffer);
  } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
  }
};



//------------------cancel order-----------------------

const userCancelOrder = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const orderId = req.body.orderId;
    const productId = req.body.productId;
    console.log("usr:", userId, "ord:", orderId, "prd:", productId);
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const itemToUpdate = order.items.find(item => item.productId.toString() === productId);

    if (!itemToUpdate) {
      return res.status(404).send("Item not found in the order");
    }

    const product = await Product.findOne({ _id: productId }).populate({
      path: 'category',
      populate: {
        path: 'offer',
        model: 'Offer' 
      }
    }).populate('offer');

    let refundAmount;

    if (!product.offer && product.category && product.category.offer) {
      product.offer = product.category.offer;
    } else if (product.offer && product.category && product.category.offer) {
      if (product.offer.percentage < product.category.offer.percentage) {
        product.offer = product.category.offer;
      }
    }

    if (product.offer) {
      refundAmount = (product.offer.percentage / 100) * product.price * itemToUpdate.quantity;
    } else {
      refundAmount = product.price * itemToUpdate.quantity;
    }


        if (order.paymentStatus === "Success" && itemToUpdate.status ==="Delivered") {
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, "items.productId": productId },
        { $set: { "items.$.status": "Returned" } },
        { new: true }
      );

      await Product.findByIdAndUpdate(productId, { $inc: { Quantity: itemToUpdate.quantity } });

      if (order.paymentStatus !== 'Cash on delivery') {
        await User.findOneAndUpdate(
          { _id: order.userId },
          { $inc: { wallet: refundAmount } }
        );
      }
      return res.redirect("/account");
    } else  {

      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, "items.productId": productId },
        { $set: { "items.$.status": "Cancelled" } },
        { new: true }
      );

      await Product.findByIdAndUpdate(productId, { $inc: { Quantity: itemToUpdate.quantity } });

      if (order.paymentMethod !== 'Cash on delivery' && order.paymentStatus !== "Failed" ) {
        await User.findOneAndUpdate(
          { _id: order.userId },
          { $inc: { wallet: refundAmount } }
        );
      }
      return res.redirect("/account");
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};


module.exports ={
    orderManagement,
    orderStatus,
    viewsorders,
    adminCancelOrder,
    checkoutaddress,
    checkoutOrder,
    onlinePay,
    paymentManagement,
    walletPayment,
    cancerlOrReturn,
    userCancelOrder,
    invoiceDownload,
    

}