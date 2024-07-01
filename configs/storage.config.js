const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

class S3Storage {
  constructor() {
    this.s3Client = null;
  }

  getS3Client() {
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        region: process.env.AWS_S3_REGION,
        credentials: {
          accessKeyId: process.env.AWS_S3_ACCESS_KEY,
          secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
        }
      });
    }
    return this.s3Client;
  }

  getBucketName() {
    return process.env.AWS_S3_BUCKET_NAME;
  }
}

module.exports = new S3Storage();
