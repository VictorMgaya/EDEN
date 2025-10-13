'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  History,
  MapPin,
  MessageSquare,
  Eye
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UsageRecord {
  action: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
  metadata?: {
    type?: string;
    reason?: string;
    subscription?: string;
  };
}

interface UsageHistory {
  history: UsageRecord[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface SessionData {
  id: string;
  startTime: string;
  records: UsageRecord[];
  locationData?: {
    lat: number;
    lng: number;
    [key: string]: unknown;
  };
}

interface SessionsResponse {
  sessions: SessionData[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface UserStats {
  credits: number;
  subscription: string;
  totalSpent: number;
  totalSessions: number;
  avgSessionCost: number;
  lastActivity: string;
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [usageHistory, setUsageHistory] = useState<UsageHistory | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch current credits
      const creditsResponse = await fetch('/api/users/credits/check');
      let currentCredits = 0;
      let subscription = 'freemium';

      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        currentCredits = creditsData.credits;
        subscription = creditsData.subscription || 'freemium';
      }

      // Fetch usage history
      const historyResponse = await fetch('/api/users/credits/history?page=1&limit=50');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setUsageHistory(historyData);

        // Calculate stats from history with current credits
        calculateUserStats(historyData.history, currentCredits, subscription);
      } else {
        setError('Failed to load usage history');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('An error occurred while loading dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);



  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    fetchDashboardData();
  }, [status, router, fetchDashboardData]);

  const calculateUserStats = (history: UsageRecord[], currentCredits: number, subscription: string) => {
    const debits = history.filter(record => record.action === 'debit');

    const totalSpent = debits.reduce((sum, record) => sum + record.amount, 0);
    const totalSessions = debits.length;
    const avgSessionCost = totalSessions > 0 ? totalSpent / totalSessions : 0;

    setUserStats({
      credits: currentCredits,
      subscription,
      totalSpent,
      totalSessions,
      avgSessionCost,
      lastActivity: history.length > 0 ? history[0].timestamp : 'Never'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, action: string) => {
    const sign = action === 'credit' ? '+' : '-';
    return `${sign}${amount}`;
  };

  const getActionColor = (action: string) => {
    return action === 'credit' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getActionIcon = (action: string) => {
    return action === 'credit' ? (
      <ArrowDownLeft className="h-4 w-4" />
    ) : (
      <ArrowUpRight className="h-4 w-4" />
    );
  };

  // Session History Tab Component
  const SessionHistoryTab = () => {
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const loadSessions = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/users/sessions?page=1&limit=20');
          if (response.ok) {
            const data: SessionsResponse = await response.json();
            setSessions(data.sessions || []);
          }
        } catch (error) {
          console.error('Error loading sessions:', error);
        } finally {
          setLoading(false);
        }
      };

      loadSessions();
    }, []);

    const handleViewAnalysis = (session: SessionData) => {
      if (session.locationData) {
        // Redirect to analytics page with the session's location
        const { lat, lng } = session.locationData;
        router.push(`/analytics?lat=${lat}&lon=${lng}`);
      }
    };

    const handleChatAboutSession = (session: SessionData) => {
      // Store session data for Experts page to reference
      localStorage.setItem('selectedSession', JSON.stringify(session));
      router.push('/Experts');
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading sessions...</span>
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="text-center py-12">
          <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Analysis Sessions
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Start analyzing locations to see your session history here.
          </p>
          <Button onClick={() => router.push('/analytics')}>
            Go to Analytics
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    Analysis Session
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(session.startTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {session.records.length} interactions
                </Badge>
              </div>
            </div>

            {session.locationData && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4" />
                  <span>
                    Location: {session.locationData.lat.toFixed(4)}, {session.locationData.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewAnalysis(session)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChatAboutSession(session)}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Chat About This
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Usage Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your AI expert usage, credits, and activity history
          </p>
        </div>

        {/* Stats Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Credits</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.credits}</div>
                <p className="text-xs text-muted-foreground">
                  {userStats.subscription} plan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.totalSpent}</div>
                <p className="text-xs text-muted-foreground">
                  Credits used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  AI interactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Session Cost</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.avgSessionCost.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Credits per session
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Session History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Usage History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Usage History
                    </CardTitle>
                    <CardDescription>
                      Detailed log of your AI expert interactions and credit transactions
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usageHistory && usageHistory.history.length > 0 ? (
                  <div className="space-y-4">
                    {usageHistory.history.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getActionColor(record.action)}`}>
                            {getActionIcon(record.action)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {record.description}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {formatDate(record.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={record.action === 'credit' ? 'default' : 'secondary'}>
                            {formatAmount(record.amount, record.action)}
                          </Badge>
                          {record.metadata?.type && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {record.metadata.type.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {usageHistory.pagination.totalPages > 1 && (
                      <>
                        <Separator className="my-6" />
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Showing {usageHistory.history.length} of {usageHistory.pagination.totalItems} transactions
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={usageHistory.pagination.currentPage <= 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={usageHistory.pagination.currentPage >= usageHistory.pagination.totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      No Usage History
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Start using the AI expert to see your usage history here.
                    </p>
                    <Button onClick={() => router.push('/Experts')}>
                      Go to AI Expert
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            {/* Session History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Analysis Sessions
                    </CardTitle>
                    <CardDescription>
                      View and revisit your previous location analysis sessions
                    </CardDescription>
                  </div>

                </div>
              </CardHeader>
              <CardContent>
                <SessionHistoryTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/purchase')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Buy Credits
              </CardTitle>
              <CardDescription>
                Purchase more credits to continue using AI features
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/Experts')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI Expert
              </CardTitle>
              <CardDescription>
                Access the AI expert for resource analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/analytics')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>
                View and analyze location-based resource data
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
