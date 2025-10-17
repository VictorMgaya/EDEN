import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSessionOrDev } from '@/app/lib/sessionHelper';

export async function POST(request: NextRequest) {
  try {
  const session = await getSessionOrDev();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { filename = `cache-${Date.now()}.json`, cache } = body;

    if (!cache) return NextResponse.json({ error: 'No cache provided' }, { status: 400 });

    const base = path.resolve(process.cwd(), 'util', 'datacache');
    await fs.mkdir(base, { recursive: true });
    const filePath = path.join(base, filename);
    await fs.writeFile(filePath, JSON.stringify(cache, null, 2), 'utf8');

    return NextResponse.json({ success: true, path: `/util/datacache/${filename}` });
  } catch (err) {
    console.error('Error saving cache file', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
