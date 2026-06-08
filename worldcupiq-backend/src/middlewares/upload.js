const multer = require('multer');
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

const memStorage = multer.memoryStorage();

function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

function makeUploadMiddleware(multerMiddleware, cloudinaryOptions) {
  return [
    multerMiddleware,
    async (req, res, next) => {
      if (!req.file) return next();
      try {
        const result = await uploadToCloudinary(req.file.buffer, cloudinaryOptions(req));
        req.file.path = result.secure_url;
        req.file.filename = result.public_id;
        next();
      } catch (err) {
        next(err);
      }
    },
  ];
}

const uploadAvatar = makeUploadMiddleware(
  multer({ storage: memStorage, limits: { fileSize: 5 * 1024 * 1024 } }).single('avatar'),
  (req) => ({
    folder: 'worldcupiq/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    public_id: `avatar_${req.user._id}_${Date.now()}`,
  })
);

const uploadQuestionImage = makeUploadMiddleware(
  multer({ storage: memStorage, limits: { fileSize: 10 * 1024 * 1024 } }).single('image'),
  () => ({
    folder: 'worldcupiq/questions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, quality: 'auto' }],
    public_id: `question_${Date.now()}`,
  })
);

module.exports = { uploadAvatar, uploadQuestionImage };
