const mongoose = require('mongoose');
const addressSchema = mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    City: { type: String, required: true },
    District: { type: String, required: true },
    State: { type: String, required: true },
    Pincode: { type: Number, required: true },
});
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    is_admin: {
        type: Number,
        required: true
    },
    is_verified: {
        type: Number,
        default: 1
    },
    wallet: {
        type: Number,
        require: true
    },
    address: [addressSchema],
    referralCode: {
        type: String
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    currentDate: {
        type: Number,
        default: () => Date.now()
    }

});

module.exports = mongoose.model('User', userSchema);
