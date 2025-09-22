'use client';

import { useState, useEffect } from "react";

const PopulationDetailsComponent = () => {
    const [populationHistory, setPopulationHistory] = useState([]);
    const [ageGenderData, setAgeGenderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [coordinates, setCoordinates] = useState({ lat: null, lon: null });
    const [locationName, setLocationName] = useState("Loading...");
    const [darkMode, setDarkMode] = useState(false);

    const API_BASE = "https://api.worldpop.org/v1";
    const AVAILABLE_YEARS = [2000, 2005, 2010, 2015, 2020];

    // Dark mode detection from site theme
    useEffect(() => {
        const checkDarkMode = () => {
            // Check for site-wide dark mode class on html or body
            const isDark = document.documentElement.classList.contains('dark') || 
                          document.body.classList.contains('dark') ||
                          document.documentElement.getAttribute('data-theme') === 'dark' ||
                          window.matchMedia('(prefers-color-scheme: dark)').matches;
            setDarkMode(isDark);
        };
        
        // Check initially
        checkDarkMode();
        
        // Watch for changes in system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => checkDarkMode();
        mediaQuery.addEventListener('change', handler);
        
        // Watch for changes in document classes (site theme changes)
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });
        
        return () => {
            mediaQuery.removeEventListener('change', handler);
            observer.disconnect();
        };
    }, []);

    const buildGeoJsonFeatureCollection = (lat, lon, sizeKm = 1.0) => {
        const d = sizeKm / 111;
        return {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lon - d / 2, lat - d / 2],
                        [lon + d / 2, lat - d / 2],
                        [lon + d / 2, lat + d / 2],
                        [lon - d / 2, lat + d / 2],
                        [lon - d / 2, lat - d / 2]
                    ]]
                }
            }]
        };
    };

    const getPopulationData = async (lat, lon, year, dataset = 'wpgppop', sizeKm = 1.0) => {
        const geojson = buildGeoJsonFeatureCollection(lat, lon, sizeKm);
        
        try {
            const syncUrl = `${API_BASE}/services/stats?dataset=${dataset}&year=${year}&geojson=${encodeURIComponent(JSON.stringify(geojson))}&runasync=false`;
            const response = await fetch(syncUrl);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            
            if (result.status === "finished" && result.data) {
                const area = sizeKm * sizeKm;
                
                if (dataset === 'wpgppop' && result.data.total_population !== undefined) {
                    return {
                        year,
                        population: result.data.total_population,
                        density: result.data.total_population / area,
                        raw: result
                    };
                }
                
                if (dataset === 'wpgpas' && result.data.agesexpyramid) {
                    return {
                        ageData: result.data.agesexpyramid,
                        year,
                        raw: result
                    };
                }
            }
            
            // Handle async tasks
            if (result.taskid) {
                const taskUrl = `${API_BASE}/tasks/${result.taskid}`;
                for (let i = 0; i < 30; i++) {
                    await new Promise(r => setTimeout(r, 2000));
                    
                    const taskResponse = await fetch(taskUrl);
                    const taskResult = await taskResponse.json();
                    
                    if (taskResult.status === "finished" && !taskResult.error) {
                        const area = sizeKm * sizeKm;
                        
                        if (dataset === 'wpgppop' && taskResult.data.total_population !== undefined) {
                            return {
                                year,
                                population: taskResult.data.total_population,
                                density: taskResult.data.total_population / area,
                                raw: taskResult
                            };
                        }
                        
                        if (dataset === 'wpgpas' && taskResult.data.agesexpyramid) {
                            return {
                                ageData: taskResult.data.agesexpyramid,
                                year,
                                raw: taskResult
                            };
                        }
                    }
                    
                    if (taskResult.status === "failed" || taskResult.error) {
                        throw new Error(taskResult.error_message || "Task failed");
                    }
                }
                throw new Error("Task timed out");
            }
        } catch (err) {
            console.warn(`Failed to fetch data for year ${year}:`, err.message);
            return null;
        }
    };

    const getLocationName = async (lat, lon) => {
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const data = await response.json();
            return data.city || data.locality || data.principalSubdivision || "Unknown Location";
        } catch {
            return "Unknown Location";
        }
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const lat = parseFloat(urlParams.get("lat"));
        const lon = parseFloat(urlParams.get("lon"));

        if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
            setError("Valid latitude and longitude parameters are required");
            setLoading(false);
            return;
        }

        setCoordinates({ lat, lon });
        getLocationName(lat, lon).then(setLocationName);

        const fetchAllData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch population data for all years
                const populationPromises = AVAILABLE_YEARS.map(year => 
                    getPopulationData(lat, lon, year, 'wpgppop', 1.0)
                );
                
                const populationResults = await Promise.all(populationPromises);
                const validPopulationData = populationResults.filter(result => result !== null);
                
                if (validPopulationData.length === 0) {
                    throw new Error("No population data available for any year");
                }
                
                // Calculate growth rates
                const historyWithGrowth = validPopulationData.map((data, index) => {
                    if (index === 0) {
                        return { ...data, growthRate: 0 };
                    }
                    
                    const prevData = validPopulationData[index - 1];
                    const yearDiff = data.year - prevData.year;
                    const growthRate = yearDiff > 0 ? 
                        ((data.population - prevData.population) / prevData.population) * 100 / yearDiff * 5 : 0; // Annualized over 5-year periods
                    
                    return { ...data, growthRate };
                });
                
                setPopulationHistory(historyWithGrowth);
                
                // Fetch age/gender data for the latest available year
                const latestYear = Math.max(...validPopulationData.map(d => d.year));
                const ageData = await getPopulationData(lat, lon, latestYear, 'wpgpas', 1.0);
                if (ageData) setAgeGenderData(ageData);
                
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const formatNumber = (num) => new Intl.NumberFormat('en-US').format(Math.round(num || 0));
    const formatDecimal = (num) => parseFloat(num || 0).toFixed(2);

    const themeClasses = darkMode ? {
        bg: 'bg-gray-900',
        cardBg: 'bg-gray-800/90',
        text: 'text-white',
        textSecondary: 'text-gray-300',
        border: 'border-gray-700',
        accent: 'bg-blue-600',
        hover: 'hover:bg-gray-700'
    } : {
        bg: 'bg-gray-50',
        cardBg: 'bg-white/90',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        border: 'border-gray-200',
        accent: 'bg-blue-500',
        hover: 'hover:bg-gray-50'
    };

    if (loading) return (
        <div className={`min-h-screen ${themeClasses.bg} transition-colors duration-300 p-4 sm:p-6`}>
            <div className="max-w-4xl mx-auto">
                <div className={`${themeClasses.cardBg} backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl ${themeClasses.border} border`}>
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 absolute top-0 left-0"></div>
                        </div>
                        <h2 className={`text-xl sm:text-2xl font-bold ${themeClasses.text}`}>Loading Population Data</h2>
                        <p className={themeClasses.textSecondary}>Analyzing demographic trends...</p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className={`min-h-screen ${themeClasses.bg} transition-colors duration-300 p-4 sm:p-6`}>
            <div className="max-w-4xl mx-auto">
                <div className={`${themeClasses.cardBg} backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-red-300`}>
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className={`text-xl sm:text-2xl font-bold ${themeClasses.text}`}>Data Loading Error</h2>
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const latestData = populationHistory[populationHistory.length - 1];
    const totalMale = ageGenderData?.ageData?.reduce((sum, group) => sum + (group.male || 0), 0) || 0;
    const totalFemale = ageGenderData?.ageData?.reduce((sum, group) => sum + (group.female || 0), 0) || 0;
    const totalAgePopulation = totalMale + totalFemale;

    const maxPopulation = Math.max(...populationHistory.map(d => d.population));
    const maxGrowthRate = Math.max(...populationHistory.map(d => Math.abs(d.growthRate)));

    return (
        <div className={`min-h-screen ${themeClasses.bg} transition-colors duration-300 p-4 sm:p-6 lg:p-8`}>
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                
                {/* Header */}
                <div className={`${themeClasses.cardBg} backdrop-blur-sm rounded-2xl shadow-xl ${themeClasses.border} border p-6 sm:p-8`}>
                    <div>
                        <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${themeClasses.text} mb-2`}>
                            Population Analysis
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200`}>
                                📍 {locationName}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200`}>
                                🗓️ {AVAILABLE_YEARS[0]} - {AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Current Stats Grid */}
                {latestData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div className={`${themeClasses.cardBg} backdrop-blur-sm rounded-xl shadow-lg ${themeClasses.border} border p-4 sm:p-6`}>
                            <div className="text-center">
                                <div className="text-2xl mb-2">👥</div>
                                <div className={`text-2xl sm:text-3xl font-bold ${themeClasses.text} mb-1`}>
                                    {formatNumber(latestData.population)}
                                </div>
                                <div className={`text-sm ${themeClasses.textSecondary}`}>Current Population</div>
                                <div className={`text-xs ${themeClasses.textSecondary} mt-1`}>{latestData.year} data</div>
                            </div>
                        </div>

                        <div className={`${themeClasses.cardBg} backdrop-blur-sm rounded-xl shadow-lg ${themeClasses.border} border p-4 sm:p-6`}>
                            <div className="text-center">
                                <div className="text-2xl mb-2">📊</div>
                                <div className={`text-2xl sm:text-3xl font-bold ${themeClasses.text} mb-1`}>
                                    {formatNumber(latestData.density)}
                                </div>
                                <div className={`text-sm ${themeClasses.textSecondary}`}>Density (per km²)</div>
                                <div className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                                    {latestData.density < 100 ? '🌾 Rural' : 
                                     latestData.density < 1000 ? '🏘️ Suburban' : 
                                     latestData.density < 5000 ? '🏙️ Urban' : '🌆 Dense Urban'}
                                </div>
                            </div>
                        </div>

                        {totalAgePopulation > 0 && (
                            <>
                                <div className={`${themeClasses.cardBg} backdrop-blur-sm rounded-xl shadow-lg ${themeClasses.border} border p-4 sm:p-6`}>
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">👨</div>
                                        <div className={`text-2xl sm:text-3xl font-bold text-blue-600 mb-1`}>
                                            {((totalMale / totalAgePopulation) * 100).toFixed(1)}%
                                        </div>
                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Male Population</div>
                                        <div className={`text-xs ${themeClasses.textSecondary} mt-1`}>{formatNumber(totalMale)} people</div>
                                    </div>
                                </div>

                                <div className={`${themeClasses.cardBg} backdrop-blur-sm rounded-xl shadow-lg ${themeClasses.border} border p-4 sm:p-6`}>
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">👩</div>
                                        <div className={`text-2xl sm:text-3xl font-bold text-pink-600 mb-1`}>
                                            {((totalFemale / totalAgePopulation) * 100).toFixed(1)}%
                                        </div>
                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Female Population</div>
                                        <div className={`text-xs ${themeClasses.textSecondary} mt-1`}>{formatNumber(totalFemale)} people</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Population Growth Chart */}
                <div className={`${themeClasses.cardBg} backdrop-blur-sm rounded-2xl shadow-xl ${themeClasses.border} border p-6 sm:p-8`}>
                    <h3 className={`text-xl sm:text-2xl font-bold ${themeClasses.text} mb-6 flex items-center`}>
                        <span className="mr-3">📈</span> Population Growth Trends
                    </h3>
                    
                    {/* Population Chart */}
                    <div className="mb-8">
                        <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Population Over Time</h4>
                        <div className="relative h-48 sm:h-64">
                            <div className="absolute inset-0 flex items-end justify-between space-x-2">
                                {populationHistory.map((data, index) => (
                                    <div key={data.year} className="flex-1 flex flex-col items-center">
                                        <div className="w-full relative group">
                                            <div 
                                                className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                                                style={{ 
                                                    height: `${(data.population / maxPopulation) * 100}%`,
                                                    minHeight: '8px'
                                                }}
                                            ></div>
                                            
                                            {/* Tooltip */}
                                            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 ${themeClasses.cardBg} ${themeClasses.border} border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-center whitespace-nowrap z-10`}>
                                                <div className={`font-semibold ${themeClasses.text}`}>{data.year}</div>
                                                <div className={`text-sm ${themeClasses.textSecondary}`}>{formatNumber(data.population)}</div>
                                                <div className={`text-xs ${themeClasses.textSecondary}`}>{formatNumber(data.density)}/km²</div>
                                            </div>
                                        </div>
                                        <div className={`text-xs ${themeClasses.textSecondary} mt-2 text-center`}>
                                            {data.year}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Growth Rate Chart */}
                    <div>
                        <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>5-Year Growth Rate (%)</h4>
                        <div className="relative h-32 sm:h-40">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className={`w-full h-px ${themeClasses.border} border-t`}></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-between space-x-2">
                                {populationHistory.slice(1).map((data, index) => (
                                    <div key={data.year} className="flex-1 flex flex-col items-center justify-center">
                                        <div className="w-full relative group">
                                            <div 
                                                className={`rounded-md transition-all duration-500 ${
                                                    data.growthRate >= 0 
                                                        ? 'bg-gradient-to-t from-green-500 to-green-400 hover:from-green-600 hover:to-green-500' 
                                                        : 'bg-gradient-to-b from-red-500 to-red-400 hover:from-red-600 hover:to-red-500'
                                                }`}
                                                style={{ 
                                                    height: `${Math.abs(data.growthRate) / maxGrowthRate * 50 + 8}px`,
                                                    marginTop: data.growthRate >= 0 ? 'auto' : '0',
                                                    marginBottom: data.growthRate >= 0 ? '0' : 'auto'
                                                }}
                                            ></div>
                                            
                                            {/* Tooltip */}
                                            <div className={`absolute ${data.growthRate >= 0 ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 px-3 py-2 ${themeClasses.cardBg} ${themeClasses.border} border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-center whitespace-nowrap z-10`}>
                                                <div className={`font-semibold ${themeClasses.text}`}>{data.year}</div>
                                                <div className={`text-sm ${data.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {data.growthRate >= 0 ? '+' : ''}{formatDecimal(data.growthRate)}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-xs ${themeClasses.textSecondary} mt-2 text-center`}>
                                            {data.year}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Age Demographics */}
                {ageGenderData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        
                        {/* Age Groups */}
                        <div className={`${themeClasses.cardBg} backdrop-blur-sm rounded-2xl shadow-xl ${themeClasses.border} border p-6 sm:p-8`}>
                            <h3 className={`text-xl sm:text-2xl font-bold ${themeClasses.text} mb-6 flex items-center`}>
                                <span className="mr-3">👶👦👨👴</span> Age Distribution
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: "Children (0-14)", ages: [0, 1, 2, 3], icon: "👶", color: "green" },
                                    { label: "Youth (15-24)", ages: [15, 20], icon: "👦", color: "blue" },
                                    { label: "Adults (25-59)", ages: [25, 30, 35, 40, 45, 50, 55], icon: "👨", color: "purple" },
                                    { label: "Seniors (60+)", ages: [60, 65, 70, 75, 80], icon: "👴", color: "orange" }
                                ].map((group, idx) => {
                                    const groupTotal = ageGenderData.ageData
                                        .filter(item => group.ages.includes(parseInt(item.class)))
                                        .reduce((sum, item) => sum + item.male + item.female, 0);
                                    const percentage = (groupTotal / totalAgePopulation) * 100;
                                    
                                    return (
                                        <div key={idx} className={`p-4 rounded-xl ${themeClasses.border} border`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-2xl">{group.icon}</span>
                                                    <div>
                                                        <div className={`font-semibold ${themeClasses.text}`}>{group.label}</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary}`}>{formatNumber(groupTotal)} people</div>
                                                    </div>
                                                </div>
                                                <div className={`text-xl font-bold text-${group.color}-600`}>
                                                    {percentage.toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                <div 
                                                    className={`bg-${group.color}-500 h-3 rounded-full transition-all duration-1000`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className={`${themeClasses.cardBg} backdrop-blur-sm rounded-2xl shadow-xl ${themeClasses.border} border p-6 sm:p-8`}>
                            <h3 className={`text-xl sm:text-2xl font-bold ${themeClasses.text} mb-6 flex items-center`}>
                                <span className="mr-3">⚧️</span> Gender & Age Details
                            </h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {ageGenderData.ageData.slice(0, 12).map((group, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${themeClasses.border} border`}>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center font-bold text-blue-600 text-sm">
                                                {group.class}
                                            </div>
                                            <div>
                                                <div className={`font-medium ${themeClasses.text} text-sm`}>{group.age}</div>
                                                <div className={`text-xs ${themeClasses.textSecondary}`}>
                                                    {formatNumber(group.male + group.female)} total
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-4 text-right">
                                            <div>
                                                <div className="text-blue-600 font-bold text-sm">{formatNumber(group.male)}</div>
                                                <div className={`text-xs ${themeClasses.textSecondary}`}>♂</div>
                                            </div>
                                            <div>
                                                <div className="text-pink-600 font-bold text-sm">{formatNumber(group.female)}</div>
                                                <div className={`text-xs ${themeClasses.textSecondary}`}>♀</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className={`${themeClasses.cardBg} backdrop-blur-sm rounded-2xl shadow-xl ${themeClasses.border} border p-6 sm:p-8`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className={`font-bold ${themeClasses.text} mb-3 flex items-center`}>
                                <span className="mr-2">🌍</span> Location Data
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className={themeClasses.textSecondary}>Coordinates:</span>
                                    <span className={`font-mono ${themeClasses.text}`}>
                                        {coordinates.lat?.toFixed(4)}°, {coordinates.lon?.toFixed(4)}°
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeClasses.textSecondary}>Analysis Area:</span>
                                    <span className={themeClasses.text}>1km²</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeClasses.textSecondary}>Data Period:</span>
                                    <span className={themeClasses.text}>2000-2020</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className={`font-bold ${themeClasses.text} mb-3 flex items-center`}>
                                <span className="mr-2">📊</span> Data Source
                            </h4>
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className={themeClasses.textSecondary}>Dataset:</span>
                                    <span className={themeClasses.text}>WorldPop Global</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeClasses.textSecondary}>Resolution:</span>
                                    <span className={themeClasses.text}>100m grid</span>
                                </div>
                                <div className="mt-3">
                                    <a 
                                        href="https://www.worldpop.org" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline text-sm transition-colors"
                                    >
                                        Visit WorldPop.org →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PopulationDetailsComponent;