import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const expertData = await request.json();

        // Validate required fields
        if (!expertData.name || !expertData.email || !expertData.expertType) {
            return NextResponse.json({
                error: 'Name, email, and expert type are required'
            }, { status: 400 });
        }

        // Check if expert already exists
        const existingExpert = await User.findOne({ email: expertData.email });
        if (existingExpert) {
            return NextResponse.json({
                error: 'Expert with this email already exists'
            }, { status: 409 });
        }

        // Create the expert
        const expert = new User({
            ...expertData,
            isExpert: true,
            expertAvailability: expertData.expertAvailability ?? true,
            expertPricePerMessage: expertData.expertPricePerMessage || 10,
            expertRating: expertData.expertRating || 4.5,
            expertTotalConsultations: 0
        });

        await expert.save();

        return NextResponse.json({
            success: true,
            expert: {
                _id: expert._id,
                name: expert.name,
                email: expert.email,
                expertType: expert.expertType,
                expertTitle: expert.expertTitle,
                expertSpecialty: expert.expertSpecialty,
                expertPricePerMessage: expert.expertPricePerMessage,
                expertRating: expert.expertRating,
                expertAvailability: expert.expertAvailability
            }
        });

    } catch (error) {
        console.error('Error creating expert:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
