import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
const cloudinaryConfig = {
    cloud_name: process.env['CLOUDINARY_CLOUD_NAME'] || '',
    api_key: process.env['CLOUDINARY_API_KEY'] || '',
    api_secret: process.env['CLOUDINARY_API_SECRET'] || '',
};

console.log('--- CLOUDINARY CONFIG CHECK ---');
console.log('Cloud Name:', cloudinaryConfig.cloud_name || 'MISSING');
console.log('API Key:', cloudinaryConfig.api_key ? 'EXISTS' : 'MISSING');
console.log('API Secret:', cloudinaryConfig.api_secret ? 'EXISTS' : 'MISSING');
console.log('-------------------------------');

cloudinary.config(cloudinaryConfig);

/**
 * Cloudinary Storage Configuration
 */
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine folder path based on organization
        const organizationId = req.user?.organizationId || 'default';
        const folder = `nexushrms/${organizationId}/documents`;

        return {
            folder: folder,
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
            resource_type: 'auto', // Support all file types
        };
    },
});

/**
 * Multer File Upload Middleware
 */
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

export { cloudinary };
