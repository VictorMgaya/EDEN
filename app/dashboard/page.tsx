/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  History,
  Database,
  MessageSquare,
  Eye,
  BarChart3,
  PieChart,
  Clock,
  Target,
  Brain,
  Cpu,
  Shield,
  Award,
  Zap,
  Users,
  CheckCircle,
  Star,
  Sparkles,
  Gem,
  Layers,
  Leaf,
  Cloud,
  MapPin,
  Droplets,
  Wheat,
  Sprout,
  Thermometer,
  Gauge,
  TrendingDown,
  Filter,
  Settings,
  Calendar,
  AlertTriangle,
  Sun,
  FileText,
  Beaker,
  Microscope,
  Calculator,
  Download,
  Upload,
  Workflow,
  Network
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

interface Activity {
  page: string;
  timestamp?: string;
  duration?: number;
  [key: string]: unknown;
}

interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  activities?: Activity[];
  metadata?: {
    totalDuration?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
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
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const loadSessions = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/users/sessions?limit=20');
          if (response.ok) {
            const data = await response.json();
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

    const handleViewSession = (session: Session) => {
      // Store session data for navigation
      localStorage.setItem('selectedSession', JSON.stringify(session));
      console.log('📋 [DASHBOARD] Selected session:', session.id);

      // Navigate to analytics with session context
      router.push('/analytics');
    };

    const handleChatAboutSession = (session: Session) => {
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
            No Sessions Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your browsing sessions will appear here as you navigate the app.
          </p>
          <Button onClick={() => router.push('/analytics')}>
            Start Exploring
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
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    Session {String(session.id || 'unknown').substring(0, 8)}...
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(String(session.startTime || ''))}
                    {session.endTime && ` - ${formatDate(String(session.endTime))}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {session.activities?.length || 0} activities
                </Badge>
                {session.metadata?.totalDuration && (
                  <Badge variant="secondary">
                    {Math.round(session.metadata.totalDuration / 1000)}s
                  </Badge>
                )}
              </div>
            </div>

            {session.activities && session.activities.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Recent pages:
                </div>
                <div className="flex flex-wrap gap-1">
                  {session.activities?.slice(0, 5).map((activity: Activity, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {activity.page || 'unknown'}
                    </Badge>
                  ))}
                  {session.activities && Array.isArray(session.activities) && session.activities.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{session.activities.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewSession(session)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Session
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-200/20 to-indigo-200/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10 py-8">
        {/* New Resource Analysis Engine Header */}
        <div className="mb-12 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Microscope className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Workflow className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              🔬 Resource Analysis Engine
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
              Advanced analytical platform for comprehensive resource assessment, performance optimization, and data-driven decision making
            </p>

            {/* Status Indicators */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 dark:text-green-300">Engine Active</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Gauge className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700 dark:text-blue-300">High Performance</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Beaker className="h-4 w-4 text-purple-600" />
                <span className="text-purple-700 dark:text-purple-300">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Banner */}
        <div className="mb-8 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">🏆 Farming Pioneer</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">You've completed 5 soil analyses this month!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>
              <span className="text-sm text-amber-700 dark:text-amber-300">+150 XP</span>
            </div>
          </div>
          <Progress value={75} className="mt-4 h-2" />
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">750 / 1000 XP to next level</p>
        </div>

        {/* Stats Overview Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="group relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Current Credits</CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Gem className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{userStats.credits}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{userStats.subscription} plan</p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full" style={{width: `${Math.min((userStats.credits / 1000) * 100, 100)}%`}}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {userStats.credits < 100 ? 'Low balance' : userStats.credits < 500 ? 'Getting low' : 'Healthy balance'}
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Spent</CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{userStats.totalSpent}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Credits used</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{width: `${Math.min((userStats.totalSpent / 1000) * 100, 100)}%`}}></div>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {((userStats.totalSpent / (userStats.totalSpent + userStats.credits)) * 100).toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Sessions</CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{userStats.totalSessions}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">AI interactions</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: `${Math.min((userStats.totalSessions / 50) * 100, 100)}%`}}></div>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400">+{Math.floor(Math.random() * 5) + 1}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">This week</p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Efficiency</CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{userStats.avgSessionCost.toFixed(1)}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Avg. cost per session</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{width: `${Math.max(0, 100 - (userStats.avgSessionCost * 10))}%`}}></div>
                  </div>
                  <span className={`text-xs ${userStats.avgSessionCost < 5 ? 'text-green-600 dark:text-green-400' : userStats.avgSessionCost < 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                    {userStats.avgSessionCost < 5 ? 'Excellent' : userStats.avgSessionCost < 10 ? 'Good' : 'Optimize'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analysis Tools Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Beaker className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">Analysis Modules</span>
            <Workflow className="h-5 w-5 text-blue-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="group cursor-pointer bg-gradient-to-br from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border-blue-200/50 transition-all duration-300 hover:scale-105" onClick={() => router.push('/analytics')}>
              <CardContent className="p-4 text-center">
                <Microscope className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Soil Analysis</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400">Comprehensive soil parameter assessment</p>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-200/50 transition-all duration-300 hover:scale-105" onClick={() => router.push('/weather')}>
              <CardContent className="p-4 text-center">
                <Thermometer className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-1">Weather Modeling</h4>
                <p className="text-xs text-purple-600 dark:text-purple-400">Advanced climate impact analysis</p>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border-green-200/50 transition-all duration-300 hover:scale-105" onClick={() => router.push('/Experts')}>
              <CardContent className="p-4 text-center">
                <Brain className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">AI Insights</h4>
                <p className="text-xs text-green-600 dark:text-green-400">Machine learning recommendations</p>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer bg-gradient-to-br from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border-amber-200/50 transition-all duration-300 hover:scale-105" onClick={() => router.push('/dashboard')}>
              <CardContent className="p-4 text-center">
                <Calculator className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Yield Optimization</h4>
                <p className="text-xs text-amber-600 dark:text-amber-400">Predictive modeling & ROI analysis</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 h-14 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Gauge className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Models</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* AI Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                    <Sparkles className="h-5 w-5" />
                    AI Insights & Recommendations
                  </CardTitle>
                  <CardDescription className="text-emerald-700 dark:text-emerald-300">
                    Personalized insights based on your farming activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-emerald-200/30">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Leaf className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">🌾 Optimal Crop Rotation</h4>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                          Based on your soil analysis history, consider rotating to legumes next season to improve nitrogen fixation.
                        </p>
                        <Button size="sm" variant="outline" className="mt-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-blue-200/30">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Droplets className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">💧 Irrigation Optimization</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Your recent analyses show clay-heavy soil. Consider drip irrigation to improve water efficiency by 40%.
                        </p>
                        <Button size="sm" variant="outline" className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200/50 dark:border-amber-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <Award className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-800 dark:text-amber-200">Soil Analyst</h4>
                      <p className="text-xs text-amber-600 dark:text-amber-400">Completed 10 soil analyses</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl opacity-60">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-600 dark:text-slate-400">Weather Expert</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-500">Check weather data 5 days in a row</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl opacity-60">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-600 dark:text-slate-400">Community Helper</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-500">Help 3 other farmers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Your latest AI interactions and analyses</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchDashboardData} className="bg-white/50">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usageHistory && usageHistory.history.length > 0 ? (
                  <div className="space-y-4">
                    {usageHistory.history.slice(0, 6).map((record, index) => (
                      <div key={index} className="group flex items-center justify-between p-4 bg-white/50 dark:bg-slate-700/50 rounded-xl hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-200 border border-white/30">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${getActionColor(record.action)} group-hover:scale-110 transition-transform duration-200`}>
                            {getActionIcon(record.action)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                              {record.description}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {formatDate(record.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={record.action === 'credit' ? 'default' : 'secondary'} className="mb-1">
                            {formatAmount(record.amount, record.action)}
                          </Badge>
                          {record.metadata?.type && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {record.metadata.type.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Ready to Start Farming Smarter?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Begin your journey with AI-powered agricultural insights
                    </p>
                    <Button onClick={() => router.push('/analytics')} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
                      <MapPin className="h-4 w-4 mr-2" />
                      Start Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Usage Analytics
                  </CardTitle>
                  <CardDescription>Your credit usage patterns over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Interactive chart visualization</p>
                      <p className="text-sm">Daily usage trends & patterns</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Activity Distribution
                  </CardTitle>
                  <CardDescription>Breakdown of your farming activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Activity type distribution</p>
                      <p className="text-sm">Soil analysis vs Weather checks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="weather" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/50 dark:border-blue-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Cloud className="h-5 w-5" />
                    Current Weather
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-6xl mb-4">☀️</div>
                    <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">24°C</div>
                    <p className="text-blue-600 dark:text-blue-400">Partly Cloudy</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                      <p className="text-blue-600 dark:text-blue-400">Humidity</p>
                      <p className="font-semibold text-blue-800 dark:text-blue-200">65%</p>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                      <p className="text-blue-600 dark:text-blue-400">Wind</p>
                      <p className="font-semibold text-blue-800 dark:text-blue-200">12 km/h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Leaf className="h-5 w-5" />
                    Farming Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <span className="text-green-700 dark:text-green-300">Today</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🌱</span>
                        <span className="font-semibold text-green-800 dark:text-green-200">Perfect for planting</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <span className="text-orange-700 dark:text-orange-300">Tomorrow</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⚠️</span>
                        <span className="font-semibold text-orange-800 dark:text-orange-200">Consider irrigation</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Analysis Sessions
                    </CardTitle>
                    <CardDescription>Your saved soil and location analyses</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/analytics')} className="bg-white/50">
                    <MapPin className="h-4 w-4 mr-2" />
                    New Analysis
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <SessionHistoryTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Action Cards */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="group cursor-pointer bg-gradient-to-br from-emerald-500/10 to-green-500/10 hover:from-emerald-500/20 hover:to-green-500/20 border-emerald-200/50 transition-all duration-300 hover:scale-105" onClick={() => router.push('/analytics')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">Soil Analysis</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Analyze soil conditions</p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border-blue-200/50 transition-all duration-300 hover:scale-105" onClick={() => router.push('/weather')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Weather</h3>
              <p className="text-xs text-blue-600 dark:text-blue-400">Check forecasts</p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-200/50 transition-all duration-300 hover:scale-105" onClick={() => router.push('/Experts')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-1">AI Expert</h3>
              <p className="text-xs text-purple-600 dark:text-purple-400">Get advice</p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border-amber-200/50 transition-all duration-300 hover:scale-105" onClick={() => router.push('/purchase')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Gem className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Get Credits</h3>
              <p className="text-xs text-amber-600 dark:text-amber-400">Buy more credits</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
