"use client"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { useState, useEffect } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Default chart config
const chartConfig = {
  soilClass: {
    label: "Soil Class",
  },
  probability: {
    label: "Probability",
    color: "hsl(var(--chart-1))",
  },
}

export function BarChartComponent() {
  const [chartData, setChartData] = useState([])
  const [lat, setLat] = useState(null)
  const [lon, setLon] = useState(null)

  useEffect(() => {
    // Request the user's current location
    const requestUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setLat(latitude)
            setLon(longitude)
          },
          (error) => {
            console.error("Error getting location:", error)
          }
        )
      } else {
        console.error("Geolocation is not supported by this browser.")
      }
    }

    requestUserLocation()
  }, [])

  useEffect(() => {
    // Fetch soil classes once the location is available
    if (lat && lon) {
      const fetchSoilClasses = async () => {
        try {
          // Fetch the soil classes from the API
          const response = await fetch(
            `https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${lon}&lat=${lat}&number_classes=5`
          )
          const data = await response.json()

          // Extract soil classes and their probabilities from the response
          const soilClasses = data.wrb_class_probability.map((item) => ({
            browser: item[0], // Soil class name
            visitors: item[1], // Probability
            fill: "var(--color-chrome)", // Default color (can be customized)
          }))

          setChartData(soilClasses)
        } catch (error) {
          console.error("Error fetching soil classes:", error)
        }
      }

      fetchSoilClasses()
    }
  }, [lat, lon])

  return (
    <Card className="bg-green-500/20 backdrop-blur-md font-primary">
      <CardHeader>
        <CardTitle>Soil Classifications</CardTitle>
        <CardDescription>Top Soil Classes and Their Probabilities</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="browser"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => chartConfig[value]?.label}
            />
            <XAxis dataKey="visitors" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="visitors" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing top soil classifications based on location
        </div>
      </CardFooter>
    </Card>
  )
}

export default BarChartComponent
