const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const offer = require("../models/coupenModel");
const bcrypt = require('bcrypt');
const Swal = require('sweetalert2');
const Offer = require("../models/offerModel");


//-------------------------admin side--------------------------
const offerManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
    
        const currentDate = new Date();
        const totalOffer = await Offer.countDocuments();
    
        const offerData = await Offer.find().skip(skip).limit(limit);
    
        for (const offer of offerData) {
          if (offer.expiryDate < currentDate) {
            await Offer.findByIdAndUpdate(offer._id, { is_active: 0 });
          }
        }
    
        res.render("offer", {
          offerData: offerData,
          currentPage: page,
          totalPages: Math.ceil(totalOffer / limit),
        });
      } catch (error) {
        console.log(error.message);
        res.status(500).send("Error fetching offer data");
      }
    };

    const addOffers = async (req, res) => {
        try {
          const offerData = new Offer({
            offername: req.body.offername,
            startingDate:req.body.startingDate,
            expiryDate: req.body.expiryDate,
            percentage: req.body.percentage,
           
          });
          const data = req.body.offername;
          const duplicateDataCount = await Offer.countDocuments({
            offername: { $regex: new RegExp(`^${data}$`, "i") },
          });
          if (!duplicateDataCount) {
            const offer = await offerData.save();
            if (offer) {
              res.json({ message: "Success" });
            } else {
              res.json({ message: "offer not found" });
            }
          } else {
            res.json({ message: "Failed" });
          }
        } catch (error) {
          console.log(error.message);
        }
      };
    

      const updateOfferStatus = async (req, res) => {
        try {
          id = req.body.offerId;
          const currentDate = new Date();
          const offerExpiryDate = await Offer.findById({ _id: id });
          const is_active = req.body.is_active;
      
          if (offerExpiryDate.expiryDate > currentDate) {
            let changeStatus;
            if (is_active == 1) {
              changeStatus = 0;
            } else {
              changeStatus = 1;
            }
            const offerData = await Offer.findOneAndUpdate(
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
      
const loadEditOffer = async (req, res) => {
        try {
          const offerId = req.query.offerId;
          const offerData = await Offer.findById({ _id: offerId });

          res.render("edit-offer", { offerData: offerData });
        } catch (error) {
          console.log(error.message);
        }
      };
      
      const EditOffer = async (req, res) => {
        try {
          id = req.body.id;
          const offer = await Offer.findById({ _id: id });
          const updatedData = {
            offername: req.body.offername,
            startingDate:req.body.startingDate,
            expiryDate: req.body.expiryDate,
            percentage: req.body.percentage,
          };
          const data = req.body.offername;
          const duplicateDataCount = await Offer.countDocuments({
            offername: { $regex: new RegExp(`^${data}$`, "i") },
            _id: { $ne: offer._id },
          });
          if (!duplicateDataCount) {
            const offerData = await Offer.findOneAndUpdate(
              offer._id,
              updatedData,
              { new: true }
            );
            if (offerData) {
              res.json({ message: "Success" });
            } else {
              res.json({ message: "offer not found" });
            }
          } else {
            res.json({ message: "Failed" });
          }
        } catch (error) {
          console.log(error.message);
        }
      }; 

    module.exports ={
        offerManagement,
        addOffers,
        updateOfferStatus,
        loadEditOffer,
        EditOffer
    }