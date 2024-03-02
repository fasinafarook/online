const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required:true,
       
        
     },
     product:[
        {
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'product',
            required:true
        },
        addedDate:{
            type:Date,
            default:()=> Date.now()
        }
        
    }

    ],
    addedDate:{
        type:Date,
        default:()=> Date.now()
    }
});

module.exports = mongoose.model('Wishlist', WishlistSchema);
