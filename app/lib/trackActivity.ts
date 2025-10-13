'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface ActivityMetadata {
  referrer?: string;
  userAgent?: string;
  timestamp?: number;
  duration?: number;
  actions?: string[];
}

export function useActivityTracker() {
  const { data: session } = useSession();
  const sessionIdRef = useRef<string>('');
  const lastActivityRef = useRef<number>(Date.now());

  // Generate session ID
  useEffect(() => {
    if (session?.user?.email && !sessionIdRef.current) {
      sessionIdRef.current = `session_${session.user.email}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🎯 [TRACKER] Started tracking session:', sessionIdRef.current);
    }
  }, [session]);

  // Track page views and activities
  useEffect(() => {
    if (!session?.user?.email || !sessionIdRef.current) return;

    const trackPageView = async () => {
      try {
        const currentTime = Date.now();
        const timeSpent = currentTime - lastActivityRef.current;

        // Only track if user spent more than 1 second on previous page
        if (timeSpent > 1000) {
          const metadata: ActivityMetadata = {
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            timestamp: currentTime,
            duration: timeSpent,
          };

          // Send activity to server
          await fetch('/api/users/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
              url: window.location.href,
              metadata,
            }),
          });
        }

        lastActivityRef.current = currentTime;
      } catch (error) {
        console.error('Failed to track activity:', error);
      }
    };

    // Track page view on mount
    trackPageView();

    // Track user interactions
    const handleUserInteraction = () => {
      lastActivityRef.current = Date.now();
    };

    // Add event listeners
    window.addEventListener('beforeunload', trackPageView);
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('scroll', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('beforeunload', trackPageView);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [session]);

  // End session when component unmounts or user logs out
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        // End session on server
        fetch('/api/users/activity', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
          }),
        }).catch(console.error);
      }
    };
  }, []);

  return {
    sessionId: sessionIdRef.current,
    trackCustomActivity: async (action: string, details?: Record<string, unknown>) => {
      if (!session?.user?.email || !sessionIdRef.current) return;

      try {
        await fetch('/api/users/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            action,
            details,
            url: window.location.href,
          }),
        });
      } catch (error) {
        console.error('Failed to track custom activity:', error);
      }
    },
  };
}
