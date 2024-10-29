const aws = require('aws-sdk');
const multer = require('multer');
const mutlerS3 = require('multer-s3');
const { config } = require('dotenv');

config();

const s3 = new aws.S3({
    region: 'us-west-1',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    signatureVersion: process.env.SIGNATURE_VERSION,
});

const upload = multer({
    storage: mutlerS3({
        s3: s3,
        bucket: 'personal-finance-app',
        key: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    })
});

module.exports = upload;
