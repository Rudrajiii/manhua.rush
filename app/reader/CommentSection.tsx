"use client";
import React, { useState, useEffect, useRef } from 'react';
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

// Component to render text with highlighted mentions
function TextWithMentions({ text }: { text: string }) {
  const mentionRegex = /@(\w+)/g;
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Check if @ is at start of string or preceded by whitespace
    const isValidMention = match.index === 0 || /\s/.test(text[match.index - 1]);

    if (!isValidMention) {
      continue;
    }

    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add mention with styling
    parts.push(
      <span key={match.index} className={styles['mention']}>
        @{match[1]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
}

function CommentItem({ 
  comment, 
  depth = 0, 
  mangadexId, 
  chapter,
  onReply,
  currentUserId,
  onRequestOpenUsername,
  onCommentUpdate,
  onCommentDelete,
  isMobile = false,
  onShowReplies = () => {}
}: { 
  comment: CommentType; 
  depth?: number;
  mangadexId: string;
  chapter: string;
  onReply: (parentId: string) => void;
  currentUserId: string | null;
  onRequestOpenUsername?: () => void;
  onCommentUpdate?: () => void;
  onCommentDelete?: () => void;
  isMobile?: boolean;
  onShowReplies?: (commentId: string) => void;
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
          chapter,
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
            <TextWithMentions text={displayText} />
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
            currentUserId={currentUserId}
            mangadexId={mangadexId}
            chapter={chapter}
            onCommentUpdate={onCommentUpdate}
            onCommentDelete={onCommentDelete}
          />

          {comment.replies && comment.replies.length > 0 && (
            <>
              {isMobile && depth === 1 ? (
                <button
                  className={styles['show-more-replies-btn']}
                  onClick={() => onShowReplies(comment.id)}
                >
                  Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              ) : isMobile && depth >= 2 ? (
                <button
                  className={styles['show-more-replies-btn']}
                  onClick={() => onShowReplies(comment.id)}
                >
                  ▶ Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              ) : isMobile && depth === 0 ? (
                <div className={styles['replies']}>
                  {comment.replies.map((reply) => (
                    <CommentItem 
                      key={reply.id} 
                      comment={reply} 
                      depth={depth + 1}
                      mangadexId={mangadexId}
                      chapter={chapter}
                      onReply={onReply}
                      currentUserId={currentUserId}
                      onRequestOpenUsername={onRequestOpenUsername}
                      onCommentUpdate={onCommentUpdate}
                      onCommentDelete={onCommentDelete}
                      isMobile={isMobile}
                      onShowReplies={onShowReplies}
                    />
                  ))}
                </div>
              ) : !isMobile ? (
                <div className={styles['replies']}>
                  {comment.replies.map((reply) => (
                    <CommentItem 
                      key={reply.id} 
                      comment={reply} 
                      depth={depth + 1}
                      mangadexId={mangadexId}
                      chapter={chapter}
                      onReply={onReply}
                      currentUserId={currentUserId}
                      onRequestOpenUsername={onRequestOpenUsername}
                      onCommentUpdate={onCommentUpdate}
                      onCommentDelete={onCommentDelete}
                      isMobile={isMobile}
                      onShowReplies={onShowReplies}
                    />
                  ))}
                </div>
              ) : null}
            </>
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
  onReply,
  onOpenUsername,
  currentUserId,
  mangadexId,
  chapter,
  onCommentUpdate,
  onCommentDelete
}: {
  comment: CommentType;
  voted: 'up' | 'down' | null;
  localUpvotes: number;
  localDownvotes: number;
  onVote: (type: 'up' | 'down', showAlert: (msg: string) => void) => void;
  onReply: () => void;
  onOpenUsername?: () => void;
  currentUserId: string | null;
  mangadexId: string;
  chapter: string;
  onCommentUpdate?: () => void;
  onCommentDelete?: () => void;
}) {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
    setShowAlert(true);
  };

  const isOwner = currentUserId === comment.userId;

  // Close more menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  const handleEdit = async () => {
    if (editText.trim().length === 0) {
      triggerAlert('Comment text cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: comment.id,
          newText: editText.trim(),
          userId: currentUserId,
          mangadexId,
          chapter,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        setShowMoreMenu(false);
        onCommentUpdate?.();
      } else {
        const data = await response.json();
        triggerAlert(data.error || 'Failed to update comment');
      }
    } catch (error) {
      triggerAlert('Failed to update comment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: comment.id,
          userId: currentUserId,
          mangadexId,
          chapter,
        }),
      });

      if (response.ok) {
        setShowMoreMenu(false);
        onCommentDelete?.();
      } else {
        const data = await response.json();
        triggerAlert(data.error || 'Failed to delete comment');
      }
    } catch (error) {
      triggerAlert('Failed to delete comment');
    }
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

        {isOwner && (
          <div className={styles['more-menu-wrapper']} ref={moreMenuRef}>
            <button 
              className={styles['more-btn']}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="More options"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>

            {showMoreMenu && (
              <div className={styles['more-menu-dropdown']}>
                <button 
                  className={styles['more-menu-item']}
                  onClick={() => {
                    setIsEditing(true);
                    setShowMoreMenu(false);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button 
                  className={styles['more-menu-item']}
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleDelete();
                  }}
                  style={{ color: '#ef4444' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className={styles['edit-form']}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Edit your comment..."
            className={styles['edit-textarea']}
          />
          <div className={styles['edit-actions']}>
            <button 
              className={styles['edit-save-btn']}
              onClick={handleEdit}
            >
              Save
            </button>
            <button 
              className={styles['edit-cancel-btn']}
              onClick={() => {
                setIsEditing(false);
                setEditText(comment.text);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
  const [mentionSuggestions, setMentionSuggestions] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const mentionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const username = localStorage.getItem('manhuarush_username');
    const userId = localStorage.getItem('manhuarush_userId');
    setCurrentUsername(username);
    setCurrentUserId(userId);

    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    fetchComments();

    return () => window.removeEventListener('resize', checkMobile);
  }, [mangaId, chapter]);

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
      const response = await fetch(`/api/comments?mangadexId=${mangaId}&chapter=${encodeURIComponent(chapter)}`);
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
        chapter,
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

    // Find the comment being replied to and auto-populate @username
    const findCommentAuthor = (id: string, commentsList: CommentType[]): string | null => {
      for (const comment of commentsList) {
        if (comment.id === id) return comment.author;
        if (comment.replies && comment.replies.length > 0) {
          const found = findCommentAuthor(id, comment.replies);
          if (found) return found;
        }
      }
      return null;
    };

    const author = findCommentAuthor(parentId, comments);
    if (author && !text.includes(`@${author}`)) {
      setText(`@${author} `);
      // Focus textarea
      setTimeout(() => mentionInputRef.current?.focus(), 0);
    }
  };

  const openUsernameModal = () => setIsUsernameModalOpen(true);

  // Find a comment in the tree by ID
  const findCommentById = (id: string, commentsList: CommentType[] = comments): CommentType | null => {
    for (const comment of commentsList) {
      if (comment.id === id) return comment;
      if (comment.replies && comment.replies.length > 0) {
        const found = findCommentById(id, comment.replies);
        if (found) return found;
      }
    }
    return null;
  };

  const handleShowReplies = (commentId: string) => {
    setExpandedThreadId(commentId);
  };

  const handleCloseExpandedThread = () => {
    setExpandedThreadId(null);
  };

  const handleUsernameSuccess = (username: string, userId: string) => {
    setCurrentUsername(username);
    setCurrentUserId(userId);
    try {
      window.dispatchEvent(new CustomEvent('manhuarush:username-changed', { detail: { username, userId } }));
    } catch (e) {}
  };

  // Count total comments including all nested replies
  const getTotalCommentCount = (commentsList: CommentType[]): number => {
    let count = commentsList.length;
    for (const comment of commentsList) {
      if (comment.replies && comment.replies.length > 0) {
        count += getTotalCommentCount(comment.replies);
      }
    }
    return count;
  };

  const totalComments = getTotalCommentCount(comments);

  // Extract all usernames from comments for mention suggestions
  const getAllUsernamesFromComments = (): string[] => {
    const usernames = new Set<string>();
    
    const extractFromCommentsList = (commentsList: CommentType[]) => {
      for (const comment of commentsList) {
        usernames.add(comment.author);
        if (comment.replies && comment.replies.length > 0) {
          extractFromCommentsList(comment.replies);
        }
      }
    };

    extractFromCommentsList(comments);
    // Remove current user from suggestions
    usernames.delete(currentUsername || '');
    return Array.from(usernames).sort();
  };

  // Handle mention input
  const handleTextChange = (newText: string) => {
    setText(newText);

    // Check if user is typing a mention
    const lastAtSymbol = newText.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      // Check if @ is at start or preceded by whitespace (valid mention position)
      const isValidMentionPosition = lastAtSymbol === 0 || /\s/.test(newText[lastAtSymbol - 1]);
      
      if (isValidMentionPosition) {
        const afterAt = newText.substring(lastAtSymbol + 1);
        // Check if we're still typing the mention (no space after @)
        if (!afterAt.includes(' ') && afterAt.length > 0) {
          const allUsernames = getAllUsernamesFromComments();
          const matching = allUsernames.filter(username =>
            username.toLowerCase().startsWith(afterAt.toLowerCase())
          );
          setMentionSuggestions(matching);
          setShowMentionSuggestions(matching.length > 0);
        } else {
          setShowMentionSuggestions(false);
        }
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Insert mention
  const insertMention = (username: string) => {
    const lastAtSymbol = text.lastIndexOf('@');
    
    // Verify the @ is at a valid mention position
    const isValidMentionPosition = lastAtSymbol === 0 || /\s/.test(text[lastAtSymbol - 1]);
    
    if (!isValidMentionPosition) {
      setShowMentionSuggestions(false);
      return;
    }

    const beforeAt = text.substring(0, lastAtSymbol);
    const afterAt = text.substring(lastAtSymbol + 1);
    const spaceIndex = afterAt.indexOf(' ');

    if (spaceIndex !== -1) {
      const newText = beforeAt + '@' + username + ' ' + afterAt.substring(spaceIndex + 1);
      setText(newText);
    } else {
      setText(beforeAt + '@' + username + ' ');
    }

    setShowMentionSuggestions(false);
    mentionInputRef.current?.focus();
  };

  return (
    <div className={styles['comment-section']}>
      <div className={styles['comment-warning']}>
          Before Commenting Please Make Sure You Have Setup Your User Name.
      </div>
      <h3 className={styles['comment-title']}>{totalComments} comments</h3>

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
                ref={mentionInputRef}
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={1}
                placeholder="send a message (use @name to tag)"
                className={styles['comment-textarea']}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addComment();
                  }
                }}
              />
              
              {showMentionSuggestions && mentionSuggestions.length > 0 && (
                <div className={styles['mention-suggestions']}>
                  {mentionSuggestions.slice(0, 5).map((username) => (
                    <button
                      key={username}
                      className={styles['mention-suggestion-item']}
                      onClick={() => insertMention(username)}
                    >
                      <span className={styles['mention-icon']}>@</span>
                      <span>{username}</span>
                    </button>
                  ))}
                </div>
              )}

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
      ) : expandedThreadId ? (
        <div className={`${styles['comment-list']} comment-list`}>
          <button
            className={styles['back-to-comments-btn']}
            onClick={handleCloseExpandedThread}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to comments
          </button>
          {(() => {
            const parentComment = findCommentById(expandedThreadId);
            if (!parentComment || !parentComment.replies || parentComment.replies.length === 0) return null;
            
            return (
              <div className={styles['replies']}>
                {parentComment.replies.map((reply) => (
                  <CommentItem 
                    key={reply.id} 
                    comment={reply}
                    depth={1}
                    mangadexId={mangaId}
                    chapter={chapter}
                    onReply={handleReply}
                    currentUserId={currentUserId}
                    onRequestOpenUsername={openUsernameModal}
                    onCommentUpdate={fetchComments}
                    onCommentDelete={fetchComments}
                    isMobile={isMobile}
                    onShowReplies={handleShowReplies}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className={`${styles['comment-list']} comment-list`}>
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment}
              mangadexId={mangaId}
              chapter={chapter}
              onReply={handleReply}
              currentUserId={currentUserId}
              onRequestOpenUsername={openUsernameModal}
              onCommentUpdate={fetchComments}
              onCommentDelete={fetchComments}
              isMobile={isMobile}
              onShowReplies={handleShowReplies}
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
