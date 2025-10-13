import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

export async function GET() {
    try {
        await dbConnect();
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all available experts (both AI and Person)
        const experts = await User.find({
            isExpert: true,
            expertAvailability: true
        }).select('name email image expertType expertTitle expertSpecialty expertPricePerMessage expertRating expertTotalConsultations');

        // Separate AI and Person experts
        const aiExperts = experts.filter((expert: { expertType: string }) => expert.expertType === 'ai');
        const personExperts = experts.filter((expert: { expertType: string }) => expert.expertType === 'person');

        return NextResponse.json({
            success: true,
            experts: {
                ai: aiExperts,
                person: personExperts
            }
        });

    } catch (error) {
        console.error('Error fetching experts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
