const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/coupenModel");
const bcrypt = require('bcrypt');
const Swal = require('sweetalert2');
const sharp = require("sharp");

//-------------------------admin side coupen----------------------------------------------------
const couponManagement = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
  
      const currentDate = new Date();
      const totalCoupons = await Coupon.countDocuments();
  
      const couponData = await Coupon.find().skip(skip).limit(limit);
  
      for (const coupon of couponData) {
        if (coupon.expiryDate < currentDate) {
          await Coupon.findByIdAndUpdate(coupon._id, { is_active: 0 });
        }
      }
  
      res.render("coupon", {
        couponData: couponData,
        currentPage: page,
        totalPages: Math.ceil(totalCoupons / limit),
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Error fetching coupon data");
    }
  };
  

  //----------add coupon--------------
  const addCoupons = async (req, res) => {
    try {
      const couponData = new Coupon({
        couponCode: req.body.couponname,
        Discount: req.body.discount,
        expiryDate: req.body.couponDate,
        Limit: req.body.limit,
        minPurchase: req.body.minPurchase,
      });
      const data = req.body.couponname;
      const duplicateDataCount = await Coupon.countDocuments({
        couponCode: { $regex: new RegExp(`^${data}$`, "i") },
      });
      if (!duplicateDataCount) {
        const coupon = await couponData.save();
        if (coupon) {
          res.json({ message: "Success" });
        } else {
          res.json({ message: "Coupon not found" });
        }
      } else {
        res.json({ message: "Failed" });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  

//----------------coupen status--------------
  const updateCouponStatus = async (req, res) => {
    try {
      id = req.body.couponId;
      const currentDate = new Date();
      const couponExpiryDate = await Coupon.findById({ _id: id });
      const is_active = req.body.is_active;
  
      if (couponExpiryDate.expiryDate > currentDate) {
        let changeStatus;
        if (is_active == 1) {
          changeStatus = 0;
        } else {
          changeStatus = 1;
        }
        const couponData = await Coupon.findOneAndUpdate(
          { _id: id },
          { $set: { is_active: changeStatus } }
        );
        res.status(200).json({ message: "Success" });
      } else {
        res.status(500).json({ message: "Failed" });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  //----------------edit coupen------------------
  const loadEditCoupon = async (req, res) => {
    try {
      const couponId = req.query.couponId;
      const couponData = await Coupon.findById({ _id: couponId });
      res.render("edit-coupon", { couponData: couponData });
    } catch (error) {
      console.log(error.message);
    }
  };
  
  const EditCoupon = async (req, res) => {
    try {
      id = req.body.id;
      const coupon = await Coupon.findById({ _id: id });
      const updatedData = {
        couponCode: req.body.couponname,
        Discount: req.body.discount,
        expiryDate: req.body.couponDate,
        minPurchase: req.body.minPurchase,
        Limit: req.body.limit,
      };
      const data = req.body.couponname;
      const duplicateDataCount = await Coupon.countDocuments({
        couponCode: { $regex: new RegExp(`^${data}$`, "i") },
        _id: { $ne: coupon._id },
      });
      if (!duplicateDataCount) {
        const couponData = await Coupon.findOneAndUpdate(
          coupon._id,
          updatedData,
          { new: true }
        );
        if (couponData) {
          res.json({ message: "Success" });
        } else {
          res.json({ message: "Coupon not found" });
        }
      } else {
        res.json({ message: "Failed" });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
//-------------------------------user side coupen------------------------------------------
const applycoupons = async (req, res, next) => {
    try {
      const id = req.session.user_id;
      const userData = await User.findById(id);
      const couponcode = req.body.couponcode;
      const amount = req.body.totalAmount;
      const couponData = await Coupon.findOne({
        couponCode: couponcode,
        is_active: 1,
      });
  
      let count = 0;
      for (let redeemUser of couponData.redeemUser) {
        if (redeemUser.userId.equals(userData._id)) {
          count++;
        }
      }
  
      if (couponData.minPurchase <= amount) {
        if (count < couponData.Limit) {
          return res.status(200).json({
            message: "Success",
            Discount: couponData.Discount,
            couponCode: couponcode,
          });
        } else {
          return res.status(400).json({ message: "Coupon limit exceeded" });
        }
      } else {
        return res
          .status(403)
          .json({ message: "Coupon is not applicable for this product" });
      }
    } catch (error) {
      next(new Error("An error occurred"));
    }
  };
  
  const pushingCoupon = async (req, res, next) => {
    try {
      const userId = req.session.user_id;
      const couponName = req.body.couponData;
      const updatedCoupon = await Coupon.findOneAndUpdate(
        { couponCode: couponName },
        { $push: { redeemUser: { userId: userId } } },
        { new: true }
      );
    } catch (error) {
      next(new Error("An error occurred"));
    }
  }; 


  module.exports ={
    couponManagement,
    addCoupons,
    updateCouponStatus,
    loadEditCoupon,
    EditCoupon,
    applycoupons,
    pushingCoupon,
  }
  