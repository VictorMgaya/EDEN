'use client';

import React, { useEffect, useState } from 'react';
import { getCachedOverview } from '@/utils/dataCache/analyticsCache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, MapPin, Users, Cloud, Sprout, BarChart3, Calendar } from 'lucide-react';

const AnalyticsDataVisualization = () => {
  const [overview, setOverview] = useState({});
  const [textSummary, setTextSummary] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat') || '';
    const lon = params.get('lon') || '';
    if (!lat || !lon) return;

    const data = getCachedOverview(lat, lon);
    setOverview(data);

    // Extract detailed text summary from cached data
    const summary = extractDetailedTextSummary(data);
    setTextSummary(summary);
  }, []);

  const extractDetailedTextSummary = (data) => {
    const summaryItems = [];

    Object.entries(data).forEach(([key, value]) => {
      const heading = key.replace(/([A-Z_])/g, ' $1').trim().replace(/_/g, ' ');
      const capitalizedHeading = heading.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      let content = '';
      let icon = BarChart3;
      let badgeVariant = 'default';

      // Handle weather data
      if (Array.isArray(value) && value[0]?.weather) {
        icon = Cloud;
        badgeVariant = 'secondary';
        const weatherDetails = value.map((day, index) => {
          const date = new Date(day.dt * 1000).toLocaleDateString();
          const temp = day.main?.temp?.toFixed(1);
          const humidity = day.main?.humidity;
          const condition = day.weather?.[0]?.description || 'N/A';
          const windSpeed = day.main?.wind?.speed || day.wind?.speed || 'N/A';
          return `Day ${index + 1} (${date}): ${temp}°C, ${condition}, Humidity: ${humidity}%, Wind: ${windSpeed} m/s`;
        }).join('\n');
        content = weatherDetails;
      }
      // Handle population data
      else if (value?.populationHistory && value?.ageGenderData) {
        icon = Users;
        badgeVariant = 'destructive';
        let popText = 'Population History:\n';
        value.populationHistory.forEach(year => {
          popText += `  ${year.year}: ${year.population} people/100m², Density: ${year.density}, Growth Rate: ${year.growthRate.toFixed(2)}%\n`;
        });

        popText += '\nAge & Gender Distribution (Year ' + value.ageGenderData.year + '):\n';
        value.ageGenderData.ageData.forEach(age => {
          popText += `  ${age.age}: Male ${age.male}, Female ${age.female}\n`;
        });
        content = popText;
      }
      // Handle soil classification array
      else if (Array.isArray(value) && value[0]?.soilClass) {
        icon = Sprout;
        badgeVariant = 'success';
        const soilText = value.map(soil => 
          `${soil.soilClass}: ${soil.probability}% probability`
        ).join('\n');
        content = soilText;
      }
      // Handle soil properties array
      else if (Array.isArray(value) && value[0]?.name && value[0]?.depths) {
        icon = Sprout;
        badgeVariant = 'success';
        let propsText = '';
        value.forEach(prop => {
          propsText += `\n${prop.name.toUpperCase()} (${prop.unit}):\n`;
          prop.depths.forEach(depth => {
            propsText += `  ${depth.depth}: Mean ${depth.mean}, Q05 ${depth.q05}, Q95 ${depth.q95}\n`;
          });
        });
        content = propsText;
      }
      // Handle location data
      else if (key.toLowerCase().includes('location')) {
        icon = MapPin;
        badgeVariant = 'outline';
        content = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      }
      // Generic array
      else if (Array.isArray(value)) {
        content = JSON.stringify(value, null, 2);
      }
      // Generic object
      else if (typeof value === 'object' && value !== null) {
        content = JSON.stringify(value, null, 2);
      }
      // Primitive values
      else {
        content = String(value);
      }

      summaryItems.push({ 
        heading: capitalizedHeading, 
        content,
        icon,
        badgeVariant,
        key
      });
    });

    return summaryItems;
  };

  const exportData = () => {
    const dataStr = JSON.stringify(overview, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-data-${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (key) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('weather')) return Cloud;
    if (keyLower.includes('population')) return Users;
    if (keyLower.includes('soil')) return Sprout;
    if (keyLower.includes('location')) return MapPin;
    return BarChart3;
  };

  const getCategoryColor = (key) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('weather')) return 'text-blue-500';
    if (keyLower.includes('population')) return 'text-red-500';
    if (keyLower.includes('soil')) return 'text-green-500';
    if (keyLower.includes('location')) return 'text-purple-500';
    return 'text-gray-500';
  };

  if (textSummary.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/20 pt-16">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                No Analytics Data Available
              </CardTitle>
              <CardDescription className="text-lg">
                Please analyze a location first to view the data summary.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => window.history.back()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Back to Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/20 pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <Card className="max-w-7xl mx-auto mb-8 border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-left">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Analytics Summary
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                  Complete location analysis data and insights
                </CardDescription>
              </div>
              <Button 
                onClick={exportData}
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-1 rounded-2xl border border-blue-200 dark:border-blue-800">
            <TabsTrigger 
              value="summary" 
              className="rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Detailed Summary
            </TabsTrigger>
            <TabsTrigger 
              value="raw" 
              className="rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Raw Data View
            </TabsTrigger>
          </TabsList>

          {/* Detailed Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {textSummary.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card 
                    key={index} 
                    className="group hover:shadow-lg transition-all duration-300 border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-600 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 ${getCategoryColor(item.key)}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {item.heading}
                          </CardTitle>
                        </div>
                        <Badge variant={item.badgeVariant} className="text-xs">
                          {item.key.split(/(?=[A-Z])/).length} items
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-sans max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        {item.content}
                      </pre>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Raw Data Tab */}
          <TabsContent value="raw">
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Raw Analytics Data
                </CardTitle>
                <CardDescription>
                  Complete JSON representation of all cached analytics data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="text-sm text-green-400 font-mono">
                    {JSON.stringify(overview, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Stats Bar */}
        <Card className="max-w-7xl mx-auto mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex flex-wrap justify-center gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {textSummary.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Data Categories</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Object.keys(overview).reduce((acc, key) => {
                    const val = overview[key];
                    return acc + (Array.isArray(val) ? val.length : 1);
                  }, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Data Points</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {new Date().toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Last Updated</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDataVisualization;