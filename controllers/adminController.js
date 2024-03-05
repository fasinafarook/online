const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/coupenModel");
const dashboardHandler = require("../handler/dashboardHandler");

const bcrypt = require('bcrypt');
const Swal = require('sweetalert2');
const sharp = require("sharp");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const ExcelJS = require('exceljs');

//-----------------admin login--------------------------
const loadLogin = async(req,res)=>{

    try{
        res.render('admin-login');

    }catch(error){
        console.log(error.message);
    }

}



const veryfyLogin = async(req,res)=>{

    try{
        //console.log('ok')

        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({email:email});
        if(userData){
            const pwdMatch = await bcrypt.compare(password,userData.password);

            if(pwdMatch){
                if(userData.is_admin === 0){
                    res.render('admin-login',{message:"Not an Admin"});

             }else{
                req.session.user = userData._id;
                res.redirect('/admin/home')
            }
            }else{
               res.render('admin-login',{message:"Access Danied...please check your email & password"});

            }}else{
            res.render('admin-login',{message:"Access Danied...please check your email & password"});
        }

        

    }catch(error){
        console.log(error.message);
    }

};

//------------------dashboard------------------------------

const loadDashboard = async (req, res) => {
    try {
        
      let arrayforUser = [];
      let arrayforYearlyOrder = [];
      let arrayforMonthlyOrder = [];
      let arrayforStatus = [];
      const monthlyUserCounts = await dashboardHandler.getMonthlyUserCount();
      monthlyUserCounts.forEach((monthData) => {
        const { month, count } = monthData;
        arrayforUser.push(count);
      });
      const monthlyOrderCounts = await dashboardHandler.getMonthlyOrderDetails();
      monthlyOrderCounts.forEach((monthData) => {
        const { month, count } = monthData;
        arrayforMonthlyOrder.push(count);
      });
      const yearlyOrderCounts = await dashboardHandler.getYearlyOrderDetails();
      yearlyOrderCounts.forEach((yearData) => {
          const { year, count } = yearData;
          arrayforYearlyOrder.push(count);
      });

      console.log('month:',monthlyOrderCounts,'yearlly:',yearlyOrderCounts)
      const statusPercentages = await dashboardHandler.getOrderStatusPercentages();
        statusPercentages.forEach((statusData) => {
            const { status, percentage } = statusData;
            arrayforStatus.push(percentage);
        });

        const roundedArray = arrayforStatus.map((number) =>
            Number(number.toFixed(2))
        );
        console.log(roundedArray)
        const topSellingProducts = await dashboardHandler.getTopSellingProducts();

        console.log(topSellingProducts)

        const getTopSellingCategories = await dashboardHandler.getTopSellingCategories();

        console.log(getTopSellingCategories)

        const getTopSellingBrands = await dashboardHandler.getTopSellingBrands();

        console.log(getTopSellingBrands)

      const productCount = await Product.countDocuments({});
      const categoryCount = await Category.countDocuments({});
      const orderCount = await Order.countDocuments({});
      const revenue = await dashboardHandler.calculateDeliveredRevenue();
      const monthlyrevenue = await dashboardHandler.getCurrentMonthRevenue();
      // const deliveredOrderCount = await dashboardHandler.getDeliveredOrderCount();
      // const getCancelledOrderCount = await dashboardHandler.getCancelledOrderCount();
      // const getReturnOrderCount = await dashboardHandler.getReturnOrderCount();
      // const getPendingOrderCount = await dashboardHandler.getPendingOrderCount();
      // const getPlaceCount = await dashboardHandler.getPlaceCount();
      // const allpendings = getPlaceCount +getPendingOrderCount
      // const alldelivered = deliveredOrderCount+getReturnOrderCount+getCancelledOrderCount
      console.log(revenue,monthlyrevenue)

      let orderData = await Order.aggregate().sort({ currentData: -1 });

      await Order.populate(orderData, {
          path: 'items.productId',
          select: 'name price quantity ',
          populate: [{
              path: 'offer'
          }, {
              path: 'category',
              populate: {
                  path: 'offer'
              }
          }]
      });

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

      orderData.forEach(order => {
          order.items = order.items.filter(item => item.status === "Delivered");
      });



      let totalDeliveredProducts = 0;

      for (let order of orderData) {
          let deliveredItems = order.items.filter(item => item.status === "Delivered");
          totalDeliveredProducts += deliveredItems.length;
      }


      let totalAmount = orderData.reduce((acc, order) => acc + order.totalAmount, 0);
      let totalAmountWithDiscount = 0;

      for (let order of orderData) {
          let deliveredItems = order.items.filter(item => item.status === "Delivered");
          let orderTotal = deliveredItems.reduce((acc, item) => {
              let productPrice = item.productId.price;
              let itemPrice = item.offer ? productPrice * (1 - item.offer.percentage / 100) : productPrice;
              return acc + (itemPrice * item.quantity);
          }, 0);

          totalAmountWithDiscount += orderTotal;
      }
      console.log(totalAmountWithDiscount)

        const deliveredOrders = orderData.filter(order => order.items.some(item => item.status === "Delivered"));

        const currentDate = new Date();

        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const deliveredOrdersInCurrentMonth = deliveredOrders.filter(order => {
            const orderDate = new Date(order.currentData);
            return orderDate >= firstDayOfMonth && orderDate <= lastDayOfMonth;
        });

        const currentMonthDeliveredRevenue = deliveredOrdersInCurrentMonth.reduce((total, order) => {
            
            const orderTotal = order.items.reduce((acc, item) => {
                if (item.status === "Delivered") {
                    const productPrice = item.productId.price;
                    const itemPrice = item.offer ? productPrice * (1 - item.offer.percentage / 100) : productPrice;
                    return acc + (itemPrice * item.quantity);
                }
                return acc;
            }, 0);
            return total + orderTotal;
        }, 0);

        console.log("Current month revenue for delivered products:", currentMonthDeliveredRevenue);


      res.render("home", {
        arrayforUser: arrayforUser,
        arrayforYearlyOrder: arrayforYearlyOrder,
        arrayforMonthlyOrder: arrayforMonthlyOrder,
        productCount: productCount,
        categoryCount: categoryCount,
        orderCount: orderCount,
        revenue: totalAmountWithDiscount,
        monthlyrevenue: currentMonthDeliveredRevenue,
        arrayforStatus: JSON.stringify(roundedArray),
        topSellingProducts: JSON.stringify(topSellingProducts), // Convert to JSON string
        topSellingCategories: JSON.stringify(getTopSellingCategories),
        topSellingBrands:JSON.stringify(getTopSellingBrands),
        
        // allpendings,alldelivered,
        // totalOrderedProductCount: arrayforOrder.reduce((acc, cur) => acc + cur, 0), // Calculate total ordered product count

        // deliveredOrderCount,getCancelledOrderCount,getReturnOrderCount,getPendingOrderCount,getPlaceCount

      });
      
    } catch (error) {
      console.log(error.message);
    }
  };



  const reportDetails = async (req, res) => {
    try {
        const SortedData = req.query.sorting;
        let startDate = req.query.startDateInput;
        let endDate = req.query.endDateInput;
        const filter = req.query.filter || 'year';

        let pipeline = [
            {
                $match: {
                    "items.status": "Delivered"
                }
            }
        ];

        let startDates, endDates;
        switch (filter) {
            case 'day':
                startDates = new Date();
                startDates.setHours(0, 0, 0, 0); 
                endDates = new Date();
                endDates.setHours(23, 59, 59, 999); 
                break;
            case 'week':
                startDates = new Date();
                startDates.setDate(startDates.getDate() - 7);
                endDates = new Date();
                break;
            case 'month':
                startDates = new Date();
                startDates.setMonth(startDates.getMonth() - 1);
                endDates = new Date();
                break;
            case 'year':
                startDates = new Date();
                startDates.setFullYear(startDates.getFullYear() - 1);
                endDates = new Date();
                break;
            default:
                startDates = new Date();
                endDates = new Date();
                break;
        }

        if ((startDate && endDate) || (["paypal", "wallet", "Cash on delevery"].includes(SortedData) && SortedData !== "all dates")) {
            let dateMatch = {};

            if (startDate && endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
                adjustedEndDate.setHours(0, 0, 0, 0);

                dateMatch = {
                    currentData: { $gte: new Date(startDate), $lt: adjustedEndDate }
                };
            }
            let paymentMatch = {};

            if (SortedData && SortedData !== "All Dates") {
                paymentMatch = {
                    paymentMethod: SortedData
                };
            }

            pipeline.push({
                $match: {
                    $and: [dateMatch, paymentMatch]
                }
            });
        }

        let orderData = await Order.aggregate(pipeline).sort({ currentData: -1 });

        await Order.populate(orderData, {
            path: 'items.productId',
            select: 'name price quantity ',
            populate: [{
                path: 'offer'
            }, {
                path: 'category',
                populate: {
                    path: 'offer'
                }
            }]
        });

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

        orderData.forEach(order => {
            order.items = order.items.filter(item => item.status === "Delivered");
        });

        let filteredOrderData = orderData.filter(order => order.currentData >= startDates && order.currentData <= endDates);

        let orderCount = filteredOrderData.length;

        let totalDeliveredProducts = 0;

        for (let order of filteredOrderData) {
            let deliveredItems = order.items.filter(item => item.status === "Delivered");
            totalDeliveredProducts += deliveredItems.length;
        }

        let paypalCount = filteredOrderData.filter(order => order.paymentMethod === "paypal").length;
        let codCount = filteredOrderData.filter(order => order.paymentMethod === "Cash on delevery").length;
        let walletCount = filteredOrderData.filter(order => order.paymentMethod === "wallet").length;

        let totalAmount = filteredOrderData.reduce((acc, order) => acc + order.totalAmount, 0);
        let totalAmountWithDiscount = 0;

        for (let order of filteredOrderData) {
            let deliveredItems = order.items.filter(item => item.status === "Delivered");
            let orderTotal = deliveredItems.reduce((acc, item) => {
                let productPrice = item.productId.price;
                let itemPrice = item.offer ? productPrice * (1 - item.offer.percentage / 100) : productPrice;
                return acc + (itemPrice * item.quantity);
            }, 0);

            totalAmountWithDiscount += orderTotal;
        }

        let totalDiscount = totalAmount - totalAmountWithDiscount;

        res.render("report", {
            orderData,
            startDate,
            endDate,
            SortedData,
            orderCount,
            paypalCount,
            codCount,
            walletCount,
            totalAmount: totalAmountWithDiscount,
            totalDiscount,
            totalDeliveredProducts,
            filter: filter,
            filterStartDate: startDates,
            filterEndDate: endDates,

        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

  
// const reportDetails = async (req, res) => {
//   try {
//       const SortedData = req.query.sorting;
//       let startDate = req.query.startDateInput;
//       let endDate = req.query.endDateInput;
//       const filter = req.query.filter || 'year'; 


//       let pipeline = [
//           {
//               $match: {
//                   "items.status": "Delivered" 
//               }
//           }
//       ];
//       let startDates, endDates;
//       switch (filter) {
//         case 'day':
//           startDates = new Date();
//           startDates.setHours(0, 0, 0, 0); // Set start time to the beginning of the day
//           endDates = new Date();
//           endDates.setHours(23, 59, 59, 999); // Set end time to the end of the day
//           break;
//         case 'week':
//           startDates = new Date();
//           startDates.setDate(startDates.getDate() - 7);
//           endDates = new Date();
//           break;
//         case 'month':
//           startDates = new Date();
//           startDates.setMonth(startDates.getMonth() - 1);
//           endDates = new Date();
//           break;
//         case 'year':
//           startDates = new Date();
//           startDates.setFullYear(startDates.getFullYear() - 1);
//           endDates = new Date();
//           break;
//         default: 
//           startDates = new Date();
//           endDates = new Date();
//           break;
//       }
//       if ((startDate && endDate) || (["paypal", "wallet", "Cash on delevery"].includes(SortedData) && SortedData !== "all dates")) {
//           let dateMatch = {};

//           if (startDate && endDate) {
//               const adjustedEndDate = new Date(endDate);
//               adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
//               adjustedEndDate.setHours(0, 0, 0, 0);

//               dateMatch = {
//                   currentData: { $gte: new Date(startDate), $lt: adjustedEndDate }
//               };
//           }
//           let paymentMatch = {};

//           if (SortedData && SortedData !== "All Dates") {
//               paymentMatch = {
//                   paymentMethod: SortedData
//               };
//           }

//           pipeline.push({
//               $match: {
//                   $and: [dateMatch, paymentMatch]
//               }
//           });
//       }

     
//       let orderData = await Order.aggregate(pipeline).sort({ currentData: -1 });

//       await Order.populate(orderData, {
//           path: 'items.productId',
//           select: 'name price quantity ',
//           populate: [{
//               path: 'offer'
//           }, {
//               path: 'category',
//               populate: {
//                   path: 'offer'
//               }
//           }]
//       });
//       if (orderData && orderData.length > 0) {
//                   orderData.forEach(order => {
//                       if (order.items && order.items.length > 0) {
//                           order.items.forEach(productItem => {
//                               if (!productItem.offer && productItem.productId.offer) {
//                                   productItem.offer = productItem.productId.offer;
//                               } else if (productItem.offer && productItem.productId.offer) {
//                                   if (productItem.offer.percentage < productItem.productId.offer.percentage) {
//                                       productItem.offer = productItem.productId.offer;
//                                   }
//                               } else if (!productItem.offer && productItem.productId.category && productItem.productId.category.offer) {
//                                   productItem.offer = productItem.productId.category.offer;
//                               } else if (productItem.offer && productItem.productId.category && productItem.productId.category.offer) {
//                                   if (productItem.offer.percentage < productItem.productId.category.offer.percentage) {
//                                       productItem.offer = productItem.productId.category.offer;
//                                   }
//                               }
//                           });
//                       }
//                   });
//               }
//       orderData.forEach(order => {
//           order.items = order.items.filter(item => item.status === "Delivered");
//       });

//       let orderCount = orderData.length;

//       let totalDeliveredProducts = 0;

// for (let order of orderData) {
//     let deliveredItems = order.items.filter(item => item.status === "Delivered");
    
//     totalDeliveredProducts += deliveredItems.length;
// }

//       let paypalCount = orderData.filter(order => order.paymentMethod === "paypal").length;
//       let codCount = orderData.filter(order => order.paymentMethod === "Cash on delevery").length;
//       let walletCount = orderData.filter(order => order.paymentMethod === "wallet").length;
//       let totalAmounts = orderData.reduce((acc, order) => acc + order.totalAmount, 0);
//       let totalAmount = 0;

//       for (let order of orderData) {
//           let deliveredItems = order.items.filter(item => item.status === "Delivered");
//           let orderTotal = deliveredItems.reduce((acc, item) => {
//               let productPrice = item.productId.price;
//               let itemPrice = item.offer ? productPrice * (1 - item.offer.percentage / 100) : productPrice;
//               return acc + (itemPrice * item.quantity);
//           }, 0);
          
//           totalAmount += orderTotal;        
//       }  
//       totalDiscount=totalAmounts-totalAmount

//         res.render("report", {
//           orderData,
//           startDate,
//           endDate,
//           SortedData,
//           orderCount,
//           paypalCount,
//           codCount,
//           walletCount,
//           totalAmount,
//           totalDiscount,
//           totalDeliveredProducts,
//           filter: filter,
//           filterStartDate: startDates,
//           filterEndDate: endDates ,
          
//       });
//   } catch (error) {
//       console.log(error);
//       res.status(500).send("Internal Server Error");
//   }
// };


//--------------logout-------------------------------

const adminLogout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);

    }
};



//-----------------------users---------------------------------

const loadUsers = async(req,res)=>{
    try {
        var search = '';
        if(req.query.search){
            search = req.query.search
        }
        const usersData = await User.find({
            is_admin:0,
            $or:[
                {name:{ $regex:'.*'+search+'.*',$options:'i' }},
                {email:{ $regex:'.*'+search+'.*',$options:'i'}},
                {mobile:{ $regex:'.*'+search+'.*',$options:'i'}}
            ]
        })
        res.render('users',{users:usersData});

    } catch (error) {
        console.log(error.message);

    }
};

//block/unblock button

const loadtoggleUserStatus = async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await toggleUserStatus(userId, req);
        if (result.redirectToLogin) {
            res.redirect('/login');
        } else {
            res.json(result);
        }
    } catch (error) {
        console.log(error.message);
    }
};

const toggleUserStatus = async (userId, req) => {
    try {
        let user;
        const users = await User.findById({_id:userId});

        if (!users) {
            return { success: false, message: 'User not found' };
        }

        if (users.is_verified === 1) {
            user = await User.findByIdAndUpdate(userId, { $set: { is_verified: 0 } }).exec();
        } else {
            user = await User.findByIdAndUpdate(userId, { $set: { is_verified: 1 } }).exec();
        }

        if (user) {
            user.is_verified = user.is_verified === 1 ? 0 : 1;
            await user.save();

            if (req.session.user_id && req.session.user_id.toString() === userId.toString()) {
                req.session.user_id = null;
            }

            return { success: true, action: user.is_verified === 1 ? 'block' : 'unblock', is_verified: user.is_verified };
        } else {
            return { success: false, message: 'User not found' };
        }
    } catch (error) {
        console.log(error.message);
        return { success: false, message: 'Internal Server Error' };
    }
};



module.exports ={
    loadLogin,
    veryfyLogin,
    adminLogout,
    loadDashboard,
    reportDetails,
    loadUsers,
    toggleUserStatus,
    loadtoggleUserStatus,

}