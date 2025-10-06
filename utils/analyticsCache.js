// utils/analyticsCache.js

const CACHE_KEY = 'analytics_cache_xml';

/**
 * Convert analytics data to XML format
 */
export function dataToXML(data) {
  const { scannedLocation, zoom, timestamp, populationText, weatherText, soilText } = data;
  return `<?xml version="1.0" encoding="UTF-8"?>
<analytics>
  <timestamp>${timestamp || new Date().toISOString()}</timestamp>
  <location>
    <latitude>${scannedLocation?.lat || ''}</latitude>
    <longitude>${scannedLocation?.lng || ''}</longitude>
  </location>
  <populationText><![CDATA[${populationText || ''}]]></populationText>
  <weatherText><![CDATA[${weatherText || ''}]]></weatherText>
  <soilText><![CDATA[${soilText || ''}]]></soilText>
  <pageHtml><![CDATA[${data.pageHtml || ''}]]></pageHtml>
  <zoom>${zoom || 13}</zoom>
</analytics>`;
}

/**
 * Parse XML string back to data object
 */
export function xmlToData(xmlString) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
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
    const xmlString = dataToXML(data);
    localStorage.setItem(CACHE_KEY, xmlString);
    return true;
  } catch (error) {
    console.error('Error saving analytics cache:', error);
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