import multer from 'multer';

// Use memory storage so image buffer can be converted to persistent data URI or uploaded to cloud
const storage = multer.memoryStorage();

export const uploadLogo = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max for logo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPEG, SVG, WebP) are allowed.'));
    }
  },
});

export async function processSponsorLogo(
  file?: Express.Multer.File,
  directUrl?: string
): Promise<string | null> {
  if (directUrl && directUrl.trim().length > 0) {
    return directUrl.trim();
  }

  if (file) {
    // Convert to base64 Data-URI for guaranteed persistence in PostgreSQL db.Text column
    // This avoids ephemeral container disk wipeouts on Render/Railway/Fly.io
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
  }

  return null;
}
