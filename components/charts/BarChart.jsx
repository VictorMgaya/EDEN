// BarChart.jsx

"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { fetchSoilData } from "./SoilData";
import { useRouter } from "next/navigation";

export default function SoilClassChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return; // Ensure the router is ready

    // Parse coordinates as floats
    const { lon, lat } = router.query;

    // Debugging the coordinates
    console.log("Router Query:", lon, lat);

    const longitude = parseFloat(lon);
    const latitude = parseFloat(lat);

    if (!isNaN(longitude) && !isNaN(latitude)) {
      // Fetch soil data
      setLoading(true);
      fetchSoilData(longitude, latitude)
        .then(data => {
          setChartData(data);
          setLoading(false);
        })
        .catch(error => {
          setError(error.message);
          setLoading(false);
        });
    } else {
      setError("Invalid coordinates provided");
      setLoading(false); // Stop loading if coordinates are invalid
    }
  }, [router.isReady, router.query]);

  const chartConfig = {
    probability: {
      label: "Probability",
    },
  };

  return (
    <Card className="bg-green-500/20 backdrop-blur-md font-primary">
      <CardHeader>
        <CardTitle>Soil Class Rankings</CardTitle>
        <CardDescription>Probability distribution of soil classes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 0 }}
            >
              <YAxis
                dataKey="soilClass"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <XAxis dataKey="probability" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              {chartData.map((entry, index) => (
                <Bar
                  key={index}
                  dataKey="probability"
                  layout="vertical"
                  radius={5}
                  fill={entry.highlight ? "hsl(var(--chart-1))" : `hsl(var(--chart-${Math.floor(Math.random() * 5 + 1)}))`} // Highlight the top class
                />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Updated dynamically based on location data <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing top 5 soil classes with probabilities
        </div>
      </CardFooter>
    </Card>
  );
}
