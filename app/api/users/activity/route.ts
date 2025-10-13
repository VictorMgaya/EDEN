import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sessionTracker } from '@/app/lib/sessionTracker';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { sessionId, url, action, details, metadata } = body;

    if (!sessionId || !url) {
      return NextResponse.json({ error: 'Session ID and URL are required' }, { status: 400 });
    }

    // Track the activity
    sessionTracker.trackActivity(user._id.toString(), sessionId, url, metadata);

    // If it's a custom action, add it to metadata
    if (action) {
      const activityMetadata = {
        ...metadata,
        actions: metadata?.actions ? [...metadata.actions, action] : [action],
        customAction: action,
        actionDetails: details,
      };

      sessionTracker.trackActivity(user._id.toString(), sessionId, url, activityMetadata);
    }

    return NextResponse.json({
      success: true,
      message: 'Activity tracked successfully',
      sessionId,
      activity: action || 'page_view'
    });

  } catch (error) {
    console.error('Error tracking activity:', error);
    return NextResponse.json({
      error: 'Failed to track activity',
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

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // End the session
    sessionTracker.endSession(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session ended successfully',
      sessionId
    });

  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json({
      error: 'Failed to end session'
    }, { status: 500 });
  }
}
