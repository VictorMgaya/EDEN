import { MetadataRoute } from 'next'
import { connectToDatabase } from './lib/mongodb'
import Crop from './model/crops'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectToDatabase()
  const crops = await Crop.find({})
  
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
}