'use client';

import { useState, useEffect } from "react";

const SoilMineralRanking = () => {
    const [soilData, setSoilData] = useState(null);
    const [minerals, setMinerals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const geologicalFactors = {
        depth: {
            shallow: [0, 30],
            medium: [30, 100],
            deep: [100, 200]
        },
        pH: {
            acidic: [0, 6.5],
            neutral: [6.5, 7.5],
            alkaline: [7.5, 14]
        },
        organicContent: {
            low: [0, 5],
            medium: [5, 15],
            high: [15, 100]
        },
        clayContent: {
            low: [0, 20],
            medium: [20, 40],
            high: [40, 100]
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const lat = urlParams.get("lat");
            const lon = urlParams.get("lon");

            if (!lat || !lon) {
                setError("Location coordinates required");
                setLoading(false);
                return;
            }

            try {
                const classResponse = await fetch(`https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${lon}&lat=${lat}`);
                const propResponse = await fetch(`https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=phh2o&property=soc&property=clay&depth=0-30cm`);

                const classData = await classResponse.json();
                const propData = await propResponse.json();

                const soilInfo = {
                    soilClass: classData?.wrb_class_name || 'Unknown',
                    pH: (propData?.properties?.phh2o?.values?.[0] ?? 70) / 10,
                    organic: (propData?.properties?.soc?.values?.[0] ?? 20) / 10,
                    clay: (propData?.properties?.clay?.values?.[0] ?? 200) / 10,
                    depth: 30
                };

                setSoilData(soilInfo);

                const mineralResults = Object.keys(mineralRequirements)
                    .map(mineral => calculateMineralProbability(soilInfo, mineral))
                    .filter(Boolean)
                    .sort((a, b) => b.probability - a.probability);

                setMinerals(mineralResults);
            } catch (err) {
                setError("Failed to fetch soil data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    const mineralRequirements = {
        // Silicate Minerals
        Quartz: {
            soilTypes: ['Arenosols', 'Podzols', 'Regosols', 'Leptosols', 'Fluvisols'],
            pH: 'acidic',
            depth: 'shallow',
            organicContent: 'low',
            clayContent: 'low',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Feldspar: {
            soilTypes: ['Cambisols', 'Luvisols', 'Andosols', 'Acrisols', 'Alisols'],
            pH: 'neutral',
            depth: 'medium',
            organicContent: 'low',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Mica: {
            soilTypes: ['Vertisols', 'Nitisols', 'Luvisols', 'Cambisols', 'Phaeozems'],
            pH: 'neutral',
            depth: 'medium',
            organicContent: 'medium',
            clayContent: 'high',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        // Carbonate and Sulfate Minerals
        Calcite: {
            soilTypes: ['Calcisols', 'Chernozems', 'Kastanozems', 'Rendzinas', 'Phaeozems'],
            pH: 'alkaline',
            depth: 'medium',
            organicContent: 'medium',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Gypsum: {
            soilTypes: ['Gypsisols', 'Solonchaks', 'Calcisols', 'Durisols', 'Kastanozems'],
            pH: 'alkaline',
            depth: 'shallow',
            organicContent: 'low',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        // Oxide Minerals
        Hematite: {
            soilTypes: ['Nitisols', 'Ferralsols', 'Plinthosols', 'Acrisols', 'Alisols'],
            pH: 'acidic',
            depth: 'deep',
            organicContent: 'low',
            clayContent: 'high',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Magnetite: {
            soilTypes: ['Andosols', 'Nitisols', 'Ferralsols', 'Cambisols', 'Vertisols'],
            pH: 'neutral',
            depth: 'deep',
            organicContent: 'low',
            clayContent: 'high',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        // Gemstones
        Diamond: {
            soilTypes: ['Vertisols', 'Anthrosols', 'Cambisols', 'Nitisols', 'Luvisols'],
            pH: 'alkaline',
            depth: 'deep',
            organicContent: 'low',
            clayContent: 'high',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Ruby: {
            soilTypes: ['Nitisols', 'Ferralsols', 'Acrisols', 'Luvisols', 'Cambisols'],
            pH: 'acidic',
            depth: 'deep',
            organicContent: 'low',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Emerald: {
            soilTypes: ['Cambisols', 'Luvisols', 'Vertisols', 'Nitisols', 'Andosols'],
            pH: 'neutral',
            depth: 'deep',
            organicContent: 'low',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Sapphire: {
            soilTypes: ['Nitisols', 'Ferralsols', 'Acrisols', 'Cambisols', 'Luvisols'],
            pH: 'acidic',
            depth: 'deep',
            organicContent: 'low',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Topaz: {
            soilTypes: ['Regosols', 'Cambisols', 'Luvisols', 'Andosols', 'Leptosols'],
            pH: 'acidic',
            depth: 'medium',
            organicContent: 'low',
            clayContent: 'low',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Amethyst: {
            soilTypes: ['Regosols', 'Leptosols', 'Cambisols', 'Andosols', 'Arenosols'],
            pH: 'neutral',
            depth: 'medium',
            organicContent: 'low',
            clayContent: 'low',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Halite: {
            soilTypes: ['Solonchaks', 'Solonetz', 'Gypsisols', 'Calcisols', 'Arenosols'],
            pH: 'alkaline',
            depth: 'shallow',
            organicContent: 'low',
            clayContent: 'low',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Fluorite: {
            soilTypes: ['Calcisols', 'Gypsisols', 'Cambisols', 'Leptosols', 'Regosols'],
            pH: 'alkaline',
            depth: 'medium',
            organicContent: 'low',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Pyrite: {
            soilTypes: ['Gleysols', 'Histosols', 'Fluvisols', 'Stagnosols', 'Umbrisols'],
            pH: 'acidic',
            depth: 'medium',
            organicContent: 'high',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Galena: {
            soilTypes: ['Cambisols', 'Luvisols', 'Vertisols', 'Nitisols', 'Andosols'],
            pH: 'neutral',
            depth: 'deep',
            organicContent: 'low',
            clayContent: 'high',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Sphalerite: {
            soilTypes: ['Cambisols', 'Vertisols', 'Luvisols', 'Nitisols', 'Andosols'],
            pH: 'neutral',
            depth: 'deep',
            organicContent: 'low',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Chalcopyrite: {
            soilTypes: ['Andosols', 'Cambisols', 'Nitisols', 'Vertisols', 'Luvisols'],
            pH: 'acidic',
            depth: 'deep',
            organicContent: 'low',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Malachite: {
            soilTypes: ['Calcisols', 'Cambisols', 'Luvisols', 'Kastanozems', 'Chernozems'],
            pH: 'alkaline',
            depth: 'medium',
            organicContent: 'low',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Bauxite: {
            soilTypes: ['Ferralsols', 'Acrisols', 'Nitisols', 'Plinthosols', 'Alisols'],
            pH: 'acidic',
            depth: 'shallow',
            organicContent: 'low',
            clayContent: 'high',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Graphite: {
            soilTypes: ['Histosols', 'Umbrisols', 'Phaeozems', 'Chernozems', 'Kastanozems'],
            pH: 'neutral',
            depth: 'deep',
            organicContent: 'high',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Kaolinite: {
            soilTypes: ['Acrisols', 'Ferralsols', 'Nitisols', 'Alisols', 'Plinthosols'],
            pH: 'acidic',
            depth: 'shallow',
            organicContent: 'low',
            clayContent: 'high',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Talc: {
            soilTypes: ['Cambisols', 'Luvisols', 'Andosols', 'Vertisols', 'Nitisols'],
            pH: 'neutral',
            depth: 'medium',
            organicContent: 'low',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Corundum: {
            soilTypes: ['Ferralsols', 'Nitisols', 'Acrisols', 'Alisols', 'Plinthosols'],
            pH: 'acidic',
            depth: 'deep',
            organicContent: 'low',
            clayContent: 'high',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        },
        Olivine: {
            soilTypes: ['Andosols', 'Nitisols', 'Vertisols', 'Cambisols', 'Phaeozems'],
            pH: 'alkaline',
            depth: 'deep',
            organicContent: 'low',
            clayContent: 'medium',
            weightFactors: {
                soilMatch: 0.4,
                pHMatch: 0.3,
                depthMatch: 0.2,
                organicMatch: 0.1
            }
        }

    };

    const calculateMineralProbability = (soilData, mineral) => {
        const requirements = mineralRequirements[mineral];

        // Calculate individual scores with weighted importance
        const scores = {
            soilMatch: requirements.soilTypes.some(type =>
                soilData.soilClass.toLowerCase().includes(type.toLowerCase())) ? 1 : 0.1,
            pHMatch: (soilData.pH >= geologicalFactors.pH[requirements.pH][0] &&
                soilData.pH <= geologicalFactors.pH[requirements.pH][1]) ? 1 : 0.1,
            depthMatch: (soilData.depth >= geologicalFactors.depth[requirements.depth][0] &&
                soilData.depth <= geologicalFactors.depth[requirements.depth][1]) ? 1 : 0.1,
            organicMatch: (soilData.organic >= geologicalFactors.organicContent[requirements.organicContent][0] &&
                soilData.organic <= geologicalFactors.organicContent[requirements.organicContent][1]) ? 1 : 0.1
        };

        // Calculate raw probability with weighted factors
        const rawProbability = Object.entries(scores).reduce((total, [factor, score]) =>
            total + (score * requirements.weightFactors[factor]), 0);

        return {
            name: mineral,
            probability: rawProbability,
            confidenceFactors: scores
        };
    };

    const analyzeSoilData = (classData, propData) => {
        const soilData = {
            soilClass: classData?.wrb_class_name || 'Unknown',
            pH: (propData?.properties?.phh2o?.values?.[0] ?? 70) / 10,
            organic: (propData?.properties?.soc?.values?.[0] ?? 20) / 10,
            clay: (propData?.properties?.clay?.values?.[0] ?? 200) / 10,
            depth: 30
        };

        // Get all mineral probabilities
        let mineralResults = Object.keys(mineralRequirements)
            .map(mineral => calculateMineralProbability(soilData, mineral));

        // Calculate total for normalization
        const totalProbability = mineralResults.reduce((sum, mineral) => sum + mineral.probability, 0);

        // Normalize to percentages
        mineralResults = mineralResults
            .map(mineral => ({
                ...mineral,
                probability: (mineral.probability / totalProbability)
            }))
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 10);

        return { soilData, minerals: mineralResults };
    };


    const fetchSoilData = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const lat = parseFloat(urlParams.get("lat"));
            const lon = parseFloat(urlParams.get("lon"));

            if (!lat || !lon) {
                throw new Error("Valid latitude and longitude required");
            }

            const propertiesUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=phh2o&property=soc&property=clay&depth=0-30cm`;
            const classificationUrl = `https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${lon}&lat=${lat}`;

            const [classificationResponse, propertiesResponse] = await Promise.all([
                fetch(classificationUrl),
                fetch(propertiesUrl)
            ]);

            if (!classificationResponse.ok || !propertiesResponse.ok) {
                throw new Error("Failed to fetch soil data");
            }

            const classData = await classificationResponse.json();
            const propData = await propertiesResponse.json();

            analyzeSoilData(classData, propData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="mx-auto mineral-ranking-container bg-gradient-to-br from-purple-500/20 to-indigo-500/20 dark:from-purple-900/40 dark:to-indigo-900/40 p-8 rounded-3xl shadow-2xl max-w-4xl w-full backdrop-blur-sm border border-white/20 dark:border-gray-700/20 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 animate-slideDown">Advanced Mineral Analysis</h2>

            {loading && (
                <div className="text-center p-6 animate-pulse">
                    <p className="text-xl text-purple-700 dark:text-purple-400">Analyzing soil composition...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-6 rounded-xl animate-slideIn">
                    <p className="text-lg">{error}</p>
                </div>
            )}

            {soilData && !loading && (
                <>
                    <div className="mb-6 p-6 bg-white/60 dark:bg-gray-800/60 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 animate-slideIn">
                        <p className="text-lg mb-2 dark:text-gray-200"><strong>Soil Classification:</strong> {soilData.soilClass}</p>
                        <p className="text-lg mb-2 dark:text-gray-200"><strong>pH Level:</strong> {soilData.pH.toFixed(1)}</p>
                        <p className="text-lg mb-2 dark:text-gray-200"><strong>Organic Content:</strong> {soilData.organic.toFixed(1)}%</p>
                        <p className="text-lg mb-2 dark:text-gray-200"><strong>Clay Content:</strong> {soilData.clay.toFixed(1)}%</p>
                    </div>

                    <div className="space-y-6">
                        {minerals.map((mineral, index) => (
                            <div
                                key={index}
                                className="mineral-item p-6 bg-white/60 dark:bg-gray-800/60 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slideUp"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-xl font-bold text-purple-800 dark:text-purple-400">{mineral.name}</p>
                                    <span className="text-xl font-semibold text-indigo-700 dark:text-indigo-400">
                                        {(mineral.probability * 100).toFixed(1)}% probability
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-400 dark:to-indigo-400 h-3 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${mineral.probability * 100}%` }}
                                    />
                                </div>
                                <div className="mt-3">
                                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Matching Factors:</p>
                                    {Object.entries(mineral.confidenceFactors).map(([factor, score], i) => (
                                        <span
                                            key={i}
                                            className={`inline-block mr-4 px-3 py-1 rounded-full transition-all duration-300 hover:scale-105 ${score
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}
                                        >
                                            {factor.replace('Match', '')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>

    );
};

export default SoilMineralRanking;
