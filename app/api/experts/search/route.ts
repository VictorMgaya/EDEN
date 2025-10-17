import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';
import { ExpertSearchQuery } from '@/app/types/expert';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';

    const query: ExpertSearchQuery = { isExpert: true };
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { expertSpecialty: { $regex: q, $options: 'i' } },
      ];
    }

    const experts = await User.find(query).limit(20).select('name expertTitle expertSpecialty expertPricePerMessage').lean();
    return NextResponse.json({ success: true, experts });
  } catch (err) {
    console.error('Error searching experts', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
