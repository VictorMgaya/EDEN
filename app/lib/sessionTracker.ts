// Session tracking system for user activities
interface UserActivity {
  id: string;
  userId: string;
  sessionId: string;
  url: string;
  page: string;
  timestamp: Date;
  metadata?: {
    referrer?: string;
    userAgent?: string;
    ip?: string;
    duration?: number;
    actions?: string[];
  };
}

interface UserSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  activities: UserActivity[];
  metadata?: {
    device?: string;
    browser?: string;
    totalDuration?: number;
    pagesVisited?: number;
  };
}

class SessionTracker {
  private sessions: Map<string, UserSession> = new Map();
  private activities: Map<string, UserActivity[]> = new Map();
  private maxSessionsPerUser: number = 50;
  private maxActivitiesPerSession: number = 100;

  // Track user activity
  trackActivity(
    userId: string,
    sessionId: string,
    url: string,
    metadata?: UserActivity['metadata']
  ): void {
    const activityId = `${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const activity: UserActivity = {
      id: activityId,
      userId,
      sessionId,
      url,
      page: this.extractPageFromUrl(url),
      timestamp: new Date(),
      metadata,
    };

    // Add to session
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        userId,
        startTime: new Date(),
        activities: [],
      });
    }

    const session = this.sessions.get(sessionId)!;
    session.activities.push(activity);

    // Limit activities per session
    if (session.activities.length > this.maxActivitiesPerSession) {
      session.activities = session.activities.slice(-this.maxActivitiesPerSession);
    }

    // Track activities by user
    if (!this.activities.has(userId)) {
      this.activities.set(userId, []);
    }

    const userActivities = this.activities.get(userId)!;
    userActivities.push(activity);

    // Limit total activities per user
    if (userActivities.length > this.maxSessionsPerUser * this.maxActivitiesPerSession) {
      userActivities.splice(0, userActivities.length - (this.maxSessionsPerUser * this.maxActivitiesPerSession));
    }

    console.log(`📊 [SESSION] Tracked activity: ${activity.page} for user ${userId}`);
  }

  // End session
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = new Date();
      session.metadata = {
        ...session.metadata,
        totalDuration: session.endTime.getTime() - session.startTime.getTime(),
        pagesVisited: session.activities.length,
      };

      console.log(`🏁 [SESSION] Ended session ${sessionId} with ${session.activities.length} activities`);
    }
  }

  // Get user sessions
  getUserSessions(userId: string, limit: number = 20): UserSession[] {
    const userActivities = this.activities.get(userId) || [];
    const sessionMap = new Map<string, UserSession>();

    // Group activities by session
    userActivities.forEach(activity => {
      if (!sessionMap.has(activity.sessionId)) {
        const session = this.sessions.get(activity.sessionId);
        if (session) {
          sessionMap.set(activity.sessionId, { ...session });
        }
      }
    });

    return Array.from(sessionMap.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  // Get session activities
  getSessionActivities(sessionId: string): UserActivity[] {
    const session = this.sessions.get(sessionId);
    return session ? session.activities : [];
  }

  // Get recent activities for user
  getRecentActivities(userId: string, limit: number = 50): UserActivity[] {
    const userActivities = this.activities.get(userId) || [];
    return userActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Clean up old sessions (call this periodically)
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 hours default
    const cutoff = new Date(Date.now() - maxAge);

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.startTime < cutoff) {
        this.sessions.delete(sessionId);
      }
    }

    for (const [userId, activities] of this.activities.entries()) {
      const filteredActivities = activities.filter(a => a.timestamp >= cutoff);
      if (filteredActivities.length === 0) {
        this.activities.delete(userId);
      } else {
        this.activities.set(userId, filteredActivities);
      }
    }

    console.log(`🧹 [SESSION] Cleaned up old sessions and activities`);
  }

  // Extract page name from URL
  private extractPageFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (pathParts.length === 0) return 'home';
      if (pathParts[0] === 'dashboard') return 'dashboard';
      if (pathParts[0] === 'analytics') return 'analytics';
      if (pathParts[0] === 'purchase') return 'purchase';
      if (pathParts[0] === 'auth') return 'auth';

      return pathParts[0] || 'home';
    } catch {
      return 'unknown';
    }
  }

  // Get statistics
  getStats(userId?: string): {
    totalSessions: number;
    totalActivities: number;
    activeSessions: number;
    averageSessionDuration: number;
  } {
    let sessions = Array.from(this.sessions.values());
    let activities = Array.from(this.activities.values()).flat();

    if (userId) {
      sessions = sessions.filter(s => s.userId === userId);
      activities = activities.filter(a => a.userId === userId);
    }

    const completedSessions = sessions.filter(s => s.endTime);
    const averageDuration = completedSessions.length > 0
      ? completedSessions.reduce((acc, s) => {
          const duration = s.endTime!.getTime() - s.startTime.getTime();
          return acc + duration;
        }, 0) / completedSessions.length
      : 0;

    return {
      totalSessions: sessions.length,
      totalActivities: activities.length,
      activeSessions: sessions.filter(s => !s.endTime).length,
      averageSessionDuration: averageDuration,
    };
  }
}

// Export singleton instance
export const sessionTracker = new SessionTracker();
export type { UserActivity, UserSession };
