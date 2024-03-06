
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/coupenModel");
const dashboardHandler = require("../handler/dashboardHandler");
const Banner = require("../models/bannerModel");
const sharp = require("sharp");



// ============================Banner===============================
const banneranagement = async (req, res) => {
  try {
    const currentDate = new Date();
    const bannerData = await Banner.find();
    for (const banner of bannerData) {
      if (banner.expiryDate <= currentDate) {
        await Banner.findByIdAndUpdate(banner._id, { is_active: 0 });
      }
    }
    res.render("banner", { bannerData: bannerData });
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddBanner = async (req, res) => {
  try {
    res.render("addbanner");
  } catch (error) {
    console.log(error.message);
  }
};


//--------add banner------------

const addBanner = async (req, res) => {
  try {
    if (
      !req.files ||
      !req.files.every((file) => file.mimetype.startsWith("image"))
    ) {
      return res.render("addbanner", {
        imgMessage: "Only images are allowed...!",
      });
    } else {
      let images;
      const tickOption = req.body.tickOption;
      if (tickOption == "yes") {
        images = [];
        for (const file of req.files) {
          const resizedImg = `resized_${file.filename}`;
          await sharp(file.path)
            .resize({ width: 900, height: 900 })
            .toFile(`public/bannerimages/${resizedImg}`);

          images.push(resizedImg);
        }
      } else {
        images = req.files.map((file) => file.filename);
      }

      const Data = new Banner({
        Name: req.body.bannername,
        Text: req.body.text,
        Target: req.body.target,
        expiryDate: req.body.date,
        Image: images,
      });
      await Data.save();
      res.redirect("/admin/banner");
    }
  } catch (error) {
    console.log(error.message);
  }
};


//---------block banner----------------
const blockBanner = async (req, res) => {
  try {
    id = req.body.couponId;
    const currentDate = new Date();
    const bannerExpiryDate = await Banner.findById({ _id: id });
    const is_active = req.body.is_active;

    if (bannerExpiryDate.expiryDate > currentDate) {
      let changeStatus;
      if (is_active == 1) {
        changeStatus = 0;
      } else {
        changeStatus = 1;
      }
      const couponData = await Banner.findOneAndUpdate(
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


//----------edit banner----------------------
const loadEditBanner = async (req, res) => {
  try {
    id = req.query.bannerId;
    const bannerData = await Banner.findById({ _id: id });
    res.render("edit-banner", { bannerData: bannerData });
  } catch (error) {
    console.log(error.message);
  }
};
const editBanner = async (req, res) => {
  try {
    if (
      !req.files ||
      !req.files.every((file) => file.mimetype.startsWith("image"))
    ) {
      const bannerData = await Banner.findById({ _id: id });
      return res.render("edit-banner", {
        imgMessage: "Only images are allowed...!",
        bannerData: bannerData,
      });
    } else {
      let resizedImages = [];
      const id = req.body.id;
      const tickOption = req.body.tickOption;
      let existingImages = [];
      if (tickOption == "yes") {
        let existingImages = [];
        const existingBanner = await Banner.findById(id);
        if (existingBanner && existingBanner.Image) {
          existingImages = existingBanner.Image || [];
        }

        const newImages = req.files.map((file) => file.filename);

        const removedImages = req.body.removedImages || [];

        const updatedImages = existingImages
          .concat(newImages)
          .filter((img) => !removedImages.includes(img));

        for (const file of updatedImages) {
          const resizedImg = `resized_${file}`;
          await sharp(`public/bannerimages/${file}`)
            .resize({ width: 900, height: 900 })
            .toFile(`public/bannerimages/${resizedImg}`);

          resizedImages.push(resizedImg);
        }
      } else {
        const existingBanner = await Banner.findById(id);
        if (existingBanner && existingBanner.Image) {
          existingImages = existingBanner.Image || [];
        }
        const newImages = req.files.map((file) => file.filename);
        const removedImages = req.body.removedImages || [];
        resizedImages = existingImages
          .concat(newImages)
          .filter((img) => !removedImages.includes(img));
      }
      const updatedData = {
        Name: req.body.name,
        Text: req.body.text,
        Target: req.body.target,
        expiryDate: req.body.date,
        Image: resizedImages,
      };

      const bannerData = await Banner.findByIdAndUpdate(id, updatedData, {
        new: true,
      });
      res.redirect("/admin/banner");
    }
  } catch (error) {
    console.log(error.message);
  }
};


module.exports = {
  banneranagement,
  loadAddBanner,
  addBanner,
  blockBanner,
  loadEditBanner,
  editBanner,
};