import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Check if user has already viewed this manhua recently (via cookie)
    const viewCookieName = `viewed_${slug}`;
    const hasViewed = request.cookies.get(viewCookieName);

    const db = await getDatabase();
    const viewsCollection = db.collection('views');

    // Get or create view document
    let viewDoc = await viewsCollection.findOne({ slug });
    let currentViews = 0;

    if (!viewDoc) {
      const newDoc = {
        slug,
        views: 0,
        lastUpdated: new Date().toISOString(),
      };
      await viewsCollection.insertOne(newDoc);
      currentViews = 0;
    } else {
      currentViews = viewDoc.views || 0;
    }

    let shouldIncrement = false;

    // Only increment if user hasn't viewed in the last 24 hours
    if (!hasViewed) {
      await viewsCollection.updateOne(
        { slug },
        {
          $inc: { views: 1 },
          $set: { lastUpdated: new Date().toISOString() }
        }
      );
      currentViews += 1;
      shouldIncrement = true;
    }

    // Create response with updated view count
    const response = NextResponse.json({
      views: currentViews,
      incremented: shouldIncrement,
    });

    // Set cookie to expire in 24 hours (86400 seconds)
    if (shouldIncrement) {
      response.cookies.set(viewCookieName, 'true', {
        maxAge: 86400, // 24 hours in seconds
        path: '/',
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const viewsCollection = db.collection('views');

    const viewDoc = await viewsCollection.findOne({ slug });
    const views = viewDoc?.views || 0;

    return NextResponse.json({ views });
  } catch (error) {
    console.error('Error fetching views:', error);
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
  }
}
