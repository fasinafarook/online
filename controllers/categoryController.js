const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const crypto = require('crypto');
const Offer = require("../models/offerModel");
const moment = require('moment')

//-----------------category-----------------------
const loadCategory = async (req, res) => {
    try {

        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        const CategoryData = await Category.find().populate('offer').skip(skip).limit(limit);
        const totalCount = await Category.countDocuments({});
        const totalPages = Math.ceil(totalCount / limit);
        const offerData = await Offer.find();


        res.render('category', {
            category: CategoryData, offer: offerData, moment, totalPages,
            currentPage: page,
        })

    } catch (error) {
        console.log(error.message);

    }
}

const loadAddCategory = async (req, res) => {
    try {
        res.render('addcategory')

    } catch (error) {
        console.log(error.message);

    }
}

//--------------add category----------------------
const addCategory = async (req, res) => {
    try {
        const existingCategory = await Category.findOne({ name: req.body.name });

        if (existingCategory) {
            return res.render('addcategory', { message: 'Category with the same name already exists.' });
        }

        const category = new Category({
            name: req.body.name,
            image: req.file.filename,

        });

        const categoryData = await category.save();

        if (categoryData) {
            res.redirect('/admin/Category');
        } else {
            res.render('addcategory', { message: 'Something went wrong...' });
        }
    } catch (error) {
        console.log(error.message);
        res.render('addcategory', { message: 'Internal Server Error' });
    }
};


const loadtoggleCategoryStatus = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const result = toggleCategoryStatus(categoryId);
        res.json(result);
    } catch (error) {
        console.log(error.message);
    }

};

const toggleCategoryStatus = async (categoryId) => {
    try {
        let categor;
        const categoryss = await Category.findById({ _id: categoryId })

        if (categoryss.is_active === 1) {
            categor = await Category.findByIdAndUpdate(categoryId, { $set: { is_active: 0 } }).exec();
        } else {
            categor = await Category.findByIdAndUpdate(categoryId, { $set: { is_active: 1 } }).exec();
        }

        if (categor) {
            categor.is_active = categor.is_active === 1 ? 0 : 1;
            await categor.save();

            return { success: true, action: categor.is_active === 1 ? 'block' : 'unblock', is_active: categor.is_active };

        } else {
            return { success: false, message: 'product not found' };
        }
    } catch (error) {
        console.log(error.message);
        return { success: false, message: 'Internal Server Error' };
    }
};

//edit category
const editCategoryLoad = async (req, res) => {
    try {
        const id = req.query.id;

        const categoryData = await Category.findById(id);

        if (!categoryData) {
            return res.status(404).send('Category not found.');
        }

        res.render('edit-category', { category: categoryData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const updateCategory = async (req, res) => {
    try {
        const id = req.body.id;
        const newName = req.body.name;

        // Check if the category name already exists
        const duplicateDataCount = await Category.countDocuments({
            name: { $regex: new RegExp(`^${newName}$`, "i") },
            _id: { $ne: id },
        });

        if (duplicateDataCount > 0) {
            const categoryData = await Category.find({});
            return res.render("edit-category", {
                category: categoryData,
                message: "Category name already exists.",
            });
        }

        let updateFields = { name: newName };

        if (req.file) {
            updateFields.image = req.file.filename;
        }

        // Update the category
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true }
        );

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};



//------------apply category offer----------------------
const applycategoryOffer = async (req, res) => {
    try {
        const { offerId, categoryId } = req.body;
        await Category.updateOne({ _id: categoryId }, { $set: { offer: offerId } });
        res.json({ success: true });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

//---------------remove category offer-----------------------
const removeCategoryOffer = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        await Category.updateOne({ _id: categoryId }, { $unset: { offer: "" } });
        res.json({ success: true });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};



module.exports = {
    loadCategory,
    loadAddCategory,
    addCategory,
    loadtoggleCategoryStatus,
    toggleCategoryStatus,
    editCategoryLoad,
    updateCategory,
    applycategoryOffer,
    removeCategoryOffer
}