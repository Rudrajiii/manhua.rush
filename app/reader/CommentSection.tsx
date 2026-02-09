"use client";
import React, { useState, useEffect } from 'react';
import styles from './CommentSection.module.css';
import AlertNotification from '@/app/components/AlertNotification';
import UsernameModal from '@/app/components/UsernameModal';

type CommentType = {
  id: string;
  author: string;
  userId: string;
  isAdmin?: boolean;
  text: string;
  timeAgo: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  upvotedBy: string[];
  downvotedBy: string[];
  replies?: CommentType[];
};

function timeAgo(timestamp: string) {
  try {
    const t = new Date(timestamp).getTime();
    const now = Date.now();
    const diff = Math.floor((now - t) / 1000);

    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const diffMin = Math.floor(diff / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 30) return `${diffD}d ago`;
    const diffM = Math.floor(diffD / 30);
    if (diffM < 12) return `${diffM}mo ago`;
    const diffY = Math.floor(diffM / 12);
    return `${diffY}y ago`;
  } catch (e) {
    return 'Just now';
  }
}

function CommentItem({ 
  comment, 
  depth = 0, 
  mangadexId, 
  onReply,
  currentUserId,
  onRequestOpenUsername
}: { 
  comment: CommentType; 
  depth?: number;
  mangadexId: string;
  onReply: (parentId: string) => void;
  currentUserId: string | null;
  onRequestOpenUsername?: () => void;
}) {
  const [showFullText, setShowFullText] = useState(false);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [localUpvotes, setLocalUpvotes] = useState(comment.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(comment.downvotes);

  const textLimit = 150;
  const isTooLong = comment.text.length > textLimit;
  const displayText = showFullText || !isTooLong ? comment.text : comment.text.slice(0, textLimit);

  useEffect(() => {
    if (currentUserId) {
      if (comment.upvotedBy?.includes(currentUserId)) {
        setVoted('up');
      } else if (comment.downvotedBy?.includes(currentUserId)) {
        setVoted('down');
      }
    }
  }, [comment, currentUserId]);

  const handleVote = async (type: 'up' | 'down', showAlert: (msg: string) => void) => {
    if (!currentUserId) {
      showAlert('Please set up a username first to vote!');
      return;
    }

    const username = localStorage.getItem('manhuarush_username');
    if (!username) {
      showAlert('Please set up a username first to vote!');
      return;
    }

    // Optimistic update
    const wasVoted = voted === type;
    const newVoted = wasVoted ? null : type;
    
    let newUpvotes = localUpvotes;
    let newDownvotes = localDownvotes;

    if (type === 'up') {
      if (wasVoted) {
        newUpvotes -= 1;
      } else {
        newUpvotes += 1;
        if (voted === 'down') {
          newDownvotes -= 1;
        }
      }
    } else {
      if (wasVoted) {
        newDownvotes -= 1;
      } else {
        newDownvotes += 1;
        if (voted === 'up') {
          newUpvotes -= 1;
        }
      }
    }

    setVoted(newVoted);
    setLocalUpvotes(newUpvotes);
    setLocalDownvotes(newDownvotes);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          mangadexId,
          commentId: comment.id,
          voteType: type,
          username,
          userId: currentUserId,
        }),
      });

      if (!response.ok) {
        // Revert on error
        setVoted(voted);
        setLocalUpvotes(localUpvotes);
        setLocalDownvotes(localDownvotes);
      }
    } catch (error) {
      // Revert on error
      setVoted(voted);
      setLocalUpvotes(localUpvotes);
      setLocalDownvotes(localDownvotes);
    }
  };

  return (
    <div className={styles['comment-thread']} style={{ marginLeft: depth > 0 ? '40px' : '0' }}>
      {depth > 0 && (
        <>
          <div className={styles['reply-line']} />
          <div className={styles['reply-connector']} />
        </>
      )}

      <div className={styles['comment-item']}>
        <div className={styles['comment-avatar']}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#4f46e5"/>
          </svg>
        </div>

        <div className={styles['comment-content']}>
          <div className={styles['comment-header']}>
            <span className={styles['comment-author']}>
              {comment.author}
              {comment.isAdmin && (
                <span className={styles['admin-badge']}>ADMIN</span>
              )}
            </span>
            <span className={styles['comment-time']}>{timeAgo(comment.timestamp)}</span>
          </div>

          <div className={styles['comment-text']}>
            {displayText}
            {isTooLong && !showFullText && '...'}
            {isTooLong && (
              <button
                className={styles['read-more-btn']}
                onClick={() => setShowFullText(!showFullText)}
              >
                {showFullText ? ' Show less' : ' ...more'}
              </button>
            )}
          </div>

          <CommentActions 
            comment={comment}
            voted={voted}
            localUpvotes={localUpvotes}
            localDownvotes={localDownvotes}
            onVote={handleVote}
            onReply={() => onReply(comment.id)}
            onOpenUsername={onRequestOpenUsername}
          />

          {comment.replies && comment.replies.length > 0 && (
            <div className={styles['replies']}>
              {comment.replies.map((reply) => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  depth={depth + 1}
                  mangadexId={mangadexId}
                  onReply={onReply}
                  currentUserId={currentUserId}
                  onRequestOpenUsername={onRequestOpenUsername}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentActions({
  comment,
  voted,
  localUpvotes,
  localDownvotes,
  onVote,
  onReply
  ,
  onOpenUsername
}: {
  comment: CommentType;
  voted: 'up' | 'down' | null;
  localUpvotes: number;
  localDownvotes: number;
  onVote: (type: 'up' | 'down', showAlert: (msg: string) => void) => void;
  onReply: () => void;
  onOpenUsername?: () => void;
}) {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
    setShowAlert(true);
  };

  return (
    <>
      <div className={styles['comment-actions']}>
        <button
          className={`${styles['vote-btn']} ${voted === 'up' ? styles['voted'] : ''}`}
          onClick={() => onVote('up', triggerAlert)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 10l5-5 5 5M12 5v14" />
          </svg>
          <span>{localUpvotes}</span>
        </button>

        <button
          className={`${styles['vote-btn']} ${voted === 'down' ? styles['voted'] : ''}`}
          onClick={() => onVote('down', triggerAlert)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 14l5 5 5-5M12 19V5" />
          </svg>
          <span>{localDownvotes}</span>
        </button>

        <button className={styles['action-btn']} onClick={onReply}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Reply
        </button>
      </div>

      {showAlert && (
        <AlertNotification 
          message={alertMessage} 
          onClose={() => setShowAlert(false)} 
          actionLabel={onOpenUsername ? 'Set Username' : undefined}
          onAction={onOpenUsername}
        />
      )}
    </>
  );
}

export default function CommentSection({ mangaId, chapter }: { mangaId: string; chapter: string }) {
  const [text, setText] = useState('');
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  useEffect(() => {
    const username = localStorage.getItem('manhuarush_username');
    const userId = localStorage.getItem('manhuarush_userId');
    setCurrentUsername(username);
    setCurrentUserId(userId);

    fetchComments();
  }, [mangaId]);

  useEffect(() => {
    const handleUsernameChanged = (e: any) => {
      if (e?.detail?.username) {
        setCurrentUsername(e.detail.username);
        setCurrentUserId(e.detail.userId || null);
      }
    };

    window.addEventListener('manhuarush:username-changed', handleUsernameChanged as EventListener);
    return () => window.removeEventListener('manhuarush:username-changed', handleUsernameChanged as EventListener);
  }, []);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?mangadexId=${mangaId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!text.trim()) return;

    if (!currentUsername || !currentUserId) {
      setAlertMessage('Please set up a username first to comment!');
      setShowAlert(true);
      return;
    }

    try {
      const action = replyingTo ? 'reply' : 'post';
      const body: any = {
        action,
        mangadexId: mangaId,
        text: text.trim(),
        username: currentUsername,
        userId: currentUserId,
      };

      if (replyingTo) {
        body.parentId = replyingTo;
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setText('');
        setReplyingTo(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleReply = (parentId: string) => {
    if (!currentUsername) {
      setAlertMessage('Please set up a username first to reply!');
      setShowAlert(true);
      return;
    }
    setReplyingTo(parentId);
  };

  const openUsernameModal = () => setIsUsernameModalOpen(true);

  const handleUsernameSuccess = (username: string, userId: string) => {
    setCurrentUsername(username);
    setCurrentUserId(userId);
    try {
      window.dispatchEvent(new CustomEvent('manhuarush:username-changed', { detail: { username, userId } }));
    } catch (e) {}
  };

  return (
    <div className={styles['comment-section']}>
      <div className={styles['comment-warning']}>
          Before Commenting Please Make Sure You Have Setup Your User Name.
      </div>
      <h3 className={styles['comment-title']}>{comments.length} comments</h3>

      <div className={styles['comment-input-wrapper']}>
        <div className={styles['comment-input-row']}>
          <div className={styles['input-avatar']}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="rgba(139, 92, 246, 0.2)"/>
              <circle cx="16" cy="12" r="5" fill="#8b5cf6"/>
              <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="#8b5cf6"/>
            </svg>
          </div>
          <div className={styles['textarea-container']}>
            {replyingTo && (
              <div className={styles['reply-indicator']}>
                <span>Replying to comment</span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className={styles['cancel-reply-btn']}
                >
                  Cancel
                </button>
              </div>
            )}
            <div className={styles['textarea-wrapper']}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={1}
                placeholder="Write your message"
                className={styles['comment-textarea']}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addComment();
                  }
                }}
              />
              {text.trim() && (
                <button
                  onClick={addComment}
                  className={styles['send-btn']}
                  title="Send (Enter)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className={`${styles['comment-list']} comment-list`}>
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment}
              mangadexId={mangaId}
              onReply={handleReply}
              currentUserId={currentUserId}
              onRequestOpenUsername={openUsernameModal}
            />
          ))}
        </div>
      )}

      {showAlert && (
        <AlertNotification 
          message={alertMessage} 
          onClose={() => setShowAlert(false)} 
          actionLabel="Set Username"
          onAction={() => { setIsUsernameModalOpen(true); setShowAlert(false); }}
        />
      )}

      <UsernameModal
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
        onSuccess={(u, id) => { handleUsernameSuccess(u, id); setIsUsernameModalOpen(false); }}
        currentUsername={currentUsername || undefined}
        currentUserId={currentUserId || undefined}
      />

      <style jsx>
        {`
        .${styles['comment-list']}::-webkit-scrollbar,
        .comment-list::-webkit-scrollbar {
          width: 6px !important;
          height: 6px !important;
        }

        .${styles['comment-list']}::-webkit-scrollbar-track,
        .comment-list::-webkit-scrollbar-track {
          background: transparent !important;
        }

        .${styles['comment-list']}::-webkit-scrollbar-thumb,
        .comment-list::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.6) !important;
          border-radius: 3px !important;
          border: none !important;
        }

        .${styles['comment-list']}::-webkit-scrollbar-thumb:hover,
        .comment-list::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.8) !important;
        }

        .${styles['comment-list']}::-webkit-scrollbar-corner,
        .comment-list::-webkit-scrollbar-corner {
          background: transparent !important;
          display: none !important;
        }

        .${styles['comment-list']}::-webkit-scrollbar-button,
        .comment-list::-webkit-scrollbar-button {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }

        .${styles['comment-list']},
        .comment-list {
          scrollbar-width: thin !important;
          scrollbar-color: rgba(139, 92, 246, 0.6) transparent !important;
        `}
      </style>
    </div>
  );
}
