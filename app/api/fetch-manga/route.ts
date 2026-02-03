import { NextResponse } from 'next/server';
import { buildManhuaDataEntry } from '@/lib/api/fetch-and-save';

/**
 * API route to fetch manga data and return JSON to save
 * Visit: http://localhost:3001/api/fetch-manga?title=Top%20Tier%20Providence&slug=top-tier-providence&type=manhua
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Top Tier Providence';
  const slug = searchParams.get('slug') || 'top-tier-providence';
  const type = (searchParams.get('type') || 'manhua') as 'manhua' | 'manga' | 'manhwa';

  try {
    const entry = await buildManhuaDataEntry(slug, title, type);
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Failed to fetch manga data' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Copy this data to lib/data/manhua-data.json',
      data: {
        [entry.slug]: entry
      }
    });
  } catch (error) {
    console.error('Error fetching manga:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
