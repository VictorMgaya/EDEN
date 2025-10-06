import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not set in environment variables.');
}

async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

// Define the Crop schema
const Expertschema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
});
const Crop = mongoose.models.Crop || mongoose.model('Crop', Expertschema);

export async function GET() {
  await dbConnect();

  const hostname = 'https://edenapp.site'; // Replace with your domain
  const Experts = await Crop.find({}, { slug: 1 }).lean();

  // Construct sitemap XML
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages
  sitemap += `
  <url>
    <loc>${hostname}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

   <url>
    <loc>${hostname}/analytics/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

   <url>
    <loc>${hostname}/auth</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

   <url>
    <loc>${hostname}/Experts</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>${hostname}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

  // Add dynamic crop pages
  Experts.forEach((crop) => {
    sitemap += `
  <url>
    <loc>${hostname}/Experts/${crop._id}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  sitemap += '</urlset>';

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
