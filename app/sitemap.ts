/* eslint-disable @typescript-eslint/no-unused-vars */
import { MetadataRoute } from 'next'
import { connectToDatabase } from './lib/mongodb'
import Crop from './model/crops'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Ensure DB connection is established
    await connectToDatabase()
    
    // Add timeout options to the find query
    const crops = await Crop.find({}).maxTimeMS(15000).exec()
    
    const cropUrls = crops.map((crop) => ({
      url: `https://edenapp.site/crops-Library/${crop._id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [
      {
        url: 'https://edenapp.site',
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: 'https://edenapp.site/crops-Library',
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
      ...cropUrls,
    ]
  } catch (error) {
    // Fallback sitemap in case of database errors
    return [
      {
        url: 'https://edenapp.site',
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: 'https://edenapp.site/crops-Library',
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }
    ]
  }
}
