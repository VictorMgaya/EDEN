/**
 * Process and rank soil classes based on probabilities.
 * @param {Array} wrbClassProbability - Array of soil classes and their probabilities.
 * @returns {Array} - Sorted array of objects containing soil class names and probabilities.
 */
export function rankSoilClasses(wrbClassProbability) {
  if (!Array.isArray(wrbClassProbability) || wrbClassProbability.length === 0) {
    throw new Error("Invalid soil class probability data.");
  }

  // Map the data into a more usable format
  const formattedData = wrbClassProbability.map(([soilClass, probability]) => ({
    name: soilClass,
    value: probability,
  }));

  // Sort by probability in descending order
  const sortedData = formattedData.sort((a, b) => b.value - a.value);

  return sortedData;
}
