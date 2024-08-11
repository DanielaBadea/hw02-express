const path = require('path');
const multer = require('multer');

const tmpDir = path.join(process.cwd(), 'tmp');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
//   limits: {
//     fileSize: 1048576, 
//   },
});

module.exports = upload;
