import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase } from '@/lib/mongodb';

// Read admin username from env with a fallback name.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'heavenly_bro';

// Register a new user
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || username.trim().length < 4 || username.trim().length > 12) {
      return NextResponse.json(
        { error: 'Username must be between 4 and 12 characters long' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Check if username already exists (case-insensitive)
    const existingUser = await usersCollection.findOne({
      username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken. Please choose another one.' },
        { status: 409 }
      );
    }

    // Create new user with UUID
    const newUser = {
      id: randomUUID(),
      username: trimmedUsername,
      isAdmin: trimmedUsername === ADMIN_USERNAME,
      createdAt: new Date().toISOString(),
    };

    await usersCollection.insertOne(newUser);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        isAdmin: newUser.isAdmin,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}

// Verify username exists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (user) {
      return NextResponse.json({
        exists: true,
        user: { 
          id: user.id, 
          username: user.username,
          isAdmin: user.isAdmin || false,
        },
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Error verifying user:', error);
    return NextResponse.json({ error: 'Failed to verify user' }, { status: 500 });
  }
}

// Update username
export async function PUT(request: NextRequest) {
  try {
    const { userId, newUsername } = await request.json();

    if (!userId || !newUsername) {
      return NextResponse.json(
        { error: 'User ID and new username are required' },
        { status: 400 }
      );
    }

    if (newUsername.trim().length < 4 || newUsername.trim().length > 12) {
      return NextResponse.json(
        { error: 'Username must be between 4 and 12 characters long' },
        { status: 400 }
      );
    }

    const trimmedUsername = newUsername.trim();

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Check if new username already exists (case-insensitive)
    const existingUser = await usersCollection.findOne({
      username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') },
      id: { $ne: userId }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken. Please choose another one.' },
        { status: 409 }
      );
    }

    // Update the username
    const result = await usersCollection.updateOne(
      { id: userId },
      { 
        $set: { 
          username: trimmedUsername,
          isAdmin: trimmedUsername === ADMIN_USERNAME,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username: trimmedUsername,
        isAdmin: trimmedUsername === ADMIN_USERNAME,
      },
    });
  } catch (error) {
    console.error('Error updating username:', error);
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
  }
}
