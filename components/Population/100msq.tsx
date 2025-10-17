/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from "react";
import { saveCache, loadCache } from '@/utils/dataCache/cacheUtils';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Types
interface PopulationHistoryItem {
  year: number;
  population: number;
  density: number;
  raw: unknown;
  growthRate: number;
}

interface AgeGroup {
  class: string;
  age: string;
  male: number;
  female: number;
}

interface AgeGenderDataResult {
  ageData: AgeGroup[];
  year: number;
  raw: unknown;
}

interface PopulationDataResult {
  year: number;
  population: number;
  density: number;
  raw: unknown;
}

interface StatsApiResponse {
  status: string;
  data?: {
    total_population?: number;
    agesexpyramid?: AgeGroup[];
  };
  taskid?: string;
  error?: boolean;
  error_message?: string;
}

interface TaskApiResponse {
  status: string;
  data?: {
    total_population?: number;
    agesexpyramid?: AgeGroup[];
  };
  error?: boolean;
  error_message?: string;
}

interface ReverseGeocodeResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  [key: string]: unknown;
}

// Constants
const API_BASE = "https://api.worldpop.org/v1";
const AVAILABLE_YEARS = [2000, 2005, 2010, 2015, 2020];

const PopulationDetailsComponent = (props: { onLoaded: unknown; }) => {
  // State
  const [populationHistory, setPopulationHistory] = useState<PopulationHistoryItem[]>([]);
  const [ageGenderData, setAgeGenderData] = useState<AgeGenderDataResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number | null; lon: number | null }>({ lat: null, lon: null });
  const [locationName, setLocationName] = useState("Loading...");
        
  // Notify parent when loaded
  useEffect(() => {
    if (!loading && !error && typeof props.onLoaded === 'function') {
      props.onLoaded();
    }
  }, [loading, error, props.onLoaded]);

  // Helper functions
  const buildGeoJsonFeatureCollection = (lat: number, lon: number, sizeKm = 1.0) => {
    const d = sizeKm / 111;
    return {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [[
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

  const getPopulationData = async (
    lat: number,
    lon: number,
    year: number,
    dataset: 'wpgppop' | 'wpgpas' = 'wpgppop',
    sizeKm: number = 1.0
  ): Promise<PopulationDataResult | AgeGenderDataResult | null> => {
    const geojson = buildGeoJsonFeatureCollection(lat, lon, sizeKm);

    try {
      const syncUrl = `${API_BASE}/services/stats?dataset=${dataset}&year=${year}&geojson=${encodeURIComponent(JSON.stringify(geojson))}&runasync=false`;
      const response = await fetch(syncUrl);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result: StatsApiResponse = await response.json();

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

      if (result.taskid) {
        const taskUrl = `${API_BASE}/tasks/${result.taskid}`;
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 2000));

          const taskResponse = await fetch(taskUrl);
          const taskResult: TaskApiResponse = await taskResponse.json();

          if (taskResult.status === "finished" && !taskResult.error) {
            const area = sizeKm * sizeKm;

            if (dataset === 'wpgppop' && taskResult.data?.total_population !== undefined) {
              return {
                year,
                population: taskResult.data.total_population,
                density: taskResult.data.total_population / area,
                raw: taskResult
              };
            }

            if (dataset === 'wpgpas' && taskResult.data?.agesexpyramid) {
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
    } catch (err: unknown) {
      console.warn(
        `Failed to fetch data for year ${year}:`,
        err instanceof Error ? err.message : err
      );
      return null;
    }
    return null;
  };

  const getLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      const data: ReverseGeocodeResponse = await response.json();
      return data.city || data.locality || data.principalSubdivision || "Unknown Location";
    } catch {
      return "Unknown Location";
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(Math.round(num || 0));

  // Data fetching
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = parseFloat(urlParams.get("lat") ?? "");
    const lon = parseFloat(urlParams.get("lon") ?? "");

    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      setError("Valid latitude and longitude parameters are required");
      setLoading(false);
      return;
    }

    setCoordinates({ lat, lon });
    getLocationName(lat, lon).then(setLocationName);

    // Try to load from cache first
    const cacheKey = `population_${lat}_${lon}`;
    const cached = loadCache(cacheKey);
    if (cached) {
      setPopulationHistory(cached.populationHistory || []);
      setAgeGenderData(cached.ageGenderData || null);
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const populationPromises = AVAILABLE_YEARS.map(year => 
          getPopulationData(lat, lon, year, 'wpgppop', 1.0)
        );
        
        const populationResults = await Promise.all(populationPromises);
        const validPopulationData = populationResults.filter(
          (result): result is PopulationDataResult => result !== null && 'population' in result
        );
        
        if (validPopulationData.length === 0) {
          throw new Error("No population data available for any year");
        }
        
        const historyWithGrowth = validPopulationData.map((data, index) => {
          if (index === 0) {
            return { ...data, growthRate: 0 };
          }
          
          const prevData = validPopulationData[index - 1];
          const yearDiff = data.year - prevData.year;
          const growthRate = yearDiff > 0 ? 
            ((data.population - prevData.population) / prevData.population) * 100 / yearDiff * 5 : 0;
          
          return { ...data, growthRate };
        });
        
        setPopulationHistory(historyWithGrowth);
        
        const latestYear = Math.max(...validPopulationData.map(d => d.year));
        const ageData = await getPopulationData(lat, lon, latestYear, 'wpgpas', 1.0);
        if (ageData && 'ageData' in ageData) setAgeGenderData(ageData);

        // Save to cache
        saveCache(cacheKey, {
          populationHistory: historyWithGrowth,
          ageGenderData: ageData && 'ageData' in ageData ? ageData : null
        });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Chart configurations using CSS variables
  const genderChartData = ageGenderData ? [
    { 
      gender: "Male", 
      population: ageGenderData.ageData.reduce((sum, group) => sum + group.male, 0),
      fill: "hsl(var(--chart-1))"
    },
    { 
      gender: "Female", 
      population: ageGenderData.ageData.reduce((sum, group) => sum + group.female, 0),
      fill: "hsl(var(--chart-2))"
    }
  ] : [];

  const genderChartConfig = {
    population: { label: "Population" },
    Male: { label: "Male", color: "hsl(var(--chart-1))" },
    Female: { label: "Female", color: "hsl(var(--chart-2))" }
  } satisfies ChartConfig;

  const growthChartData = populationHistory.slice(1).map(data => ({
    year: data.year.toString(),
    growth: parseFloat(data.growthRate.toFixed(1))
  }));

  const growthChartConfig = {
    growth: { 
      label: "Growth Rate",
      color: "hsl(var(--chart-1))"
    }
  } satisfies ChartConfig;

  const ageDistributionData = ageGenderData ? [
    { 
      ageGroup: "0-14", 
      population: ageGenderData.ageData.filter(g => parseInt(g.class) <= 10).reduce((sum, g) => sum + g.male + g.female, 0),
      fill: "hsl(var(--chart-1))"
    },
    { 
      ageGroup: "15-24", 
      population: ageGenderData.ageData.filter(g => parseInt(g.class) >= 15 && parseInt(g.class) <= 20).reduce((sum, g) => sum + g.male + g.female, 0),
      fill: "hsl(var(--chart-2))"
    },
    { 
      ageGroup: "25-54", 
      population: ageGenderData.ageData.filter(g => parseInt(g.class) >= 25 && parseInt(g.class) <= 50).reduce((sum, g) => sum + g.male + g.female, 0),
      fill: "hsl(var(--chart-3))"
    },
    { 
      ageGroup: "55-64", 
      population: ageGenderData.ageData.filter(g => parseInt(g.class) >= 55 && parseInt(g.class) <= 60).reduce((sum, g) => sum + g.male + g.female, 0),
      fill: "hsl(var(--chart-4))"
    },
    { 
      ageGroup: "65+", 
      population: ageGenderData.ageData.filter(g => parseInt(g.class) >= 65).reduce((sum, g) => sum + g.male + g.female, 0),
      fill: "hsl(var(--chart-5))"
    }
  ] : [];

  const ageChartConfig = {
    population: { 
      label: "Population",
      color: "hsl(var(--chart-1))"
    }
  } satisfies ChartConfig;

  // Loading state
  if (loading) return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              <h2 className="text-2xl font-bold">Loading Population Data</h2>
              <p className="text-muted-foreground">Analyzing demographic trends...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Error state
  if (error) return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold">Data Loading Error</h2>
              <p className="text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const latestData = populationHistory[populationHistory.length - 1];
  const totalMale = genderChartData[0]?.population || 0;
  const totalFemale = genderChartData[1]?.population || 0;
  const totalAgePopulation = totalMale + totalFemale;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl sm:text-4xl">Population Analysis</CardTitle>
            <CardDescription className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-primary/10 text-primary">
                📍 {locationName}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-secondary text-secondary-foreground">
                🗓️ {AVAILABLE_YEARS[0]} - {AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Current Stats Grid */}
        {latestData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-2xl sm:text-3xl font-bold">
                  {formatNumber(latestData.population)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Current Population</div>
                <div className="text-xs text-muted-foreground">{latestData.year}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-2xl sm:text-3xl font-bold">
                  {formatNumber(latestData.density)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Density (per km²)</div>
                <div className="text-xs text-muted-foreground">
                  {latestData.density < 100 ? 'Rural' : 
                   latestData.density < 1000 ? 'Suburban' : 
                   latestData.density < 5000 ? 'Urban' : 'Dense Urban'}
                </div>
              </CardContent>
            </Card>

            {totalAgePopulation > 0 && (
              <>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl mb-2">👨</div>
                    <div className="text-2xl sm:text-3xl font-bold text-[hsl(var(--chart-1))]">
                      {((totalMale / totalAgePopulation) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Male Population</div>
                    <div className="text-xs text-muted-foreground">{formatNumber(totalMale)} people</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl mb-2">👩</div>
                    <div className="text-2xl sm:text-3xl font-bold text-[hsl(var(--chart-2))]">
                      {((totalFemale / totalAgePopulation) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Female Population</div>
                    <div className="text-xs text-muted-foreground">{formatNumber(totalFemale)} people</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Gender Distribution Chart */}
          {genderChartData.length > 0 && (
            <Card className="flex flex-col">
              <CardHeader className="items-center pb-0">
                <CardTitle>Gender Distribution</CardTitle>
                <CardDescription>Male vs Female Population</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-0 pt-6">
                <ChartContainer
                  config={genderChartConfig}
                  className="mx-auto aspect-square max-h-[280px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent 
                        hideLabel 
                        formatter={(value) => formatNumber(value as number)}
                      />}
                    />
                    <Pie
                      data={genderChartData}
                      dataKey="population"
                      nameKey="gender"
                      innerRadius={50}
                      outerRadius={90}
                      strokeWidth={2}
                      paddingAngle={2}
                    >
                      <LabelList
                        dataKey="gender"
                        className="fill-background"
                        stroke="none"
                        fontSize={16}
                        fontWeight="700"
                        formatter={(value: string) => value === "Male" ? "👨" : "👩"}
                        position="inside"
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col gap-3 text-sm pt-4">
                <div className="flex items-center justify-center gap-4 w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-1))]"></div>
                    <span className="text-xs">👨 Male: {formatNumber(totalMale)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]"></div>
                    <span className="text-xs">👩 Female: {formatNumber(totalFemale)}</span>
                  </div>
                </div>
                <div className="leading-none text-muted-foreground text-center">
                  Total: {formatNumber(totalAgePopulation)} people
                </div>
              </CardFooter>
            </Card>
          )}

          {/* Population Growth Chart */}
          {growthChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Population Growth</CardTitle>
                <CardDescription>5-Year Growth Rate (%)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={growthChartConfig}>
                  <BarChart
                    accessibilityLayer
                    data={growthChartData}
                    margin={{ top: 20, right: 12, left: 12, bottom: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="year"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="growth" radius={8}>
                      <LabelList
                        position="top"
                        offset={12}
                        className="fill-foreground"
                        fontSize={12}
                        formatter={(value: number) => `${value}%`}
                      />
                      {growthChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.growth >= 0 ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="leading-none text-muted-foreground">
                  Showing growth trends over time
                </div>
              </CardFooter>
            </Card>
          )}

          {/* Age Distribution Chart */}
          {ageDistributionData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>Population by Age Group</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={ageChartConfig}>
                  <BarChart
                    accessibilityLayer
                    data={ageDistributionData}
                    margin={{ top: 20, right: 12, left: 12, bottom: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="ageGroup"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="population" radius={8}>
                      {ageDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="leading-none text-muted-foreground">
                  Distribution across age groups
                </div>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Footer */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span>🌍</span> Location Data
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-mono">
                      {coordinates.lat?.toFixed(4)}°, {coordinates.lon?.toFixed(4)}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Analysis Area:</span>
                    <span>1km²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Period:</span>
                    <span>2000-2020</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span>📊</span> Data Source
                </h4>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dataset:</span>
                    <span>WorldPop Global</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution:</span>
                    <span>100m grid</span>
                  </div>
                  <div className="mt-3">
                    <a 
                      href="https://www.worldpop.org" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline"
                    >
                      Visit WorldPop.org →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default PopulationDetailsComponent;