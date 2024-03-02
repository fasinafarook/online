const mongoose = require('mongoose');
const { Schema } = mongoose;

const categorySchema = new mongoose.Schema({
    name: {
         type: String,
          required: true
         },
    image:{
        type: String, 
         required: true 
        },     

    is_active:{
        type:Number,
        default:1
        },
    offer: {
        type: Schema.Types.ObjectId,
        ref: 'Offer', 
        },
});


module.exports =  mongoose.model('Category', categorySchema);
