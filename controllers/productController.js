const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Wishlist = require('../models/wishlistModel');
const Offer = require("../models/offerModel");
const moment = require ('moment')
const sharp = require("sharp");

const crypto = require('crypto');
const fs = require('fs').promises;



//-------------------------------------adminSide product----------------------------------------------------------------

const loadProducts = async (req, res) => {
    try {

        
        let sortQuery = {};

        switch (req.query.sortdata) {
            case "a-z":
              sortQuery = { name: 1 };
              break;
            case "z-a":
              sortQuery = { name: -1 };
              break;
            case "h-l":
              sortQuery = { price: -1 };
              break;
            case "l-h":
              sortQuery = { price: 1 };
              break;
            default:
              sortQuery = {};
              break;
          }
      
          let page = req.query.page ? parseInt(req.query.page) : 1;
          const limit = 8;
          const categoryId = req.query.id;
          const search = req.query.search || "";
          const max = parseFloat(req.query.max);
          const min = parseFloat(req.query.min);
      
          let filter = {};
      
          if (max && min) {
            filter.Saleprice = { $gte: min, $lte: max };
          }
      
          if (categoryId) {
            filter.category = categoryId;
          }
      
          if (search) {
            filter.name = { $regex: ".*" + search + ".*", $options: "i" };
          }
      
          let productData = [];
          let count = 0;
      
          productData = await Product.find(filter).populate({
              path: 'category',
              populate: {
                  path: 'offer',
                  model: 'Offer' 
              }
          }).populate('offer')
            .sort(sortQuery)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
      
          count = await Product.countDocuments(filter);
      
      
          const totalPages = Math.ceil(count / limit);
          const currentPage = page;
      
        
          const offerData = await Offer.find();
      
          const categories = await Category.find({ is_active: 1 });
          const offer = await Offer.find({ is_active: 1 });
        
      res.render('products', { 
          categories,
          user: req.session.user_id,
          product:productData,
          search,
          min,
          max,
          categoryId,
          sortdata: req.query.sortdata,
          totalPages,
          currentPage,
           offer:offerData,moment
      });
          
    } catch (error) {
        console.log(error.message);
    }
};


//----------------add product-----------------

const loadAddProduct = async (req,res)=>{
    try {
        const categories = await Category.find();
        //console.log(categories); 

        res.render('addproducts', { categories });
    } catch (error) {
        console.log(error.message);

    }
} 

const addProduct = async (req,res)=>{
    try {
        const categories = await Category.find();
        const existingProduct = await Product.findOne({ name: req.body.name });

        if (existingProduct) {
            return res.render('addproducts', { categories,message: 'Product with the same name already exists.' });
        }
        const images = req.files.map(file => file.filename);

           const product = new Product({
                name:req.body.name,
                image:images,         
                category:req.body.category,
                price:req.body.price,
                Saleprice: req.body.Saleprice,
                Quantity: req.body.Quantity,
                author:req.body.author,
                discription:req.body.discription,
                publisher:req.body.publisher,
                About_author:req.body.About_author,
                language:req.body.language,
                country:req.body.country,
                item_weight:req.body.item_weight,
                paperback:req.body.paperback
                });       
             const productData = await product.save();

        if(productData){
            res.redirect('/admin/products')

        }else{
            res.render('addproducts',{message:'something went wrong...'})

        }
    } catch (error) {
        console.log(error.message);

    }
};


//----------------------product status-------------------------
const loadtoggleProductStatus = async(req, res) => {
    try {
    const productId = req.params.productId;
    const result = toggleProductStatus(productId);
    res.json(result);
    } catch (error) {
        console.log(error.message);
    }
    
};


const toggleProductStatus = async (productId) => {
    try {
        let prodcts;
        const productss = await Product.findById({_id:productId})
        //console.log(productss)

        if (productss.is_active === 1) {
            prodcts = await Product.findByIdAndUpdate(productId, { $set: { is_product: 0 } }).exec();
        } else {
            prodcts = await Product.findByIdAndUpdate(productId, { $set: { is_product: 1 } }).exec();
        }

        if (prodcts) {
            prodcts.is_product = prodcts.is_product === 1 ? 0 : 1;
            await prodcts.save();
           
            return { success: true, action: prodcts.is_product === 1 ? 'block' : 'unblock', is_product: prodcts.is_product };
          
        } else {
            return { success: false, message: 'product not found' };
        }
    } catch (error) {
        console.log(error.message);
        return { success: false, message: 'Internal Server Error' };
    }
};



//--------------------edit product-----------------------
const editProductLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const productData = await Product.findById(id).populate("category");
        const categoryData = await Category.find({});

        if (!productData) {
            return res.status(404).send('Product not found.');
        }

        res.render("edit-product", {
            product: productData,
            categoryData: categoryData,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const editProduct = async (req, res) => {
    try {
        const id = req.body.id;

        // Check if files were uploaded
        if (!req.files || !req.files.every((file) => file.mimetype.startsWith("image"))) {
            const productData = await Product.findById(id).populate("category");
            const categoryData = await Category.find({});

            if (!productData) {
                return res.status(404).send('Product not found.');
            }

            return res.render("edit-product", {
                product: productData,
                categoryData: categoryData,
                imgMessage: "Only images are allowed...!",
            });
        }

        let resizedImages = [];
        const tickOption = req.body.tickOption;
        let existingImages = [];
        let updatedImages;

        const categoryData = await Category.findOne({ name: req.body.category });
        const existingProduct = await Product.findById(id);

        if (existingProduct && existingProduct.image) {
            existingImages = existingProduct.image || [];
        }

        if (tickOption === "yes") {
            const newImages = req.files.map((file) => file.filename);
            const removedImages = req.body.removedImages || [];
            updatedImages = existingImages.concat(newImages).filter((img) => !removedImages.includes(img));

            for (const file of updatedImages) {
                if (!existingImages.includes(file)) {
                    const resizedImg = `resized_${file}`;
                    await sharp(`public/productimages/${file}`)
                        .resize({ width: 965, height: 1440 })
                        .toFile(`public/productimages/${resizedImg}`);

                    resizedImages.push(resizedImg);
                } else {
                    resizedImages.push(file);
                }
            }
        } else {
            const newImages = req.files.map((file) => file.filename);
            const removedImages = req.body.removedImages || [];
            resizedImages = existingImages.concat(newImages).filter((img) => !removedImages.includes(img));
        }

        const data = req.body.name;
        const duplicateDataCount = await Product.countDocuments({
            name: { $regex: new RegExp(`^${data}$`, "i") },
            _id: { $ne: id },
        });

        if (duplicateDataCount > 0) {
            const productData = await Product.findById(id).populate("category");
            const categoryData = await Category.find({});

            return res.render("edit-product", {
                product: productData,
                categoryData: categoryData,
                message: "Already exists...!",
                
            });
        }
        

        const updatedData = {
            name: req.body.name,
            image: resizedImages,
            category: categoryData._id,
            price: req.body.price,
            Saleprice: req.body.Saleprice,
            Quantity: req.body.Quantity,
            author: req.body.author,
            description: req.body.description,
            publisher: req.body.publisher,
            About_author: req.body.About_author,
            language: req.body.language,
            country: req.body.country,
            item_weight: req.body.item_weight,
            paperback: req.body.paperback,
        };

        const productData = await Product.findByIdAndUpdate(id, updatedData, {
            new: true,
        });

        res.redirect("/admin/products");
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

//------------image removed --------------
const deleteImg =  async (req, res) => {
    const { removedImages } = req.body;

    try {
        for (const imageURL of removedImages) {
            const imagePath = `./public/productimages/${imageURL}`; 
            await fs.unlink(imagePath);
            console.log(`Image deleted: ${imageURL}`);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error deleting images:', error);
        res.sendStatus(500);
    }
};



//------------ apply product offer -----------------
const applyProductOffer = async (req, res) => {
    try {
        const { offerId, productId  } = req.body;
        await Product.updateOne({ _id: productId  }, { $set: { offer: offerId } });
        res.json({ success: true });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

//---------------remove product offer--------------------
const removeProductOffer = async (req, res) => {
    try {
        const productId  = req.body.productId ;
        await Product.updateOne({ _id: productId  }, { $unset: { offer: "" } });
        res.json({ success: true });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};





//-----------------------------------------userSide------------------------------------------------------------------------

const loadUserProducts = async (req, res) => {
    try {
            let sortQuery = {};
        
            switch (req.query.sortdata) {
              case "a-z":
                sortQuery = { name: 1 };
                break;
              case "z-a":
                sortQuery = { name: -1 };
                break;
              case "h-l":
                sortQuery = { price: -1 };
                break;
              case "l-h":
                sortQuery = { price: 1 };
                break;
              default:
                sortQuery = {};
                break;
            }
        
            let page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = 4;
            const categoryId = req.query.id;
            const search = req.query.search || "";
            const max = parseFloat(req.query.max);
            const min = parseFloat(req.query.min);
        
            let filter = {};
        
            if (max && min) {
              filter.Saleprice = { $gte: min, $lte: max };
            }
        
            if (categoryId) {
              filter.category = categoryId;
            }
        
            if (search) {
              filter.name = { $regex: ".*" + search + ".*", $options: "i" };
            }
        
            let productData = [];
            let count = 0;
        
            productData = await Product.find(filter).populate({
                path: 'category',
                populate: {
                    path: 'offer',
                    model: 'Offer' // Assuming 'Offer' is the name of your Offer model
                }
            }).populate('offer')
              .sort(sortQuery)
              .skip((page - 1) * limit)
              .limit(limit)
              .exec();
        
            count = await Product.countDocuments(filter);
        
        
            const totalPages = Math.ceil(count / limit);
            const currentPage = page;
        
          

        
            const categories = await Category.find({ is_active: 1 });
            const offer = await Offer.find({ is_active: 1 });
    
          
    
          productData.forEach(product => {
            if (!product.offer && product.category && product.category.offer) {
                // Apply category-level offer to the product
                product.offer = product.category.offer;
            } else if (product.offer && product.category && product.category.offer) {
                // Compare offer percentages and assign the higher one
                if (product.offer.percentage < product.category.offer.percentage) {
                    product.offer = product.category.offer;
                }
            }
        });
          
          
        res.render('product', { 
            categories,
            user: req.session.user_id,
            productData,
            search,
            min,
            max,
            categoryId,
            sortdata: req.query.sortdata,
            totalPages,
            currentPage,
            offer,offer 
        });
            
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const productDetails = async (req, res) => {
    try {
        const categories = await Category.find({ is_active: 1 });
        const offer = await Offer.find({ is_active: 1 });


        const productId = req.params.id;

        const products = await Product.find({ is_product: 1, _id: { $ne: productId } }).populate({
            path: 'category',
            populate: {
                path: 'offer',
                model: 'Offer' 
            }
        }).populate('offer');
        
        const product = await Product.findById(productId).populate('category').populate('offer')
        products.forEach(product => {
            if (!product.offer && product.category && product.category.offer) {
                // Apply category-level offer to the product
                product.offer = product.category.offer;
            } else if (product.offer && product.category && product.category.offer) {
                // Compare offer percentages and assign the higher one
                if (product.offer.percentage < product.category.offer.percentage) {
                    product.offer = product.category.offer;
                }
            }
        });
          

        res.render('productDetails', { product ,products ,categories,user: req.session.user_id ,offer:offer});
    } catch (error) {
        console.error(error.message);
    }
};

module.exports ={
    loadProducts,
    addProduct,
    loadAddProduct,
    loadtoggleProductStatus,
    toggleProductStatus,
    editProductLoad,
    editProduct,
    loadUserProducts,
    productDetails,
    deleteImg,
    applyProductOffer,
    removeProductOffer

}