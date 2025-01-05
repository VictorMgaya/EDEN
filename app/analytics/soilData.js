// Function to fetch soil data based on coordinates
async function fetchSoilData(lon, lat) {
    const response = await fetch(`https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${lon}&lat=${lat}&number_classes=10`);
    const data = await response.json();
    console.log("Fetched data:", data); // Add this line to inspect the data structure
    // Adjust the return statement based on the actual response structure
    if (data && data.wrb_class_probability) {
        return data.wrb_class_probability;
    } else {
        throw new Error("Invalid data structure");
    }
}

// Function to process soil data into chart data format
function processSoilData(data) {
    if (!Array.isArray(data)) {
        console.error("Data is not an array:", data);
        throw new Error("Invalid data format");
    }
    console.log("Processing data:", data); // Add this line to inspect the data structure before processing
    return data.map(item => ({
        soilType: item[0],
        percentage: item[1],
        fill: `var(--color-${item[0].toLowerCase()})`
    }));
}

// Function to rank soil data
function rankSoilData(data) {
    if (!Array.isArray(data)) {
        console.error("Data is not an array:", data);
        throw new Error("Invalid data format");
    }
    // Sort data by percentage in descending order and assign ranks
    const rankedData = data
        .map((item, index) => ({ ...item, rank: index + 1 }))
        .sort((a, b) => b.percentage - a.percentage);
    return rankedData;
}

// Export the functions
export { fetchSoilData, processSoilData, rankSoilData };
