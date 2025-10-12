const CACHE_KEY = 'analytics_cache_xml';

/**
 * Extract structured analytics data from HTML elements
 */
function extractAnalyticsDataFromHTML(htmlString) {
  try {
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Extract location details
    const locationDetails = {};
    const locationElement = doc.querySelector('[data-location-details]');
    if (locationElement) {
      const locationText = locationElement.textContent || '';
      const latMatch = locationText.match(/latitude[:\s]*(-?\d+\.?\d*)/i);
      const lngMatch = locationText.match(/longitude[:\s]*(-?\d+\.?\d*)/i);
      const elevationMatch = locationText.match(/elevation[:\s]*(\d+(?:\.\d+)?)\s*(meter|m|feet|ft)?/i);

      locationDetails.latitude = latMatch ? parseFloat(latMatch[1]) : null;
      locationDetails.longitude = lngMatch ? parseFloat(lngMatch[1]) : null;
      locationDetails.elevation = elevationMatch ? `${elevationMatch[1]} ${elevationMatch[2] || 'm'}` : null;
      locationDetails.fullText = locationText;
    }

    // Extract weather data
    const weatherData = {};
    const forecastItems = doc.querySelectorAll('.grid.sm\\:grid-cols-3.md\\:grid-cols-7') || doc.querySelectorAll('[data-weather], .weather-container, [class*="weather"]');
    forecastItems.forEach(el => {
      const text = el.textContent || '';

      // Extract temperatures from weekly forecast
      const tempMatch = text.match(/(\d+)\s*°C/g);
      if (tempMatch) {
        const temperatures = tempMatch.map(match => parseInt(match));
        weatherData.temperatureRange = temperatures.length > 0 ?
          `${Math.min(...temperatures)}-${Math.max(...temperatures)}°C` : null;
        weatherData.averageTemperature = temperatures.length > 0 ?
          `${Math.round(temperatures.reduce((a,b) => a+b, 0) / temperatures.length)}°C` : null;
      }

      // Extract humidity values
      const humidityMatch = text.match(/Humidity:\s*(\d+)%/g);
      if (humidityMatch) {
        const humidities = humidityMatch.map(match => parseInt(match.replace('Humidity: ','').replace('%','')));
        weatherData.humidityRange = humidities.length > 0 ?
          `${Math.min(...humidities)}-${Math.max(...humidities)}%` : null;
      }

      // Extract wind speeds
      const windMatch = text.match(/Wind:\s*(\d+)\s*m\/s/g);
      if (windMatch) {
        const winds = windMatch.map(match => parseInt(match.replace('Wind: ','').replace(' m/s','')));
        weatherData.windSpeedRange = winds.length > 0 ?
          `${Math.min(...winds)}-${Math.max(...winds)} m/s` : null;
      }

      // Extract weather descriptions
      const descMatch = text.match(/([A-Za-z\s]+(?:[Rr]ain|[Ss]unny|[Cc]loudy|[Cc]lear|[Ww]indy|[Tt]hunder|[Ss]now|[Ff]og|[Mm]ist))/g);
      if (descMatch) {
        weatherData.weatherConditions = [...new Set(descMatch)].join(', ');
      }

      weatherData.fullText = (weatherData.fullText || '') + text + ' ';
    });

    // Extract soil data
    const soilData = {};
    const soilElements = doc.querySelectorAll('[data-soil], .soil-container, [class*="soil"]');
    soilElements.forEach(el => {
      const text = el.textContent || '';
      if (text.includes('pH')) {
        soilData.ph = text.match(/pH[:\s]*(\d+(?:\.\d+)?)/i)?.[1];
      }
      if (text.includes('class') || text.includes('type')) {
        soilData.classification = text.match(/(?:soil\s*)?(class|type)[:\s]*([^\n,.]+)/i)?.[2]?.trim();
      }
      if (text.includes('mineral') || text.includes('composition')) {
        soilData.minerals = text.match(/(mineral|composition)[:\s]*([^\n,.]+)/i)?.[2]?.trim();
      }
      if (text.includes('fertility') || text.includes('suitability')) {
        soilData.fertilityRating = text.match(/(fertility|suitability)[:\s]*([^\n,.]+)/i)?.[2]?.trim();
      }
      if (text.includes('water retention')) {
        soilData.waterRetention = text.match(/water\s*retention[:\s]*([^\n,.]+)/i)?.[1]?.trim();
      }
      soilData.fullText = (soilData.fullText || '') + text + ' ';
    });

    // Extract population data
    const populationData = {};
    const populationElement = doc.querySelector('[data-population], .population-container');
    if (populationElement) {
      const text = populationElement.textContent || '';
      const populationMatch = text.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*(?:people|inhabitants|residents)?/i);
      populationData.population = populationMatch ? populationMatch[1] : null;
      populationData.density = text.match(/(\d+(?:\.\d+)?)\s*per\s*(sq\s*km|km²|square\s*kilometer)/i)?.[1];
      populationData.fullText = text;
    }

    // Extract all text content from major sections for comprehensive analysis
    const sections = {
      locationDetails,
      weatherData,
      soilData,
      populationData
    };

    // Also capture broad text patterns from the entire page
    const bodyText = doc.body?.textContent || '';
    sections.fullPageText = bodyText;

    // Extract any charts/visual data (this would be specific to your chart components)
    const charts = Array.from(doc.querySelectorAll('canvas, svg, [data-chart]')).map(el => ({
      type: el.tagName.toLowerCase(),
      data: el.getAttribute('data-chart') || 'chart data'
    }));
    sections.charts = charts;

    return sections;

  } catch (error) {
    console.error('Error extracting analytics data from HTML:', error);
    return { error: 'Failed to parse analytics data', rawHtml: htmlString };
  }
}

/**
 * Convert analytics data to structured XML format optimized for AI comprehension
 */
export function dataToXML(data) {
  const { scannedLocation, zoom, timestamp, pageHtml } = data;

  // Extract structured data from the HTML
  const structuredData = extractAnalyticsDataFromHTML(pageHtml || '');

  return `<?xml version="1.0" encoding="UTF-8"?>
<comprehensive-resource-analysis>
  <metadata>
    <timestamp>${timestamp || new Date().toISOString()}</timestamp>
    <coordinates>
      <latitude>${scannedLocation?.lat || structuredData.locationDetails?.latitude || ''}</latitude>
      <longitude>${scannedLocation?.lng || structuredData.locationDetails?.longitude || ''}</longitude>
    </coordinates>
    <map-zoom>${zoom || 13}</map-zoom>
  </metadata>

  <geographic-location>
    <elevation>${structuredData.locationDetails?.elevation || 'Unknown'}</elevation>
    <terrain-type>Based on elevation and soil characteristics</terrain-type>
    <description><![CDATA[${structuredData.locationDetails?.fullText || ''}]]></description>
  </geographic-location>

  <climate-conditions>
    <temperature>
      <current>${structuredData.weatherData?.temperature || 'Not available'}°C</current>
      <seasonal-patterns>Tropical/Subtropical climate profile based on available data</seasonal-patterns>
    </temperature>
    <precipitation>
      <annual-rainfall>${structuredData.weatherData?.rainfall || 'Variable'}</annual-rainfall>
      <seasonal-distribution>Analysis based on regional climate patterns</seasonal-distribution>
    </precipitation>
    <atmospheric-conditions>
      <humidity>${structuredData.weatherData?.humidity || ''}%</humidity>
      <wind-speed>${structuredData.weatherData?.windSpeed || 'Moderate'}</wind-speed>
    </atmospheric-conditions>
    <full-description><![CDATA[${structuredData.weatherData?.fullText || ''}]]></full-description>
  </climate-conditions>

  <soil-profile>
    <classification>${structuredData.soilData?.classification || 'To be determined'}</classification>
    <chemical-properties>
      <ph-level>${structuredData.soilData?.ph || 'Unknown'}</ph-level>
      <fertility-rating>${structuredData.soilData?.fertilityRating || 'Analysis required'}</fertility-rating>
    </chemical-properties>
    <physical-properties>
      <water-retention>${structuredData.soilData?.waterRetention || 'To be assessed'}</water-retention>
      <mineral-composition>${structuredData.soilData?.minerals || 'To be analyzed'}</mineral-composition>
    </physical-properties>
    <crop-suitability>As determined by soil properties and local climate conditions</crop-suitability>
    <full-description><![CDATA[${structuredData.soilData?.fullText || ''}]]></full-description>
  </soil-profile>

  <population-demographics>
    <total-population>${structuredData.populationData?.population || 'Data collected'}</total-population>
    <population-density>${structuredData.populationData?.density || ''} per square kilometer</population-density>
    <infrastructure-implications>Labor availability, market potential, development indicators</infrastructure-implications>
    <full-description><![CDATA[${structuredData.populationData?.fullText || ''}]]></full-description>
  </population-demographics>

  <agricultural-potential>
    <crop-recommendations>
      <recommended-crops>Based on soil type, climate, and water availability</recommended-crops>
      <seasonal-planning>Growing season analysis required</seasonal-planning>
    </crop-recommendations>
    <land-use-potential>
      <arable-land-percentage>To be determined</arable-land-percentage>
      <irrigation-requirements>Based on rainfall patterns and soil retention</irrigation-requirements>
    </land-use-potential>
  </agricultural-potential>

  <economic-development>
    <resource-potential>
      <agricultural-value>Crop production potential</agricultural-value>
      <development-potential>Rural/Urban development assessment</development-potential>
    </resource-potential>
    <infrastructure-needs>Road access, electrification, water systems</infrastructure-needs>
  </economic-development>

  <raw-page-html><![CDATA[${pageHtml || ''}]]></raw-page-html>
</comprehensive-resource-analysis>`;
}

/**
 * Parse XML string back to data object (supports both old and new formats)
 */
export function xmlToData(xmlString) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check if it's the new structured format
    const isNewFormat = xmlDoc.querySelector('comprehensive-resource-analysis') !== null;

    if (isNewFormat) {
      // Parse new structured format
      const lat = parseFloat(xmlDoc.querySelector('coordinates latitude')?.textContent);
      const lng = parseFloat(xmlDoc.querySelector('coordinates longitude')?.textContent);
      const zoom = parseInt(xmlDoc.querySelector('map-zoom')?.textContent);
      const timestamp = xmlDoc.querySelector('metadata timestamp')?.textContent;

      // Extract structured data for each section
      const climateText = xmlDoc.querySelector('climate-conditions full-description')?.textContent || '';
      const soilText = xmlDoc.querySelector('soil-profile full-description')?.textContent || '';
      const populationText = xmlDoc.querySelector('population-demographics full-description')?.textContent || '';

      return {
        scannedLocation: !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null,
        zoom: !isNaN(zoom) ? zoom : 13,
        timestamp,
        populationText,
        weatherText: climateText,
        soilText,
        pageHtml: xmlDoc.querySelector('raw-page-html')?.textContent || ''
      };
    } else {
      // Parse legacy format
      const lat = parseFloat(xmlDoc.querySelector('latitude')?.textContent);
      const lng = parseFloat(xmlDoc.querySelector('longitude')?.textContent);
      const zoom = parseInt(xmlDoc.querySelector('zoom')?.textContent);
      const timestamp = xmlDoc.querySelector('timestamp')?.textContent;

      const populationText = xmlDoc.querySelector('populationText')?.textContent || '';
      const weatherText = xmlDoc.querySelector('weatherText')?.textContent || '';
      const soilText = xmlDoc.querySelector('soilText')?.textContent || '';

      return {
        scannedLocation: !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null,
        zoom: !isNaN(zoom) ? zoom : 13,
        timestamp,
        populationText,
        weatherText,
        soilText,
        pageHtml: xmlDoc.querySelector('pageHtml')?.textContent || ''
      };
    }
  } catch (error) {
    console.error('Error parsing XML:', error);
    return null;
  }
}

/**
 * Save analytics data to localStorage as XML
 */
export function saveAnalyticsCache(data) {
  try {
    console.log('📥 Starting cache save process...');
    console.log('📊 Scanned location:', data.scannedLocation);
    console.log('📏 Zoom level:', data.zoom);
    console.log('⏰ Timestamp:', data.timestamp);

    const xmlString = dataToXML(data);
    console.log('📝 XML generated, length:', xmlString.length);
    console.log('🔍 XML preview:', xmlString.substring(0, 500) + '...');

    localStorage.setItem(CACHE_KEY, xmlString);
    console.log('✅ Cache successfully saved to localStorage');

    // Verify cache was saved
    const savedData = localStorage.getItem(CACHE_KEY);
    if (savedData && savedData === xmlString) {
      console.log('🔄 Cache verification: successful');
      return true;
    } else {
      console.error('❌ Cache verification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving analytics cache:', error);
    return false;
  }
}

/**
 * Load analytics data from localStorage
 */
export function loadAnalyticsCache() {
  try {
    const xmlString = localStorage.getItem(CACHE_KEY);
    if (!xmlString) return null;
    
    return xmlToData(xmlString);
  } catch (error) {
    console.error('Error loading analytics cache:', error);
    return null;
  }
}

/**
 * Get raw XML string from cache
 */
export function getRawXMLCache() {
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch (error) {
    console.error('Error getting raw XML cache:', error);
    return null;
  }
}

/**
 * Clear analytics cache
 */
export function clearAnalyticsCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing analytics cache:', error);
    return false;
  }
}
