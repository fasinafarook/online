const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    name: { 
        type: String, 
        required: true 
    },
    
    image:{
        type: [String], 
        required: true 
    },

    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category', 
        required: true
        },

    price: {
        type: Number,
         required: true 
        },
    Saleprice: {
        type: Number,
        required: true 
        },

    is_product:{
        type:Number,
        default:1
        },
    author:{
        type: String, 
        required: true 
    },
    discription:{
        type: String, 
        required: true 
    },
    publisher:{
        type: String, 
        required: true 
    },
    About_author:{
        type: String, 
        required: true 
    },
    language:{
        type: String, 
        required: true 
    },
    country:{
        type: String, 
        required: true 
    },
    Quantity: {
        type: Number,
         required: true 
        },
    currentDate:{
            type:Number,
            default:()=> Date.now()
        },
    item_weight:{
        type: Number, 
        required: true 
    },
    paperback:{
        type: Number, 
        required: true 
    },
    offer: {
        type: Schema.Types.ObjectId,
        ref: 'Offer', 
        },


   
});


module.exports = mongoose.model('product',productSchema);
