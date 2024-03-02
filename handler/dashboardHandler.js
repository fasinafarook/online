const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/coupenModel");

module.exports = {
  getMonthlyUserCount: async () => {
    try {
      const userCountByMonth = await User.aggregate([
        {
          $group: {
            _id: { $month: { $toDate: "$currentDate" } },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            months: {
              $push: {
                month: "$_id",
                count: "$count",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            months: {
              $map: {
                input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                as: "month",
                in: {
                  month: "$$month",
                  count: {
                    $let: {
                      vars: {
                        matchedMonth: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$months",
                                as: "m",
                                cond: { $eq: ["$$m.month", "$$month"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: { $ifNull: ["$$matchedMonth.count", 0] },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $sort: { "months.month": 1 },
        },
        {
          $project: {
            _id: 0,
            months: 1,
          },
        },
      ]);

      return userCountByMonth[0].months;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  //   getYearlyOrderDetails: async () => {
  //     try {
  //         const orderDetailsByYear = await Order.aggregate([
  //           {
  //             $match: {
  //                 "items.status": "Delivered" 
  //             }
  //         },
  //             {

  //                 $group: {
  //                     _id: { $year: "$currentData" }, 
  //                     count: { $sum: 1 } 
  //                 }
  //             },
  //             {
  //                 $sort: { "_id": -1 } 
  //             }
  //         ]);

  //         return orderDetailsByYear;
  //     } catch (error) {
  //         console.error("Error:", error.message);
  //         throw error;
  //     }
  // }
  // getYearlyOrderDetails: async () => {
  //   try {
  //     const currentYear = new Date().getFullYear();
  //     const minYear = 2018; // Set your minimum year here

  //     // Generate range of years from minYear to currentYear
  //     const yearsRange = Array.from({ length: currentYear - minYear + 1 }, (_, index) => currentYear - index);

  //     // Retrieve order details grouped by year
  //     const orderDetailsByYear = await Order.aggregate([
  //       {
  //         $match: {
  //           "items.status": "Delivered",
  //           "currentData": { $gte: new Date(`${minYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) }
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: { $year: "$currentData" },
  //           count: { $sum: 1 }
  //         }
  //       }
  //     ]);

  //     // Fill in missing years with zero counts
  //     const yearlyData = yearsRange.map(year => {
  //       const foundYearData = orderDetailsByYear.find(data => data._id === year);
  //       return { year, count: foundYearData ? foundYearData.count : 0 };
  //     });
  //     yearlyData.sort((a, b) => a.year - b.year);

  //     return yearlyData;
  //   } catch (error) {
  //     console.error("Error:", error.message);
  //     throw error;
  //   }
  // }

  // ,
  getYearlyOrderDetails: async () => {
    try {
      const currentYear = new Date().getFullYear();
      const minYear = 2018; // Set your minimum year here

      // Generate range of years from minYear to currentYear
      const yearsRange = Array.from({ length: currentYear - minYear + 1 }, (_, index) => currentYear - index);

      // Retrieve order details grouped by year and orderId
      const orderDetailsByYear = await Order.aggregate([
        {
          $match: {
            "items.status": "Delivered",
            "currentData": { $gte: new Date(`${minYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) }
          }
        },
        {
          $unwind: "$items" // Unwind the items array to treat each product separately
        },
        {
          $match: {
            "items.status": "Delivered" // Filter only delivered items
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$currentData" },
              orderId: "$orderId" // Group by order ID
            },
            count: { $sum: 1 } // Count each product in the order
          }
        },
        {
          $group: {
            _id: "$_id.year",
            counts: {
              $push: "$count" // Push the count for each order ID within each year
            }
          }
        },
        {
          $project: {
            _id: 1,
            year: "$_id",
            count: { $sum: "$counts" } // Sum the counts for each year
          }
        }
      ]);

      // Fill in missing years with zero counts
      const yearlyData = yearsRange.map(year => {
        const foundYearData = orderDetailsByYear.find(data => data.year === year);
        return { year, count: foundYearData ? foundYearData.count : 0 };
      });
      yearlyData.sort((a, b) => a.year - b.year);

      return yearlyData;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  }
  ,
  // getMonthlyOrderDetails: async () => {
  //   try {
  //     const orderDetailsByMonth = await Order.aggregate([
  //       {
  //         $match: {
  //             "items.status": "Delivered" // Filter orders with items that are delivered
  //         }
  //     },
  //       {
  //         $group: {
  //           _id: {
  //             $month: "$currentData",
  //           },
  //           count: { $sum: 1 },
  //         },
  //       },
  //       {
  //         $sort: { _id: 1 },
  //       },
  //       {
  //         $group: {
  //           _id: null,
  //           months: {
  //             $push: {
  //               month: "$_id",
  //               count: "$count",
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $project: {
  //           _id: 0,
  //           months: {
  //             $map: {
  //               input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  //               as: "month",
  //               in: {
  //                 month: "$$month",
  //                 count: {
  //                   $let: {
  //                     vars: {
  //                       matchedMonth: {
  //                         $arrayElemAt: [
  //                           {
  //                             $filter: {
  //                               input: "$months",
  //                               as: "m",
  //                               cond: { $eq: ["$$m.month", "$$month"] },
  //                             },
  //                           },
  //                           0,
  //                         ],
  //                       },
  //                     },
  //                     in: { $ifNull: ["$$matchedMonth.count", 0] },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $unwind: "$months",
  //       },
  //       {
  //         $replaceRoot: { newRoot: "$months" },
  //       },
  //       {
  //         $sort: { month: 1 },
  //       },
  //     ]);

  //     return orderDetailsByMonth;
  //   } catch (error) {
  //     console.error("Error:", error.message);
  //     throw error;
  //   }
  // },

  getMonthlyOrderDetails: async () => {
    try {
      const orderDetailsByMonth = await Order.aggregate([
        {
          $match: {
            "items.status": "Delivered" // Filter orders with items that are delivered
          }
        },
        {
          $unwind: "$items" // Unwind the items array to treat each product separately
        },
        {
          $match: {
            "items.status": "Delivered" // Filter only delivered items
          }
        },
        {
          $group: {
            _id: {
              month: { $month: "$currentData" },
              orderId: "$orderId" // Group by order ID
            },
            count: { $sum: 1 } // Count each delivered product in the order
          }
        },
        {
          $group: {
            _id: "$_id.month",
            counts: {
              $push: "$count" // Push the count for each order ID within each month
            }
          }
        },
        {
          $project: {
            _id: 1,
            month: "$_id",
            count: { $sum: "$counts" } // Sum the counts for each month
          }
        },
        {
          $sort: { month: 1 }
        }
      ]);

      // Fill in missing months with zero counts
      const result = [];
      let currentIndex = 0;
      for (let i = 1; i <= 12; i++) {
        const currentMonthData = orderDetailsByMonth[currentIndex];
        if (currentMonthData && currentMonthData.month === i) {
          result.push(currentMonthData);
          currentIndex++;
        } else {
          result.push({ month: i, count: 0 });
        }
      }

      return result;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  // getDeliveredOrderCount: async () => {
  //     try {
  //         const deliveredOrderCount = await Order.countDocuments({ "items.status": "Delivered" });
  //         return deliveredOrderCount;
  //     } catch (error) {
  //         console.error("Error:", error.message);
  //         throw error;
  //     }
  // },
  // getCancelledOrderCount: async () => {
  //   try {
  //       const getCancelledOrderCount = await Order.countDocuments({ "items.status": "Cancelled" });
  //       return getCancelledOrderCount;
  //   } catch (error) {
  //       console.error("Error:", error.message);
  //       throw error;
  //   }
  // },
  // getReturnOrderCount: async () => {
  //   try {
  //       const getReturnOrderCount = await Order.countDocuments({ "items.status": "Returned" });
  //       return getReturnOrderCount;
  //   } catch (error) {
  //       console.error("Error:", error.message);
  //       throw error;
  //   }
  // },
  // getPendingOrderCount: async () => {
  //   try {
  //       const getPendingOrderCount = await Order.countDocuments({ "items.status": "Processing" });
  //       return getPendingOrderCount;
  //   } catch (error) {
  //       console.error("Error:", error.message);
  //       throw error;
  //   }
  // },
  // getPlaceCount: async () => {
  //   try {
  //       const getPlaceCount = await Order.countDocuments({ "items.status": "Order Placed" });
  //       return getPlaceCount;
  //   } catch (error) {
  //       console.error("Error:", error.message);
  //       throw error;
  //   }
  // },
  getOrderStatusPercentages: async () => {
    try {
      const statusCounts = {
        Processing: 0,
        Cancelled: 0,
        Delivered: 0,
        Return: 0,
        "Order Placed": 0,
      };

      const orderStatuses = await Order.aggregate([
        {
          $group: {
            _id: "$items.status",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            count: 1,
          },
        },
      ]);

      orderStatuses.forEach((status) => {
        statusCounts[status.status] = status.count;
      });

      const totalOrders = Object.values(statusCounts).reduce(
        (acc, curr) => acc + curr,
        0
      );
      const statusPercentages = Object.keys(statusCounts).map((status) => {
        const percentage =
          totalOrders > 0 ? (statusCounts[status] / totalOrders) * 100 : 0;
        return { status, percentage };
      });

      return statusPercentages;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  calculateDeliveredRevenue: async () => {
    try {
      const totalDeliveredRevenue = await Order.aggregate([
        {
          $match: { "items.status": "Delivered" },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]);

      if (totalDeliveredRevenue.length > 0) {
        const deliveredRevenue = totalDeliveredRevenue[0].totalAmount;
        return deliveredRevenue;
      }

      return 0;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  getCurrentMonthRevenue: async () => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;

      const currentMonthRevenue = await Order.aggregate([
        {
          $match: {
            "items.status": "Delivered",
            currentData: {
              $gte: new Date(currentDate.getFullYear(), currentMonth - 1, 1),
              $lt: new Date(currentDate.getFullYear(), currentMonth, 0),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]);

      if (currentMonthRevenue.length > 0) {
        return currentMonthRevenue[0].totalAmount;
      } else {
        return 0;
      }
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },
  // calculateDeliveredRevenue: async () => {
  //   try {
  //     const totalDeliveredRevenue = await Order.aggregate([
  //       {
  //         $match: { "items.status": "Delivered" },
  //       },
  //       {
  //         $unwind: "$items",
  //       },
  //       {
  //         $lookup: {
  //           from: "products",
  //           localField: "items.productId",
  //           foreignField: "_id",
  //           as: "product",
  //         },
  //       },
  //       {
  //         $unwind: "$product",
  //       },
  //       {
  //         $lookup: {
  //           from: "categories",
  //           localField: "product.category",
  //           foreignField: "_id",
  //           as: "category",
  //         },
  //       },
  //       {
  //         $unwind: "$category",
  //       },
  //       {
  //         $lookup: {
  //           from: "offers",
  //           let: { productId: "$product._id", categoryId: "$category._id" },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: {
  //                   $and: [
  //                     { $or: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$category", "$$categoryId"] }] },
  //                     { $lte: ["$startingDate", new Date()] },
  //                     { $gte: ["$expiryDate", new Date()] },
  //                     { $eq: ["$is_active", "1"] }
  //                   ]
  //                 }
  //               }
  //             },
  //             {
  //               $sort: { percentage: -1 }
  //             },
  //             {
  //               $limit: 1
  //             }
  //           ],
  //           as: "offer",
  //         },
  //       },
  //       {
  //         $addFields: {
  //           offer: { $arrayElemAt: ["$offer", 0] }
  //         }
  //       },
  //       {
  //         $project: {
  //           totalPrice: {
  //             $cond: [
  //               {
  //                 $or: [
  //                   { $eq: ["$offer", null] },
  //                   { $lte: ["$offer.percentage", 0] }
  //                 ]
  //               },
  //               "$product.price",
  //               {
  //                 $cond: [
  //                   { $gte: ["$product.offerPrice", "$offer.percentage"] },
  //                   "$product.offerPrice",
  //                   "$offer.percentage"
  //                 ]
  //               }
  //             ]
  //           }
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: null,
  //           totalAmount: { $sum: "$totalPrice" },
  //         },
  //       },
  //     ]);

  //     if (totalDeliveredRevenue.length > 0) {
  //       return totalDeliveredRevenue[0].totalAmount;
  //     }

  //     return 0;
  //   } catch (error) {
  //     console.error("Error:", error.message);
  //     throw error;
  //   }
  // },

  // getCurrentMonthRevenue: async () => {
  //   try {
  //     const currentDate = new Date();
  //     const currentMonth = currentDate.getMonth() + 1;

  //     const currentMonthRevenue = await Order.aggregate([
  //       {
  //         $match: {
  //           "items.status": "Delivered",
  //           currentData: {
  //             $gte: new Date(currentDate.getFullYear(), currentMonth - 1, 1),
  //             $lt: new Date(currentDate.getFullYear(), currentMonth, 0),
  //           },
  //         },
  //       },
  //       {
  //         $unwind: "$items",
  //       },
  //       {
  //         $lookup: {
  //           from: "products",
  //           localField: "items.productId",
  //           foreignField: "_id",
  //           as: "product",
  //         },
  //       },
  //       {
  //         $unwind: "$product",
  //       },
  //       {
  //         $lookup: {
  //           from: "categories",
  //           localField: "product.category",
  //           foreignField: "_id",
  //           as: "category",
  //         },
  //       },
  //       {
  //         $unwind: "$category",
  //       },
  //       {
  //         $lookup: {
  //           from: "offers",
  //           let: { productId: "$product._id", categoryId: "$category._id" },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: {
  //                   $and: [
  //                     { $or: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$category", "$$categoryId"] }] },
  //                     { $lte: ["$startingDate", new Date()] },
  //                     { $gte: ["$expiryDate", new Date()] },
  //                     { $eq: ["$is_active", "1"] }
  //                   ]
  //                 }
  //               }
  //             },
  //             {
  //               $sort: { percentage: -1 }
  //             },
  //             {
  //               $limit: 1
  //             }
  //           ],
  //           as: "offer",
  //         },
  //       },
  //       {
  //         $addFields: {
  //           offer: { $arrayElemAt: ["$offer", 0] }
  //         }
  //       },
  //       {
  //         $project: {
  //           totalPrice: {
  //             $cond: [
  //               {
  //                 $or: [
  //                   { $eq: ["$offer", null] },
  //                   { $lte: ["$offer.percentage", 0] }
  //                 ]
  //               },
  //               "$product.price",
  //               {
  //                 $cond: [
  //                   { $gte: ["$product.offerPrice", "$offer.percentage"] },
  //                   "$product.offerPrice",
  //                   "$offer.percentage"
  //                 ]
  //               }
  //             ]
  //           }
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: null,
  //           totalAmount: { $sum: "$totalPrice" },
  //         },
  //       },
  //     ]);

  //     if (currentMonthRevenue.length > 0) {
  //       return currentMonthRevenue[0].totalAmount;
  //     } else {
  //       return 0;
  //     }
  //   } catch (error) {
  //     console.error("Error:", error.message);
  //     throw error;
  //   }
  // },

  //   getOrderStatusPercentages: async () => {
  //     try {
  //         const orderStatuses = await Order.aggregate([
  //             {
  //                 $unwind: "$items" // Unwind the items array
  //             },
  //             {
  //                 $group: {
  //                     _id: "$items.status", // Group by status
  //                     count: { $sum: 1 } // Count the occurrences of each status
  //                 }
  //             },
  //             {
  //                 $project: {
  //                     _id: 0,
  //                     status: "$_id",
  //                     count: 1
  //                 }
  //             },
  //             {
  //                 $group: {
  //                     _id: null,
  //                     statuses: {
  //                         $push: "$$ROOT" // Push each status count into an array
  //                     },
  //                     totalOrders: { $sum: "$count" } // Calculate the total number of orders
  //                 }
  //             },
  //             {
  //                 $project: {
  //                     _id: 0,
  //                     statusPercentages: {
  //                         $map: {
  //                             input: "$statuses",
  //                             as: "status",
  //                             in: {
  //                                 status: "$$status.status",
  //                                 percentage: { $multiply: [{ $divide: ["$$status.count", "$totalOrders"] }, 100] }
  //                             }
  //                         }
  //                     }
  //                 }
  //             }
  //         ]);

  //         return orderStatuses.length > 0 ? orderStatuses[0].statusPercentages : [];
  //     } catch (error) {
  //         console.error("Error:", error.message);
  //         throw error;
  //     }
  // }
  getOrderStatusPercentages: async () => {
    try {
      const orderStatuses = await Order.aggregate([
        {
          $unwind: "$items" // Unwind the items array
        },
        {
          $match: {
            "items.status": { $exists: true, $ne: null } // Filter out null or undefined statuses
          }
        },
        {
          $group: {
            _id: "$items.status", // Group by status
            count: { $sum: 1 } // Count the occurrences of each status
          }
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            count: 1
          }
        },
        {
          $group: {
            _id: null,
            statuses: {
              $push: "$$ROOT" // Push each status count into an array
            },
            totalOrders: { $sum: "$count" } // Calculate the total number of orders
          }
        },
        {
          $project: {
            _id: 0,
            statusPercentages: {
              $map: {
                input: "$statuses",
                as: "status",
                in: {
                  status: "$$status.status",
                  percentage: { $multiply: [{ $divide: ["$$status.count", "$totalOrders"] }, 100] }
                }
              }
            }
          }
        }
      ]);

      return orderStatuses.length > 0 ? orderStatuses[0].statusPercentages : [];
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  getTopSellingProducts: async () => {
    try {
      // Aggregate query to get the top selling products
      const topSellingProducts = await Order.aggregate([
        { $unwind: "$items" },
        { $match: { "items.status": "Delivered" } },
        {
          $group: {
            _id: "$items.productId",
            totalQuantity: { $sum: { $toInt: "$items.quantity" } },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }, // Limit to top 5 products
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            totalQuantity: 1,
            productName: { $arrayElemAt: ["$product.name", 0] },
          },
        },
      ]);

      return topSellingProducts;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  getTopSellingCategories: async () => {
    try {
      // Aggregate query to get the top selling categories
      const topSellingCategories = await Order.aggregate([
        { $unwind: "$items" },
        { $match: { "items.status": "Delivered" } },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $unwind: "$product",
        },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: "$category",
        },
        {
          $group: {
            _id: "$category._id",
            categoryName: { $first: "$category.name" },
            totalQuantity: { $sum: { $toInt: "$items.quantity" } },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 4 }, // Limit to top 3 categories
        {
          $project: {
            _id: 0,
            categoryId: "$_id",
            categoryName: 1,
            totalQuantity: 1,
          },
        },
      ]);

      return topSellingCategories;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },
  getTopSellingBrands: async () => {
    try {
      // Aggregate query to get the top selling brands
      const topSellingBrands = await Order.aggregate([
        { $unwind: "$items" },
        { $match: { "items.status": "Delivered" } },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.publisher",
            totalQuantity: { $sum: { $toInt: "$items.quantity" } },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 3 }, // Limit to top 3 brands
      ]);

      return topSellingBrands;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  },
};

