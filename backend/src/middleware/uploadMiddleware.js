import multer from 'multer';

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

export const gymLogoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Logo must be a PNG, JPG, JPEG, or WEBP image');
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  }
});
