const multer = require('multer');
const multerS3 = require('multer-s3');
const s3Client = require('../configs/storage.config');
const httpError = require('http-errors');

const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const storage = multerS3({
  s3: s3Client.getS3Client(),
  bucket: s3Client.getBucketName(),
  key: (req, file, callback) => {
    const user = req?.user ?? null;
    const key = `${user ? user.id+'/' : ''}${file.originalname}`;
    callback(null, key);
  },
});

const imageUploadHandler = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    if (ACCEPTED_FILE_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      const acceptTypes = ACCEPTED_FILE_TYPES.join(', ');
      callback(
        httpError.NotAcceptable(`Invalid file type, only ${acceptTypes} is allowed!`),
        false
      );
    }
  },
});

module.exports = imageUploadHandler;
