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
import { useRouter } from "next/navigation";

export default function SoilClassChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSoilData = async (longitude, latitude) => {
    try {
      const response = await fetch(
        `https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${longitude}&lat=${latitude}&number_classes=5`
      );
      const data = await response.json();
      const formattedData = data.wrb_class_probability.map(([className, value]) => ({
        soilClass: className,
        probability: value,
        fill: "hsl(var(--chart-" + Math.floor(Math.random() * 5 + 1) + "))",
      }));
      setChartData(formattedData);
    } catch (error) {
      console.error("Failed to fetch soil data:", error);
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  if (!router.isReady) return; // Ensure the router is ready
  const { lon, lat } = router.query;
  if (lon && lat) {
    fetchSoilData(lon, lat);
  } else {
    setLoading(false); // Avoid infinite loading if lon and lat are missing
  }
}, [router.isReady, router.query]);

  const chartConfig = {
    probability: {
      label: "Probability",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Soil Class Rankings</CardTitle>
        <CardDescription>Probability distribution of soil classes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
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
              <Bar dataKey="probability" layout="vertical" radius={5} />
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
