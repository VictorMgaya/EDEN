import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/app/lib/dbConnect';
import Conversation from '@/app/model/conversation';
import User from '@/app/model/user';

// GET - Get user's conversations
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const expertId = searchParams.get('expertId');
        const type = searchParams.get('type'); // 'ai' or 'person'

        const query: { userId: typeof user._id; expertId?: string; expertType?: string } = { userId: user._id };

        if (expertId) {
            query.expertId = expertId;
        }

        if (type) {
            query.expertType = type;
        }

        const conversations = await Conversation.find(query)
            .populate('expertId', 'name email image expertTitle expertSpecialty')
            .sort({ lastMessageAt: -1 })
            .limit(50);

        return NextResponse.json({
            success: true,
            conversations
        });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create new conversation
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { expertId, expertType, initialMessage } = await request.json();

        if (!expertId || !expertType) {
            return NextResponse.json({ error: 'Expert ID and type are required' }, { status: 400 });
        }

        // Verify expert exists and is available
        const expert = await User.findOne({
            _id: expertId,
            isExpert: true,
            expertAvailability: true
        });

        if (!expert) {
            return NextResponse.json({ error: 'Expert not found or unavailable' }, { status: 404 });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            userId: user._id,
            expertId: expert._id,
            expertType
        });

        if (!conversation) {
            // Create new conversation
            conversation = new Conversation({
                userId: user._id,
                expertId: expert._id,
                expertType,
                conversationType: expertType === 'ai' ? 'chatgpt_style' : 'whatsapp_style',
                messages: []
            });

            if (initialMessage) {
                conversation.messages.push({
                    senderId: user._id,
                    senderType: 'user',
                    content: initialMessage,
                    timestamp: new Date()
                });
            }

            await conversation.save();
        }

        // Populate expert details
        await conversation.populate('expertId', 'name email image expertTitle expertSpecialty');

        return NextResponse.json({
            success: true,
            conversation
        });

    } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
