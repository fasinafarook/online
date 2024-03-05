const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const crypto = require('crypto');
const Offer = require("../models/offerModel");

//==================cart=============================
const cartManagement = async (req, res, next) => {
  try {
      const categories = await Category.find({ is_active: 1 });
      const products = await Product.find({ is_product: 1 }).populate('category');
      const CartData = await Cart.findOne({ userId: req.session.user_id })
      .populate({
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
      res.render("cart", { CartData: CartData, categories, products, user: req.session.user_id });
  } else {
      res.render("cart", { CartData: CartData, categories, products, user: req.session.user_id });
  }
  
  } catch (error) {
    console.log(error.message)
      next(new Error("An error occurred"));
  }
};



//------------------add to cart----------------------------
const cartManagementAddtocart = async (req, res, next) => {
  try {
      const CartData = await Cart.findOne({
          userId: req.session.user_id,
      }).populate("product.productId");

      const id = req.query.id;
      const userId = req.session.user_id;
      qty = req.query.qty;
      const productData = await Product.findById(id);
      let cart = await Cart.findOne({ userId: userId });

      if (!cart) {
          cart = new Cart({
              userId: userId,
              product: [
                  {
                      productId: productData._id,
                      Quantity: 1 * qty,
                  },
              ],
          });
      } else {
          const cartProductIndex = cart.product.findIndex(
              (item) => item.productId.toString() === id
          );

          if (cartProductIndex !== -1) {
              const specificProduct = cart.product[cartProductIndex];
              const totalQuantity = parseInt(specificProduct.Quantity) + parseInt(qty);

              if (productData.Quantity >= totalQuantity) {
                  cart.product[cartProductIndex].Quantity += 1 * qty;
              } else {
                  return res.status(400).json({ message: "Out of stock" });
              }
          } else {
              if (productData.Quantity >= qty) {
                  cart.product.push({
                      productId: productData._id,
                      Quantity: 1 * qty,
                  });
              } else {
                  return res.status(400).json({ message: "Out of stock" });
              }
          }
      }

      await cart.save();
      res.redirect("/cart");
  } catch (error) {
      next(new Error("An error occurred"));
  }
};

  const addToCart = async (req, res, next) => {
    try {
      const id = req.query.id;
      const userId = req.session.user_id;
  
      const userData = await User.findById(userId);
      const productData = await Product.findById(id);
  
      let cart = await Cart.findOne({ userId: userId });
      if (productData.Quantity == 0) {
        return res.status(400).json({ message: "Out of stock" });
      } else {
        if (!cart) {
          cart = new Cart({
            userId: userId,
            product: [
              {
                productId: productData._id,
                Quantity: 1,
              },
            ],
          });
        } else {
          const cartProductIndex = cart.product.findIndex(
            (item) => item.productId.toString() === id
          );
          if (cartProductIndex !== -1) {
            let cartDatas = await Cart.findOne(
              { userId: userId, "product.productId": id },
              { "product.$": 1, _id: 0 }
            );
            let specificProduct = cartDatas.product[0];
            if (productData.Quantity > specificProduct.Quantity) {
              cart.product[cartProductIndex].Quantity += 1;
              await cart.save();
              return res
                .status(200)
                .json({ message: "Quantity updated successfully", cart });
            } else {
              return res.status(400).json({ message: "Out of stock" });
            }
          } else {
            cart.product.push({
              productId: productData._id,
              Quantity: 1,
            });
          }
        }
      }
      await cart.save();
      return res.status(200).json({ message: "added to cart" });
    } catch (error) {
      console.log(error.message)
      next(new Error("An error occurred"));
    }
  };
  
  //------------------quantity--------------------------
  const quantityCheck = async (req, res, next) => {
    const userId = req.session.user_id;
    const id = req.query.id;
    const action = req.query.action;

    try {
        let cart = await Cart.findOne({ userId: userId });
        let cartData = await Cart.findOne(
            { userId: userId, "product.productId": id },
            { "product.$": 1, _id: 0 }
        );
        let specificProduct = cartData.product[0];

        let productData = await Product.findOne({ _id: id });
        if (action === "increase" || action === "decrease") {
            const cartProductIndex = cart.product.findIndex(
                (item) => item.productId.toString() === id
            );
            if (cartProductIndex !== -1) {
                if (action === "increase") {
                    if (productData.Quantity > specificProduct.Quantity) {
                        cart.product[cartProductIndex].Quantity += 1;
                        await cart.save();
                        return res.status(200).json({ success: true, message: "Quantity updated successfully", cart });
                    } else {
                        return res.status(400).json({ success: false, message: "Out of stock!!! Available in this quantity only" });
                    }
                } else {
                    if (cart.product[cartProductIndex].Quantity > 1) {
                        cart.product[cartProductIndex].Quantity -= 1;
                    } else {
                        return res.status(400).json({ success: false, message: "Quantity cannot be less than zero" });
                    }
                }
                await cart.save();
                return res.status(200).json({ success: true, message: "Quantity updated successfully", cart });
            } else {
                return res.status(404).json({ success: false, message: "Product not found in the cart" });
            }
        } else {
            return res.status(400).json({ success: false, message: "Invalid action" });
        }
    } catch (error) {
        next(new Error("An error occurred"));
    }
};

  const qtycheck = async (req, res, next) => {
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
              return res
                .status(200)
                .json({ product: productData.productName, message: "failed" });
            } else {
              res.status(200).json({ message: "Success" });
            }
          }
        }
      }
    } catch (error) {
      next(new Error("An error occurred"));
    }
  };
  

  //-----------delete cart item-------------------------
  const deleteCartitem = async (req, res, next) => {
    try {
      const userid = req.session.user_id;
      const productid = req.query.id;
      const removeCart = await Cart.updateOne(
        { userId: userid },
        { $pull: { product: { productId: productid } } }
      );
  
      if (removeCart.modifiedCount > 0) {
        res.redirect("/cart");
      }
    } catch (error) {
      next(new Error("An error occurred"));
    }
  };

  module.exports={
    cartManagement,
    cartManagementAddtocart,
    addToCart,
    quantityCheck,
    qtycheck,
    deleteCartitem,
  }