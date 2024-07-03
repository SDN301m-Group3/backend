const multer = require('multer');
const multerS3 = require('multer-s3');
const s3Client = require('../configs/storage.config');
const httpError = require('http-errors');
const { v4: uuidv4 } = require('uuid');

const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_PHOTO_SIZE = +process.env.MAX_PHOTO_SIZE || 10 * 1024 * 1024;

const storage = multerS3({
    s3: s3Client.getS3Client(),
    bucket: s3Client.getBucketName(),
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, callback) => {
        const user = req?.payload ?? null;
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        const fileExtension = file.originalname.split('.').pop();
        const key = `${user ? user.aud + '/' : ''}${file.originalname.split('.')[0]}-${uniqueSuffix}.${fileExtension}`;
        callback(null, key);
    },
});

const imageUploadHandler = multer({
    storage: storage,
    limits: { fileSize: MAX_PHOTO_SIZE },
    fileFilter: (req, file, callback) => {
        console.log(file.size, file.mimetype);
        if (ACCEPTED_FILE_TYPES.includes(file.mimetype)) {
            callback(null, true);
        } else {
            const acceptTypes = ACCEPTED_FILE_TYPES.join(', ');
            callback(
                httpError.NotAcceptable(
                    `Invalid file type, only ${acceptTypes} is allowed!`
                ),
                false
            );
        }
    },
});

module.exports = imageUploadHandler;
