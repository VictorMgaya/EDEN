import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/app/lib/dbConnect';
import Conversation from '@/app/model/conversation';
import { encryptJSON } from '@/lib/encryption';
import User from '@/app/model/user';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSessionOrDev();
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json();
    const { expertId, isAIExpert = false, dataType, dataSelection, initialMessage } = body;

    if (!dataType) return NextResponse.json({ error: 'dataType is required' }, { status: 400 });

    const conversation = {
      userId: user._id,
      expertId: expertId || null,
      isAIExpert,
      dataType,
      dataSelection: dataSelection || {},
      messages: initialMessage ? [{ sender: 'user', content: initialMessage, timestamp: new Date() }] : []
    };

    const secret = process.env.CONVERSATION_SECRET || process.env.SECRET || 'dev_secret';
    const encrypted = encryptJSON(conversation, `${secret}_${user._id}`);

    const doc = new Conversation({ userId: user._id, payload: encrypted, createdAt: new Date() });
    const res = await doc.save();

    return NextResponse.json({ success: true, conversationId: res._id.toString() });
  } catch (err) {
    console.error('Error creating conversation', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
  const session = await getSessionOrDev();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const conv = await Conversation.findById(id).lean();
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    // Access control: only owner or assigned human expert can fetch
    const isOwner = conv.userId.toString() === user._id.toString();
    const isAssignedExpert = conv.expertId && conv.expertId.toString() === user._id.toString();
    if (!isOwner && !isAssignedExpert) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json({ success: true, conversation: conv });
  } catch (err) {
    console.error('Error fetching conversation', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
async function getSessionOrDev() {
  // In development, return a mock session for testing
  if (process.env.NODE_ENV === 'development' && process.env.MOCK_SESSION === 'true') {
    return {
      user: {
        email: 'dev@example.com',
        id: 'dev-user-id'
      }
    };
  }
  
  // In production or when not mocking, use real session
  return await getServerSession();
}

