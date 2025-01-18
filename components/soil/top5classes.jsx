"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts";
import { useState, useEffect } from "react";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export function TopSoilClassesChart() {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const lat = parseFloat(urlParams.get("lat"));
        const lon = parseFloat(urlParams.get("lon"));

        if (!lat || !lon) {
            setError("Latitude or longitude is missing in the URL.");
            setLoading(false);
            return;
        }

        const fetchSoilClasses = async () => {
            try {
                const response = await fetch(
                    `https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${lon}&lat=${lat}&number_classes=5`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch soil classes.");
                }
                const data = await response.json();

                const formattedData = data.wrb_class_probability.map(([className, value], index) => ({
                    soilClass: className,
                    probability: value,
                    fill: `hsl(var(--chart-${index + 1}))`,
                }));

                setChartData(formattedData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSoilClasses();
    }, []);

    if (loading) return <p>Loading top soil classes...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <Card className="bg-yellow-500/10 shadow-md rounded-xl p-4">
            <CardHeader>
                <CardTitle className="text-xl font-bold ">
                    Top 5 Soil Classes
                </CardTitle>
                <CardDescription className="text-sm ">
                    Based on probability ranking
                </CardDescription>
            </CardHeader>
            <CardContent>
                <BarChart
                    data={chartData}
                    layout="vertical"
                    width={400}
                    height={300}
                    margin={{ top: 20, right: 20, bottom: 20, left: 50 }}
                >
                    <YAxis
                        dataKey="soilClass"
                        type="category"
                        tick={{ fontSize: 14, fill: "#333" }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <XAxis
                        dataKey="probability"
                        type="number"
                        tick={{ fontSize: 12, fill: "#666" }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "10px",
                        }}
                        cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
                    />
                    <Bar dataKey="probability" barSize={30} radius={[5, 5, 0, 0]} />
                </BarChart>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-medium ">
                    Insights based on SoilGrids data <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs ">
                    Showing top 5 soil classes ranked by probability.
                </p>
            </CardFooter>
        </Card>
    );
}

export default TopSoilClassesChart;
