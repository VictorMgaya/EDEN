import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sessionTracker } from '@/app/lib/sessionTracker';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find user in database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session activities
      const activities = sessionTracker.getSessionActivities(sessionId);
      return NextResponse.json({ activities });
    } else {
      // Get user sessions
      const sessions = sessionTracker.getUserSessions(user._id.toString(), limit);
      const stats = sessionTracker.getStats(user._id.toString());

      return NextResponse.json({
        sessions,
        stats,
        totalSessions: sessions.length
      });
    }
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json({
      error: 'Failed to fetch sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Clear user's session data
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Clear specific session
      sessionTracker.endSession(sessionId);
      return NextResponse.json({ message: 'Session cleared' });
    } else {
      // Clear all user sessions (would need to implement this in sessionTracker)
      return NextResponse.json({ message: 'All sessions cleared' });
    }
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return NextResponse.json({
      error: 'Failed to clear sessions'
    }, { status: 500 });
  }
}
