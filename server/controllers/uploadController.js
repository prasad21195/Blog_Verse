const { cloudinaryConfigured } = require('../config/cloudinary');

// POST /api/upload (protected) -- used for cover images and avatars.
// Multer (via uploadMiddleware) has already validated type/size and
// uploaded the file before this handler runs.
const uploadImage = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Cloudinary storage engine returns req.file.path as the secure URL.
    // Local disk storage returns a relative filename we turn into a URL.
    const imageUrl = cloudinaryConfigured
      ? req.file.path
      : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { url: imageUrl },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadImage };
