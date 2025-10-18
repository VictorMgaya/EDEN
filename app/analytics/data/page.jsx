'use client';

import React, { useEffect, useState } from 'react';
import { getCachedOverview, getAllCachedAnalytics } from '@/utils/dataCache/analyticsCache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, MapPin, Users, Cloud, Sprout, BarChart3, Calendar, Expand, Clock, ArrowLeft, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AnalyticsDataVisualization = () => {
  const [overview, setOverview] = useState({});
  const [textSummary, setTextSummary] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedCards, setExpandedCards] = useState({});
  const [cacheHistory, setCacheHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lon = params.get('lon');

    // Load all cache history
    const allCache = getAllCachedAnalytics();
    setCacheHistory(allCache);

    if (!lat || !lon) {
      setShowHistory(true);
      return;
    }

    // If params exist, load specific location data
    setShowHistory(false);
    const data = getCachedOverview(lat, lon);
    setOverview(data);

    const summary = extractDetailedTextSummary(data);
    setTextSummary(summary);
  }, []);

  const toggleCardExpansion = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCacheItemClick = (cacheItem) => {
    const params = new URLSearchParams();
    params.set('lat', cacheItem.data.scannedLocation.lat);
    params.set('lon', cacheItem.data.scannedLocation.lng);
    router.push(`/analytics/data?${params.toString()}`);
  };

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

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cache History View
  if (showHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/20 pt-16">
        <div className="container mx-auto px-3 py-6"> {/* Reduced padding for mobile */}
          {/* Header */}
          <Card className="max-w-7xl mx-auto mb-6 border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-left">
                  <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Analytics History
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mt-2">
                    Browse your previously analyzed locations
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => router.push('/analytics')}
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Analysis
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Cache History Grid */}
          {cacheHistory.length === 0 ? (
            <Card className="max-w-4xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  No Analysis History
                </CardTitle>
                <CardDescription className="text-base sm:text-lg">
                  Analyze locations to build your history
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={() => router.push('/analytics')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start Analyzing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6"> {/* Reduced gap for mobile */}
              {cacheHistory.map((cache, index) => (
                <Card 
                  key={index}
                  className="border-blue-100 dark:border-blue-900 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
                  onClick={() => handleCacheItemClick(cache)}
                >
                  <CardContent className="p-4 sm:p-6"> {/* Reduced padding for mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500">
                          <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            Location {index + 1}
                          </CardTitle>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-xs sm:text-sm">
                              Lat: {cache.data.scannedLocation.lat.toFixed(4)}
                            </Badge>
                            <Badge variant="outline" className="text-xs sm:text-sm">
                              Lon: {cache.data.scannedLocation.lng.toFixed(4)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs sm:text-sm">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(cache.data.timestamp)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                          {Object.keys(cache.data).length} datasets
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single Location Data View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/20 pt-16">
      <div className="container mx-auto px-3 py-6"> {/* Reduced padding for mobile */}
        {/* Header Section */}
        <Card className="max-w-7xl mx-auto mb-6 border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-left">
                <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Analytics Summary
                </CardTitle>
                <CardDescription className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mt-2">
                  Complete location analysis data and insights
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => setShowHistory(true)}
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  View History
                </Button>
                <Button 
                  onClick={exportData}
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-1 rounded-2xl border border-blue-200 dark:border-blue-800">
            <TabsTrigger 
              value="summary" 
              className="rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200 text-sm sm:text-base"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Detailed Summary
            </TabsTrigger>
            <TabsTrigger 
              value="raw" 
              className="rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200 text-sm sm:text-base"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Raw Data
            </TabsTrigger>
          </TabsList>

          {/* Detailed Summary Tab */}
          <TabsContent value="summary" className="space-y-4 sm:space-y-6"> {/* Reduced space for mobile */}
            <div className="space-y-4 sm:space-y-6">
              {textSummary.map((item, index) => {
                const IconComponent = item.icon;
                const isExpanded = expandedCards[index];
                
                return (
                  <Card 
                    key={index} 
                    className="group hover:shadow-lg transition-all duration-300 border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-600 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                  >
                    <CardContent className="p-4 sm:p-6"> {/* Reduced padding for mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500`}>
                            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                              {item.heading}
                            </CardTitle>
                            <Badge variant={item.badgeVariant} className="mt-1 text-xs sm:text-sm">
                              {item.key.split(/(?=[A-Z])/).length} data points
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCardExpansion(index)}
                          className="flex items-center gap-2 text-xs sm:text-sm"
                        >
                          <Expand className="w-3 h-3 sm:w-4 sm:h-4" />
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </Button>
                      </div>
                      
                      <div className={`bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 sm:p-4 ${isExpanded ? '' : 'max-h-64 sm:max-h-96'} overflow-y-auto`}>
                        <pre className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200">
                          {item.content}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Raw Data Tab */}
          <TabsContent value="raw">
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-blue-200 dark:border-blue-800">
              <CardContent className="p-4 sm:p-6"> {/* Reduced padding for mobile */}
                <div className="bg-gray-900 rounded-xl p-4 sm:p-6 overflow-auto max-h-[500px] sm:max-h-[600px] border border-gray-700">
                  <pre className="text-sm sm:text-base leading-relaxed text-green-400 font-mono">
                    {JSON.stringify(overview, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Stats Bar */}
        <Card className="max-w-7xl mx-auto mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 sm:p-6"> {/* Reduced padding for mobile */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {textSummary.length}
                </div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Data Categories</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                  {Object.keys(overview).reduce((acc, key) => {
                    const val = overview[key];
                    return acc + (Array.isArray(val) ? val.length : 1);
                  }, 0)}
                </div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Data Points</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {new Date().toLocaleDateString()}
                </div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Last Updated</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDataVisualization;