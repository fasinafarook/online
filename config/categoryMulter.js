const multer = require("multer");
const path = require("path");

const storages = multer.diskStorage({
  destination: (req, file, cb) => {

    cb(null, path.join(__dirname, '../public/categoryimages'));

  },
  filename: (req, file, cb) => {

    const name = Date.now() + '-' + file.originalname;
    cb(null, name);

  }
});

const uploads = multer({
  storage: storages,

});

module.exports = uploads;