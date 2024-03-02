
const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    offername : {
        type : String,
        required : true
    },
    startingDate : {
        type : Date,
        required : true
    },

    expiryDate : {
        type : Date,
        required : true
    },

    percentage : {
        type : Number,
        required : true
    },
    is_active:{
        type:String,
        default:1
    },
   
})

module.exports = mongoose.model('Offer',offerSchema)

