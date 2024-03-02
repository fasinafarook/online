

const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Wishlist = require('../models/wishlistModel');
const crypto = require('crypto');


const wishlistManagement = async (req, res, next) => {
    try {
        const categories = await Category.find({ is_active: 1 });
        const products = await Product.find({ is_product: 1 }).populate('category');

        const userId = req.session.user_id;
        const WishData = await Wishlist.findOne({ userId }).populate({
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
        if (WishData) {
            WishData.product.forEach(productItem => {
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
            res.render("wishlist", { WishData, categories, products, user: userId });
        }else{

        res.render("wishlist", { WishData, categories, products, user: userId });
        }
        
    } catch (error) {
        console.error("Error in wishlistManagement:", error);
        next(new Error("An error occurred"));
    }
};

const wishManagementAddtowish = async (req, res, next) => {
    try {
        const id = req.query.id;
        const userId = req.session.user_id;
        const productData = await Product.findById(id);
        
        if (!productData) {
            return res.status(404).send("Product not found");
        }

        let wishlist = await Wishlist.findOne({ userId: userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                userId: userId,
                product: [
                    {
                        productId: productData._id,
                    },
                ],
            });
        } else {
            const wishProductIndex = wishlist.product.findIndex(
                (item) => item.productId.toString() === id
            );

            if (wishProductIndex !== -1) {
                console.log("Product already exists in the wishlist");
            } else {
                wishlist.product.push({ productId: productData._id });
            }
        }

        await wishlist.save();
        res.redirect("/wishlist");
    } catch (error) {
        next(new Error("An error occurred"));
    }
};


const addTowish = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user_id;

        if (!productId) {
            return res.status(400).json({ error: "ProductId is required" });
        }

        const wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {
            const isProductExists = wishlist.product.some(item => item.productId.toString() === productId);
            if (isProductExists) {
                return res.status(400).json({ message: "Product already exists in the wishlist" });
            }
        }

        await Wishlist.findOneAndUpdate(
            { userId },
            { $push: { product: { productId } } },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: "Product added to wishlist successfully" });
    } catch (error) {
        console.error("Error adding product to wishlist:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Remove product from wishlist
const deleteWishlistItem = async (req, res, next) => {
    try {
      const userid = req.session.user_id;
      const productid = req.query.id;
      const removeCart = await Wishlist.updateOne(
        { userId: userid },
        { $pull: { product: { productId: productid } } }
      );
  
      if (removeCart.modifiedCount > 0) {
        res.redirect("/wishlist");
      }
    } catch (error) {
      next(new Error("An error occurred"));
    }
  };

module.exports = {

    wishlistManagement,
    wishManagementAddtowish,
    addTowish,
    deleteWishlistItem
}
