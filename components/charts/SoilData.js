// SoilData.js

export const fetchSoilData = async (longitude, latitude) => {
  try {
    console.log("Fetching data for lon:", longitude, "lat:", latitude); // Debugging the coordinates
    const response = await fetch(
      `https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${longitude}&lat=${latitude}&number_classes=5`
    );
    console.log("API Response:", response); // Check the response status

    if (!response.ok) {
      throw new Error("Failed to fetch soil data");
    }

    const data = await response.json();
    console.log("Fetched Data:", data); // Check the structure of the returned data

    // Ensure the data has the expected structure and handle null values
    if (data && data.wrb_class_probability) {
      const filteredData = data.wrb_class_probability
        .map(([className, value]) => ({
          soilClass: className,
          probability: value || 0, // Replace null with 0 (or any default value)
        }))
        .filter(item => item.probability !== 0); // Remove any soil classes with 0 probability

      // Highlight the top soil class (first one in the list)
      if (filteredData.length > 0) {
        filteredData[0].highlight = true; // Mark the top class for highlighting
      }

      console.log("Filtered Data:", filteredData); // Debugging formatted data
      return filteredData;
    } else {
      throw new Error("No soil class data available");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
