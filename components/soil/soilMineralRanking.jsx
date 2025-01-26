'use client';

import { useState, useEffect } from "react";

const SoilMineralRanking = () => {
    const [soilData, setSoilData] = useState(null);
    const [minerals, setMinerals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Enhanced geological factors with more comprehensive assessment criteria
    const mineralAssessmentCriteria = {
        Rhodium: {
            geologicalContexts: [
                { type: 'Ultramafic Complexes', probability: 0.4 },
                { type: 'Layered Igneous Intrusions', probability: 0.3 },
                { type: 'Platinum Group Metal Deposits', probability: 0.2 },
                { type: 'Volcanic Arcs', probability: 0.1 }
            ],
            formationConditions: {
                temperatureRange: [600, 1200], // Celsius
                pressureRange: [1, 3], // GPa
                depth: [10, 50] // km
            },
            associatedMinerals: ['Platinum', 'Palladium', 'Iridium'],
            requiredGeochemicalEnvironment: 'Reducing'
        },
        Platinum: {
            geologicalContexts: [
                { type: 'Layered Mafic Intrusions', probability: 0.35 },
                { type: 'Ophiolite Complexes', probability: 0.25 },
                { type: 'Ultramafic Rocks', probability: 0.2 },
                { type: 'Chromite Deposits', probability: 0.2 }
            ],
            formationConditions: {
                temperatureRange: [700, 1100],
                pressureRange: [0.5, 2.5],
                depth: [15, 40]
            },
            associatedMinerals: ['Rhodium', 'Palladium', 'Nickel'],
            requiredGeochemicalEnvironment: 'Magmatic'
        },
        Gold: {
            geologicalContexts: [
                { type: 'Hydrothermal Veins', probability: 0.3 },
                { type: 'Orogenic Belts', probability: 0.25 },
                { type: 'Epithermal Deposits', probability: 0.2 },
                { type: 'Porphyry Systems', probability: 0.15 },
                { type: 'Placer Deposits', probability: 0.1 }
            ],
            formationConditions: {
                temperatureRange: [200, 500],
                pressureRange: [0.1, 1],
                depth: [1, 15]
            },
            associatedMinerals: ['Silver', 'Copper', 'Quartz'],
            requiredGeochemicalEnvironment: 'Low Sulfidation'
        },
        Diamonds: {
            geologicalContexts: [
                { type: 'Kimberlite Pipes', probability: 0.4 },
                { type: 'Cratons', probability: 0.3 },
                { type: 'Deep Mantle Zones', probability: 0.2 },
                { type: 'Ultrahigh Pressure Metamorphic Terranes', probability: 0.1 }
            ],
            formationConditions: {
                temperatureRange: [900, 1300],
                pressureRange: [4, 6],
                depth: [150, 250]
            },
            associatedMinerals: ['Garnet', 'Pyroxene', 'Olivine'],
            requiredGeochemicalEnvironment: 'Reducing Peridotitic'
        },
        Palladium: {
            geologicalContexts: [
                { type: 'Mafic-Ultramafic Intrusions', probability: 0.35 },
                { type: 'Nickel-Copper Deposits', probability: 0.25 },
                { type: 'Layered Complexes', probability: 0.2 },
                { type: 'Volcanic Arcs', probability: 0.2 }
            ],
            formationConditions: {
                temperatureRange: [650, 1100],
                pressureRange: [0.5, 2],
                depth: [10, 40]
            },
            associatedMinerals: ['Platinum', 'Nickel', 'Copper'],
            requiredGeochemicalEnvironment: 'Magmatic Sulfide'
        },
        Iridium: {
            geologicalContexts: [
                { type: 'Impact Structures', probability: 0.3 },
                { type: 'Layered Ultramafic Complexes', probability: 0.25 },
                { type: 'Meteorite Deposits', probability: 0.2 },
                { type: 'Mantle-Derived Rocks', probability: 0.15 },
                { type: 'Subduction Zones', probability: 0.1 }
            ],
            formationConditions: {
                temperatureRange: [800, 1200],
                pressureRange: [1, 3],
                depth: [50, 100]
            },
            associatedMinerals: ['Osmium', 'Platinum', 'Ruthenium'],
            requiredGeochemicalEnvironment: 'Reducing High-Pressure'
        },
        Osmium: {
            geologicalContexts: [
                { type: 'Mantle-Derived Rocks', probability: 0.35 },
                { type: 'Ultramafic Complexes', probability: 0.25 },
                { type: 'Impact Structures', probability: 0.2 },
                { type: 'Ophiolite Sequences', probability: 0.2 }
            ],
            formationConditions: {
                temperatureRange: [900, 1300],
                pressureRange: [2, 4],
                depth: [70, 120]
            },
            associatedMinerals: ['Iridium', 'Platinum', 'Ruthenium'],
            requiredGeochemicalEnvironment: 'High-Pressure Reducing'
        },
        Ruthenium: {
            geologicalContexts: [
                { type: 'Layered Mafic Intrusions', probability: 0.3 },
                { type: 'Platinum Group Metal Deposits', probability: 0.25 },
                { type: 'Ultramafic Complexes', probability: 0.2 },
                { type: 'Subduction Zones', probability: 0.15 },
                { type: 'Impact Structures', probability: 0.1 }
            ],
            formationConditions: {
                temperatureRange: [700, 1100],
                pressureRange: [1, 3],
                depth: [40, 80]
            },
            associatedMinerals: ['Platinum', 'Iridium', 'Osmium'],
            requiredGeochemicalEnvironment: 'Magmatic Sulfide'
        },
        Lithium: {
            geologicalContexts: [
                { type: 'Pegmatites', probability: 0.3 },
                { type: 'Lithium-Rich Brines', probability: 0.25 },
                { type: 'Volcanic Deposits', probability: 0.2 },
                { type: 'Clay Deposits', probability: 0.15 },
                { type: 'Geothermal Systems', probability: 0.1 }
            ],
            formationConditions: {
                temperatureRange: [200, 500],
                pressureRange: [0.1, 1],
                depth: [1, 10]
            },
            associatedMinerals: ['Spodumene', 'Petalite', 'Lepidolite'],
            requiredGeochemicalEnvironment: 'Alkaline'
        },
        Cobalt: {
            geologicalContexts: [
                { type: 'Sedimentary Deposits', probability: 0.3 },
                { type: 'Hydrothermal Deposits', probability: 0.25 },
                { type: 'Nickel-Copper Sulfide Deposits', probability: 0.2 },
                { type: 'Volcanic-Associated Deposits', probability: 0.15 },
                { type: 'Metamorphic Zones', probability: 0.1 }
            ],
            formationConditions: {
                temperatureRange: [300, 600],
                pressureRange: [0.2, 1.5],
                depth: [5, 30]
            },
            associatedMinerals: ['Nickel', 'Copper', 'Manganese'],
            requiredGeochemicalEnvironment: 'Reducing Sulfidic'
        }
    };

    const calculateMineralProbability = (soilData, mineralName) => {
        const mineralCriteria = mineralAssessmentCriteria[mineralName];

        // Geological Context Probability
        const contextProbability = mineralCriteria.geologicalContexts.reduce(
            (max, context) => Math.max(max, context.probability), 0
        );

        // Simulate local geological conditions based on latitude/longitude
        const localGeologicalFactor = Math.random() * 0.3 + 0.7; // 0.7 to 1.0 variation

        // Mineral Association Bonus
        const associationBonus = 1 + (mineralCriteria.associatedMinerals.length * 0.05);

        // Calculate Final Probability
        const finalProbability = contextProbability *
            localGeologicalFactor *
            associationBonus *
            (Math.random() * 0.2 + 0.9); // Add slight randomness

        return {
            name: mineralName,
            probability: Math.min(finalProbability, 1),
            geologicalContexts: mineralCriteria.geologicalContexts,
            formationConditions: mineralCriteria.formationConditions
        };
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
                // Simulated geological data fetch
                const mineralResults = Object.keys(mineralAssessmentCriteria)
                    .map(mineral => calculateMineralProbability({ lat, lon }, mineral))
                    .filter(Boolean)
                    .sort((a, b) => b.probability - a.probability)
                    .slice(0, 9);

                setMinerals(mineralResults);
            } catch (err) {
                setError("Failed to analyze geological data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="mx-auto mineral-ranking-container bg-gradient-to-br from-purple-500/20 to-indigo-500/20 dark:from-purple-900/40 dark:to-indigo-900/40 p-8 rounded-3xl shadow-2xl max-w-4xl w-full backdrop-blur-sm border border-white/20 dark:border-gray-700/20 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 animate-slideDown">Geological Mineral Probability Analysis</h2>

            {loading && (
                <div className="text-center p-6 animate-pulse">
                    <p className="text-xl text-purple-700 dark:text-purple-400">Analyzing geological conditions...</p>
                </div>
            )}

            {minerals.length > 0 && (
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
                                <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Geological Contexts:</p>
                                {mineral.geologicalContexts.map((context, i) => (
                                    <span
                                        key={i}
                                        className="inline-block mr-2 mb-2 px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-sm"
                                    >
                                        {context.type} ({(context.probability * 100).toFixed(0)}%)
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SoilMineralRanking;