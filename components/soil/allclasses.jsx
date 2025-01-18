"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // Import useRouter
import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import Loading from "../Loader"

const TopSoilClassChart = () => {
    const [soilClasses, setSoilClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Extract latitude and longitude from URL query parameters
        const urlParams = new URLSearchParams(window.location.search)
        const lat = parseFloat(urlParams.get("lat"))
        const lon = parseFloat(urlParams.get("lon"))

        // If latitude or longitude is missing, exit early
        if (!lat || !lon) {
            setError("Latitude or longitude is missing in the URL.")
            setLoading(false)
            return
        }

        // Fetch all soil class data from SoilGrids API
        const fetchSoilClasses = async () => {
            try {
                const response = await fetch(
                    `https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${lon}&lat=${lat}&number_classes=10`
                )
                if (!response.ok) {
                    throw new Error("Failed to fetch soil classes.")
                }
                const data = await response.json()

                // Format data for the chart (soil classes and their probabilities)
                const formattedData = data.wrb_class_probability.map(([className, value], index) => ({
                    soilClass: className,
                    probability: value,
                    fill: `hsl(var(--chart-${index + 1}))`,
                }))

                setSoilClasses(formattedData)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchSoilClasses()
    }, [])

    if (loading) return <Loading />
    if (error) return <p>Error: {error}</p>

    const chartConfig = {
        probability: {
            label: "Probability (%)",
        },
        soilClass: {
            label: "Soil Class",
        },
    }

    return (
        <Card className="bg-green-500/20 backdrop-blur-md font-primary">
            <CardHeader>
                <CardTitle>Top 10 Soil Classes</CardTitle>
                <CardDescription>Based on probability ranking</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={soilClasses}
                            layout="vertical"
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 20,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="soilClass"
                                type="category"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tick={({ x, y, payload }) => (
                                    <text x={x - 10} y={y} textAnchor="end" fill="var(--text-color)">
                                        {payload.value}
                                    </text>
                                )}
                            />
                            <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Bar dataKey="probability" layout="vertical" radius={5} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none">
                    Insights based on SoilGrids data
                </div>
                <div className="leading-none text-muted-foreground">
                    top 10 soil classes at the location ranked by probability.
                </div>
            </CardFooter>
        </Card>
    )
}

export default TopSoilClassChart
