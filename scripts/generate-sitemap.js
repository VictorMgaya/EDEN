import dotenv from 'dotenv';
import { SitemapStream, streamToPromise } from 'sitemap';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });


const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is not set.');
    process.exit(1);
}

// MongoDB Connection Function
async function dbConnect() {
    if (mongoose.connection.readyState >= 1) return;
    return mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
}

// Define the Crop Schema and Model
const CropSchema = new mongoose.Schema({
    name: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
});
const Crop = mongoose.models.Crop || mongoose.model('Crop', CropSchema);

// Sitemap Generation Function
async function generateSitemap() {
    await dbConnect();

    const hostname = 'https://yourdomain.com'; // Replace with your domain
    const crops = await Crop.find({}, { slug: 1 }).lean();

    const sitemapStream = new SitemapStream({ hostname });

    // Add static pages
    sitemapStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    sitemapStream.write({ url: '/about', changefreq: 'monthly', priority: 0.8 });

    // Add dynamic crop pages
    crops.forEach((crop) => {
        sitemapStream.write({
            url: `/crops/${crop.slug}`,
            changefreq: 'weekly',
            priority: 0.9,
        });
    });

    sitemapStream.end();

    const sitemap = await streamToPromise(sitemapStream).then((data) => data.toString());

    // Save sitemap to the public directory
    const filePath = path.join('../EDEN/sitemap.xml');
    fs.writeFileSync(filePath, sitemap);
    console.log(`Sitemap generated successfully at ${filePath}`);

    // Close the database connection
    await mongoose.connection.close();
}

// Run the script
generateSitemap().catch((error) => {
    console.error('Error generating sitemap:', error);
    process.exit(1);
});
