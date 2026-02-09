import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase } from '@/lib/mongodb';

// Get comments for a manhua
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mangadexId = searchParams.get('mangadexId');

    if (!mangadexId) {
      return NextResponse.json({ error: 'MangadexId is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const commentsCollection = db.collection('comments');

    // Find all top-level comments for this manhua
    const comments = await commentsCollection
      .find({ mangadexId, parentId: null })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// Post a comment, vote, or reply
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, mangadexId, username, userId } = body;

    if (!mangadexId || !username || !userId) {
      return NextResponse.json(
        { error: 'MangadexId, username, and userId are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const commentsCollection = db.collection('comments');
    const usersCollection = db.collection('users');

    // Get user info to check if admin
    const user = await usersCollection.findOne({ id: userId });
    const isAdmin = user?.isAdmin || false;

    if (action === 'post') {
      const { text } = body;

      if (!text || text.trim().length === 0) {
        return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
      }

      const newComment = {
        id: randomUUID(),
        mangadexId,
        parentId: null,
        author: username,
        userId: userId,
        isAdmin,
        text: text.trim(),
        timeAgo: 'Just now',
        timestamp: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
        upvotedBy: [],
        downvotedBy: [],
        replies: [],
      };

      await commentsCollection.insertOne(newComment);

      return NextResponse.json({ success: true, comment: newComment });
    }

    if (action === 'reply') {
      const { text, parentId } = body;

      if (!text || text.trim().length === 0) {
        return NextResponse.json({ error: 'Reply text is required' }, { status: 400 });
      }

      if (!parentId) {
        return NextResponse.json({ error: 'Parent comment ID is required' }, { status: 400 });
      }

      const newReply = {
        id: randomUUID(),
        author: username,
        userId: userId,
        isAdmin,
        text: text.trim(),
        timeAgo: 'Just now',
        timestamp: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
        upvotedBy: [],
        downvotedBy: [],
        replies: [],
      };

      // Try to find as top-level comment first
      let parentComment = await commentsCollection.findOne({ id: parentId });

      if (parentComment) {
        // Parent is a top-level comment
        await commentsCollection.updateOne(
          { id: parentId },
          { $push: { replies: newReply as any } }
        );
        return NextResponse.json({ success: true, reply: newReply });
      }

      // Parent is nested - get all top-level comments and search recursively
      const allComments = await commentsCollection.find({ mangadexId, parentId: null }).toArray();
      
      let foundDoc = null;
      
      for (const doc of allComments) {
        const addReplyToNested = (replies: any[]): boolean => {
          for (const reply of replies) {
            if (reply.id === parentId) {
              if (!reply.replies) reply.replies = [];
              reply.replies.push(newReply);
              return true;
            }
            if (reply.replies && reply.replies.length > 0) {
              if (addReplyToNested(reply.replies)) return true;
            }
          }
          return false;
        };

        if (addReplyToNested(doc.replies || [])) {
          foundDoc = doc;
          break;
        }
      }

      if (!foundDoc) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }

      // Update the document with modified replies
      await commentsCollection.updateOne(
        { _id: foundDoc._id },
        { $set: { replies: foundDoc.replies } }
      );

      return NextResponse.json({ success: true, reply: newReply });
    }

    if (action === 'vote') {
      const { commentId, voteType } = body;

      if (!commentId || !voteType || !['up', 'down'].includes(voteType)) {
        return NextResponse.json(
          { error: 'Comment ID and valid vote type (up/down) are required' },
          { status: 400 }
        );
      }

      // Try to find as top-level comment first
      let comment = await commentsCollection.findOne({ id: commentId });
      let isNested = false;
      let parentDoc = null;

      if (!comment) {
        // Not a top-level comment - get all top-level comments and search recursively
        const allComments = await commentsCollection.find({ mangadexId, parentId: null }).toArray();
        
        for (const doc of allComments) {
          const findReply = (replies: any[]): any => {
            for (const reply of replies) {
              if (reply.id === commentId) return reply;
              if (reply.replies && reply.replies.length > 0) {
                const found = findReply(reply.replies);
                if (found) return found;
              }
            }
            return null;
          };

          const foundReply = findReply(doc.replies || []);
          if (foundReply) {
            comment = foundReply;
            parentDoc = doc;
            isNested = true;
            break;
          }
        }
      }

      if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      // Initialize vote arrays if they don't exist
      if (!comment.upvotedBy) comment.upvotedBy = [];
      if (!comment.downvotedBy) comment.downvotedBy = [];

      const hasUpvoted = comment.upvotedBy.includes(userId);
      const hasDownvoted = comment.downvotedBy.includes(userId);

      if (voteType === 'up') {
        if (hasUpvoted) {
          // Remove upvote
          comment.upvotedBy = comment.upvotedBy.filter((id: string) => id !== userId);
          comment.upvotes = Math.max(0, comment.upvotes - 1);
        } else {
          // Add upvote and remove downvote if exists
          if (hasDownvoted) {
            comment.downvotedBy = comment.downvotedBy.filter((id: string) => id !== userId);
            comment.downvotes = Math.max(0, comment.downvotes - 1);
          }
          comment.upvotedBy.push(userId);
          comment.upvotes += 1;
        }
      } else {
        // voteType === 'down'
        if (hasDownvoted) {
          // Remove downvote
          comment.downvotedBy = comment.downvotedBy.filter((id: string) => id !== userId);
          comment.downvotes = Math.max(0, comment.downvotes - 1);
        } else {
          // Add downvote and remove upvote if exists
          if (hasUpvoted) {
            comment.upvotedBy = comment.upvotedBy.filter((id: string) => id !== userId);
            comment.upvotes = Math.max(0, comment.upvotes - 1);
          }
          comment.downvotedBy.push(userId);
          comment.downvotes += 1;
        }
      }

      // Update the comment in database
      if (isNested && parentDoc) {
        // Update nested reply - update the entire top-level comment
        await commentsCollection.updateOne(
          { _id: parentDoc._id },
          { $set: { replies: parentDoc.replies } }
        );
      } else {
        // Update top-level comment
        await commentsCollection.updateOne(
          { id: commentId },
          {
            $set: {
              upvotes: comment.upvotes,
              downvotes: comment.downvotes,
              upvotedBy: comment.upvotedBy,
              downvotedBy: comment.downvotedBy,
            }
          }
        );
      }

      return NextResponse.json({ success: true, comment });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing comment action:', error);
    return NextResponse.json({ error: 'Failed to process comment action' }, { status: 500 });
  }
}
