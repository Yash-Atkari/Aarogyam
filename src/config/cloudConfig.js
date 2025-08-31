const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({ // To connect backend with cloudinary account which store our documents
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aarogyam_DEV',
    resource_type: 'raw',
    allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
    public_id: (req, file) => {
      // This will save the file with its original name (without extension) appended with the extension.
      const nameWithoutExt = file.originalname.split('.')[0];
      const ext = file.originalname.split('.').pop();
      return `${nameWithoutExt}.${ext}`;
    },
  },
});

module.exports = {
  cloudinary,
  storage
}
