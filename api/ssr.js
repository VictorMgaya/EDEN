import { fetchSoilData, processSoilData, rankSoilData } from '../app/analytics/soilData';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({ 
        message: 'Longitude and latitude are required' 
      });
    }

    // Fetch soil data
    const rawSoilData = await fetchSoilData(longitude, latitude);
    
    // Process the data
    const processedData = processSoilData(rawSoilData);
    
    // Rank the data
    const rankedData = rankSoilData(processedData);

    return res.status(200).json({
      success: true,
      data: rankedData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}