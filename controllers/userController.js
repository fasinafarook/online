
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const crypto = require('crypto');
const Offer = require("../models/offerModel");
const Banner = require("../models/bannerModel");






const securePassword = async(password)=>{
  try {
      const passwordHash = await bcrypt.hash(password,10) ;
      return passwordHash;
  } catch (error) {
      console.log(error.message);
  }
};

const generateReferralCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 8; 
  let referralCode = '';

  for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      referralCode += characters[randomIndex];
  }

  return referralCode;
};



//-------------------load home--------------------------------

const loadHome = async (req, res) => {
    try {

      const bannerHome1 = await Banner.findOne({
        Name: "Banner for home page 1",
        is_active: 1,
      });
      const bannerHome2 = await Banner.findOne({
        Name: "Banner for home page 2",
        is_active: 1,
      });
      switch (req.query.sortdata) {
        case "a-z":
          sortQuery = { name: 1 };
          break;
        case "z-a":
          sortQuery = { name: -1 };
          break;
        case "h-l":
          sortQuery = { products: -1 };
          break;
        case "l-h":
          sortQuery = { products: 1 };
          break;
        default:
          sortQuery = {};
          break;
      }
      let filter = {};
      const limit = 9;
      const search = req.query.search || "";
      let page = req.query.page ? parseInt(req.query.page) : 1;

        
      const categoryId = req.query.id;

      if (categoryId) {
        filter.category = categoryId;
      }
      if (search) {
        filter.name = { $regex: ".*" + search + ".*", $options: "i" };
      }
      let productData = [];
            let count = 0;
        
            productData = await Product.find(filter)
              .sort(sortQuery)
              .skip((page - 1) * limit)
              .limit(limit)
              .exec();
        
        count = await Product.countDocuments(filter);

        const categories = await Category.find({ is_active: 1 });
        const offer = await Offer.find({ is_active: 1 });

        const products = await Product.find({ is_product: 1 }).populate({
          path: 'category',
          populate: {
              path: 'offer',
              model: 'Offer' 
          }
      }).populate('offer');

      products.forEach(product => {
        if (!product.offer && product.category && product.category.offer) {
            product.offer = product.category.offer;
        } else if (product.offer && product.category && product.category.offer) {
            if (product.offer.percentage < product.category.offer.percentage) {
                product.offer = product.category.offer;
            }
        }
    });

      res.render('home', { 
          products, 
          categories,
          user: req.session.user_id,
          sortdata: req.query.sortdata,
          productData,
          search,
          offer: offer,
          bannerHome1: bannerHome1,
          bannerHome2: bannerHome2,

           });
    } catch (error) {
        console.log(error.message);
    }
};




 //--------------------------user login--------------------------------
 const loginLoad = async(req,res)=>{

    try {
        const categories = await Category.find({ is_active: 1 });
        const products = await Product.find({ is_product: 1 }).populate('category');

         res.render('login', { products, categories,user: req.session.user_id });

    } catch (error) {
         console.log(error.message);
        
    }

}

//-----------------------signup-------------------------------------

const loadRegister = async(req,res)=>{

    try{
      const userId = req.session.user_id;

        res.render('signup',{user:userId});

    }catch(error){
        console.log(error.message);
    }

}

const insertUser = async (req, res) => {
    try { 
      const referralCode = req.body.referralCode;
      console.log(referralCode)

      const existingUser = await User.findOne({
        $or: [{ email: req.body.email }, { mobile: req.body.mobile }],
      });
  
      if (existingUser) {
        console.log('Email or mobile number already exists.');
        return res.render('signup', { message: 'Email or mobile number already exists.' });
      }
  
      const spassword = await securePassword(req.body.password);
      const generatedOTP = await generateOTP();
      await sendVerifyMail(req.body.email, generatedOTP);

      if (referralCode) {
        const referringUser = await User.findOne({ referralCode: referralCode });
        if (!referringUser) {
            return res.render('signup', { message: 'Invalid referral code' });
        }
        referringUser.wallet += 50; 
        await referringUser.save();
    

      const generatereferralCode =generateReferralCode()

      
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        password: spassword,
        is_admin: 0,
        wallet: 20,
        referredBy: referringUser._id 

      });
  
      if (req.body.password == req.body.confirmPassword) {
        const data = {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
          password: spassword,
          is_admin: 0,
          otp: generatedOTP,
          wallet: 20,
         referralCode: generatereferralCode,
         referredBy: referringUser._id 

        };
  console.log("refferal:",generatereferralCode)
        req.session.data = data;
        res.redirect('/email-verified');
      } else {
        res.render('signup', { message: "Your password does not match...!!!" });
      }
    } else{
      const generatereferralCode =generateReferralCode()


      const user = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        password: spassword,
        is_admin: 0,
        wallet: 0,

      });
  
      if (req.body.password == req.body.confirmPassword) {
        const data = {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
          password: spassword,
          is_admin: 0,
          otp: generatedOTP,
          wallet: 0,
         referralCode: generatereferralCode 

        };
  console.log("refferalcode:",generatereferralCode)
        req.session.data = data;
        res.redirect('/email-verified');
      } else {
        res.render('signup', { message: "Your password does not match...!!!" });
      }
    }
  }catch (error) {
      console.log('Error during user registration:', error.message);
      res.render('signup', { message: 'Registration failed. Please try again.' });
    }
  };

//----------------------------otp-----------------------------------------------
  const sendVerifyMail = async (data, generatedOTP) => {
    try {
      let mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'skycrowlove@gmail.com',
          pass: 'rete eeaa kcdk pbwm',
        },
      });
  console.log(generatedOTP)
      let mailDetails = {
        from: 'xyz@gmail.com',
        to: data,
        subject: `Your OTP is: ${generatedOTP}`,
        text: 'Your OTP for validation',
      };
  
      mailTransporter.sendMail(mailDetails, function (err, data) {
        if (err) {
          console.log('Error Occurs');
        } else {
          console.log(`Email sent successfully`);
        }
      });
    } catch (error) {
      console.error('Error during OTP generation:', error);
      throw error;
    }
  };


const loadotp = async(req,res)=>{
    try {
      const userId = req.session.user_id;
        res.render('email-verified',{user:userId})
    } catch (error) {
        console.log(error.message);
    }
}


const veryfyotp = async (req, res) => {
  try {
    if (req.session && req.session.data && req.session.data.otp) {
      const generatedOTP = req.session.data.otp;
      console.log('Generated OTP:', generatedOTP);
      console.log('Entered OTP:', req.body.otp);

      if (generatedOTP == req.body.otp) {
        console.log('Correct OTP entered');
        const user = new User(req.session.data);
        const userData = await user.save();

        if (userData) {
          req.session.data.otp = null;
          return res.status(200).json({ success: true });
        } else {
          return res.status(200).json({ success: false, message: 'Your registration has been Failed...!!! Incorrect OTP' });
        }
      } else {
       
        return res.status(200).json({ success: false, message: 'Incorrect OTP entered. Please try again.' });
      }
    } else {
      return res.status(200).json({ success: false, message: 'Session data not found or OTP not set. Try again later' });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};





//for mail

const generateOTP = async () => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(4, (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          const otp = buffer.readUInt32BE(0) % 10000;
          resolve(String(otp).padStart(4, '0'));
        }
      });
    });
  };
  
  
  
  const updateLastResendTime = (req, res, next) => {
    req.session.lastResendTime = req.session.lastResendTime || 0;
    next();
  };
  
 
const resendOTP = async (req, res) => {
    try {
      const currentTime = new Date().getTime();
      const timeDifference = (currentTime - req.session.lastResendTime) / 1000; // Convert to seconds
  
      if (timeDifference >= 60) {
        const generatedOTP = await generateOTP();
        const email = req.session.data.email;
  
        req.session.data.otp = generatedOTP;
  
        await sendVerifyMail(email, generatedOTP);
  
        req.session.lastResendTime = currentTime;
  
        res.status(200).json({ message: 'OTP resent successfully.' });
      } else {
        res.status(429).json({ error: 'Please wait for a minute before trying again.' });
      }
    } catch (error) {
      console.error('Error during OTP resend:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  
//----------------------------veryfylogin---------------------------
const verifyLogin = async(req,res)=>{

    try {
        const email = req.body.email;
        const password = req.body.password;

       const userData = await User.findOne({email:email,is_admin:0});

       if(userData){
        const pwdMatch = await bcrypt.compare(password,userData.password);

        if(pwdMatch){
            if(userData.is_verified === 0){
              
                res.render('login',{message:"admin blocked you"});

            }else{
               
                req.session.user_id = userData._id;
                res.redirect('/');

            }

        }else{
           
            res.render('login',{message:"Email and password is incorrect"});

        }

       }else{
        res.render('login',{message:"Email and password is incorrect"});
       }
        
    } catch (error) {
        console.log(error.message);
    }
}


  
  
//------------------------------user logout---------------------------------

const userLogout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/');

    } catch (error) {
        console.log(error.message);

    }
};


//--------------------------------------------------------------------

const showeditaddress = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const index = req.query.index;
    const user = await User.findById(userId);
    const userAddress = user ? user.address[index] : null;
    const categories = await Category.find({ is_active: 1 });
    const products = await Product.find({ is_product: 1 }).populate('category');
    res.render("editAddress", { categories,products,userAddress, index: index ,user: req.session.user_id});
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const editaddress = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const index = req.body.index;
    const user = await User.findById(userId);
    if (user) {
      const userAddress = user.address[index];
      if (userAddress) {
        userAddress.firstName = req.body.fname;
        userAddress.lastName = req.body.lname;
        userAddress.City = req.body.city;
        userAddress.District = req.body.district;
        userAddress.State = req.body.state;
        userAddress.Pincode = req.body.pincode;
        await user.save();
      }
    }
    const categories = await Category.find({ is_active: 1 });
    const products = await Product.find({ is_product: 1 }).populate('category');

    res.redirect("/account");
  } catch (error) {
    console.log(error.message)
    next(new Error("An error occurred"));
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const index = req.query.index;
    const user = await User.findById(userId);
    if (user) {
      const userAddress = user.address[index];
      if (userAddress) {
        const deleteAdress = await User.updateOne(
          { _id: userId },
          { $pull: { address: userAddress } }
        );
        res.redirect("/account");
      }
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const addaddress = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
//console.log(userId)
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
    console.log(user);

    res.redirect("/account");
  } catch (error) {
    console.error('Error in addaddress:', error);
    next(new Error("An error occurred"));
  }
};

//account
const accountManagment = async (req, res, next) => {
  try {
    id = req.session.user_id;
    const userData = await User.findById({ _id: id });
    const referralCode = userData.referralCode;

    // const orderData = await Order.find({ userId: id }).sort({
    //   currentData: -1,
    // });

    const categories = await Category.find({ is_active: 1 });
    const products = await Product.find({ is_product: 1 }).populate('category');

    const orderData = await Order.find({ userId: id})
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
          .sort({ currentData: -1 });
         
         
      if (orderData && orderData.length > 0) {
          orderData.forEach(order => {
              if (order.items && order.items.length > 0) {
                  order.items.forEach(productItem => {
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
              }
          });
      }

     
    console.log(userData);
    


    res.render("Account", {referralCode,categories, products,userData: userData, orderData: orderData,user: req.session.user_id });
  } catch (error) {
    next(new Error("An error occurred"));
  }
};




const profileEdit = async (req, res, next) => {
  try {
    const id = req.session.user_id;
    const { name, email, mobile } = req.query;
    const existEmail = await User.findOne({ _id: { $ne: id }, email: email });
    if (!existEmail) {
      const existMobile = await User.findOne({
        _id: { $ne: id },
        mobile: mobile,
      });
      if (!existMobile) {
        const userData = await User.findOneAndUpdate(
          { _id: id },
          { $set: { name: name, email: email, mobile: mobile } },
          { new: true }
        );
        res.redirect("/account");
      } else {
        let Phone = "Phone number already exists...!";
        return res.status(400).json(Phone);
      }
    } else {
      const Email = "Email already exists...!";
      return res.status(400).json(Email);
    }
  } catch (error) {
    next(new Error("An error occurred"));
    res.status(500).send("Internal Server Error");
  }
};

const changePassword = async (req, res, next) => {
  try {
    id = req.session.user_id;
    const oldPassword = req.query.currentPassword;
    const newPassword = req.query.newPassword;
    const userData = await User.findById({ _id: id });
    const passwordMatch = await bcrypt.compare(oldPassword, userData.password);
    if (passwordMatch) {
      const spassword = await securePassword(newPassword);
      const changePassword = await User.findOneAndUpdate(
        { _id: id },
        { $set: { password: spassword } }
      );
      res.redirect("/account");
    } else {
      return res.status(400).json({ message: "Password is not matching...!" });
    }
  } catch (error) {
    next(new Error("An error occurred"));
  }
};

const paymentPolicy =async (req, res, next) => {
  try {
    const categories = await Category.find({ is_active: 1 });
    const products = await Product.find({ is_product: 1 }).populate('category');

    res.render('paymentPolicy',{categories,products,user: req.session.user_id});

    
  } catch (error) {
    next(new Error("An error occurred"));

  }
}



module.exports ={
    loadHome,
    verifyLogin,
    loadRegister,
    loginLoad,
    insertUser,
    loadotp,
    resendOTP,
    updateLastResendTime,
    veryfyotp,
    userLogout,
    accountManagment,
    showeditaddress,
    editaddress,
    deleteAddress,
    addaddress,
    profileEdit,
    changePassword,
    paymentPolicy
}