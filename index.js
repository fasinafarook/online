const express = require('express');
const app = express();

require("dotenv").config();
const mongoose=require('mongoose')
mongoose.connect(process.env.MONGO_URL)

const nocache = require('nocache');
app.use(nocache());
app.use(express.urlencoded({extended:true}));

const path = require('path');

const errorHandler = require('./handler/errorHandler');


const port = process.env.PORT||1001

 app.use(express.static('public'));

 app.set('view engine', 'ejs');

console.log('hi')
//------user route----------
const userRoute=require('./routes/userRoute');
app.use('/',userRoute);

//------admin route---------
const adminRoute=require('./routes/adminRoute');
app.use('/admin',adminRoute);
app.use('*',(req,res)=>{
    res.render('admin/404page')
})

app.use(errorHandler.errorHandler);




app.listen(port,()=>console.log("server start: http://localhost:1001"));