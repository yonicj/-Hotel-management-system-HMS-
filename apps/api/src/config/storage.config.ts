export const storageConfig = () => ({
  endpoint: process.env.S3_ENDPOINT,
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
  bucket: process.env.S3_BUCKET || 'hms-attachments',
});
