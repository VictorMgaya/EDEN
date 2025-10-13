import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

interface UsageRecord {
  action: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
  metadata?: {
    type?: string;
    reason?: string;
    subscription?: string;
    sessionId?: string;
    locationData?: Record<string, unknown>;
    analysisData?: Record<string, unknown>;
  };
}

interface SessionData {
  id: string;
  startTime: string;
  records: UsageRecord[];
  locationData?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to continue." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get analysis sessions from usage history
    const analysisSessions = user.usageHistory?.filter(
      (record: UsageRecord) => record.metadata?.type === 'initial_analysis' || record.metadata?.type === 'follow_up_message'
    ) || [];

    // Group sessions by conversation (initial analysis + follow-ups)
    const sessionsMap = new Map<string, SessionData>();
    let sessionCounter = 1;

    analysisSessions.forEach((record: UsageRecord) => {
      const recordSessionId = record.metadata?.sessionId || `session_${sessionCounter++}`;
      if (!sessionsMap.has(recordSessionId)) {
        sessionsMap.set(recordSessionId, {
          id: recordSessionId,
          startTime: record.timestamp,
          records: []
        });
      }
      sessionsMap.get(recordSessionId)!.records.push(record);
    });

    const sessions = Array.from(sessionsMap.values())
      .sort((a: SessionData, b: SessionData) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(skip, skip + limit);

    // Add location data if available
    const sessionsWithLocation = await Promise.all(
      sessions.map(async (session: SessionData) => {
        const initialRecord = session.records.find((r: UsageRecord) => r.metadata?.type === 'initial_analysis');
        if (initialRecord?.metadata?.locationData) {
          session.locationData = initialRecord.metadata.locationData;
        }
        return session;
      })
    );

    const totalSessions = sessionsMap.size;
    const totalPages = Math.ceil(totalSessions / limit);

    return NextResponse.json({
      sessions: sessionsWithLocation,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalSessions,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to continue." },
        { status: 401 }
      );
    }

    const { locationData, analysisData, sessionId } = await request.json();

    if (!locationData || !analysisData) {
      return NextResponse.json(
        { error: "Location data and analysis data are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create or update session record
    const sessionRecord = {
      action: 'debit',
      amount: 12, // Initial analysis cost
      description: `Analysis session: ${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`,
      timestamp: new Date().toISOString(),
      metadata: {
        type: 'initial_analysis',
        sessionId: sessionId || `session_${Date.now()}`,
        locationData: locationData,
        analysisData: analysisData
      }
    };

    if (!user.usageHistory) {
      user.usageHistory = [];
    }

    user.usageHistory.unshift(sessionRecord);

    // Keep only last 1000 records
    if (user.usageHistory.length > 1000) {
      user.usageHistory = user.usageHistory.slice(0, 1000);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      sessionId: sessionRecord.metadata.sessionId
    });

  } catch (error) {
    console.error("Error saving session:", error);
    return NextResponse.json(
      { error: "Failed to save session" },
      { status: 500 }
    );
  }
}
