import { getServerSession } from 'next-auth';

// Simple helper to return session in production or a dev session in non-prod for local operations
export async function getSessionOrDev() {
  const session = await getServerSession();
  if (session) return session;

  if (process.env.NODE_ENV !== 'production') {
    return {
      user: {
        email: process.env.DEV_USER_EMAIL || 'dev@local',
        id: process.env.DEV_USER_ID || '000000000000000000000000'
      }
    };
  }

  return null;
}
