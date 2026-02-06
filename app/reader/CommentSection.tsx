"use client";
import React, { useState } from 'react';
import styles from './CommentSection.module.css';

type CommentType = {
  id: string;
  author: string;
  text: string;
  timeAgo: string;
  upvotes: number;
  downvotes: number;
  replies?: CommentType[];
};

const testComments: CommentType[] = [
  {
    id: '1',
    author: 'MonkeyNamedTyson',
    text: "Get your review straight guys, can't have 3 guys saying it's straight before I put my foot in your asses",
    timeAgo: '14 days ago',
    upvotes: 47,
    downvotes: 3,
    replies: [
      {
        id: '1-1',
        author: 'TheEmperorOfMan',
        text: "Fr bro, they'll just say peak or absolute trash that's it. No proper explanations or reasoning behind their opinions whatsoever.",
        timeAgo: '10 days ago',
        upvotes: 13,
        downvotes: 3,
        replies: [
          {
            id: '1-1-1',
            author: 'ilovechemken123',
            text: "Yeah without even explaining why it's horse shit or why it's peak, just throwing random statements around",
            timeAgo: '14 days ago',
            upvotes: 4,
            downvotes: 1,
          },
        ],
      },
      {
        id: '1-2',
        author: 'zarosgremory',
        text: "So different people can't have different opinions? Are you trying to gatekeep how people should express their thoughts?",
        timeAgo: '6 days ago',
        upvotes: 3,
        downvotes: 0,
      },
    ],
  },
  {
    id: '2',
    author: 'CultivationMaster99',
    text: 'This manhua has one of the best cultivation systems I have seen in a long time. The way the author explains the power levels and progression is just phenomenal. Every breakthrough feels earned and the MC actually struggles instead of just getting random power-ups. The art quality in the recent chapters has been absolutely stunning too!',
    timeAgo: '8 days ago',
    upvotes: 89,
    downvotes: 2,
    replies: [
      {
        id: '2-1',
        author: 'XianxiaFan2024',
        text: 'Totally agree! The power scaling is consistent and makes sense.',
        timeAgo: '7 days ago',
        upvotes: 21,
        downvotes: 1,
      },
    ],
  },
  {
    id: '3',
    author: 'ReaderX',
    text: 'When is the next chapter coming out? The cliffhanger is killing me!',
    timeAgo: '3 days ago',
    upvotes: 15,
    downvotes: 0,
  },
];

function CommentItem({ comment, depth = 0 }: { comment: CommentType; depth?: number }) {
  const [showFullText, setShowFullText] = useState(false);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  const textLimit = 150;
  const isTooLong = comment.text.length > textLimit;
  const displayText = showFullText || !isTooLong ? comment.text : comment.text.slice(0, textLimit);

  const handleVote = (type: 'up' | 'down') => {
    setVoted(voted === type ? null : type);
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
            <span className={styles['comment-author']}>{comment.author}</span>
            <span className={styles['comment-time']}>{comment.timeAgo}</span>
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

          <div className={styles['comment-actions']}>
            <button
              className={`${styles['vote-btn']} ${voted === 'up' ? styles['voted'] : ''}`}
              onClick={() => handleVote('up')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 10l5-5 5 5M12 5v14" />
              </svg>
              <span>{comment.upvotes + (voted === 'up' ? 1 : 0)}</span>
            </button>

            <button
              className={`${styles['vote-btn']} ${voted === 'down' ? styles['voted'] : ''}`}
              onClick={() => handleVote('down')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 14l5 5 5-5M12 19V5" />
              </svg>
              <span>{comment.downvotes + (voted === 'down' ? 1 : 0)}</span>
            </button>

            <button className={styles['action-btn']}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              Reply
            </button>

            <button className={styles['action-btn']}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
              More
            </button>
          </div>

          {comment.replies && comment.replies.length > 0 && (
            <div className={styles['replies']}>
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({ mangaId, chapter }: { mangaId: string; chapter: string }) {
  const [text, setText] = useState('');

  function addComment() {
    if (!text.trim()) return;
    // In production, this would add to the comments array
    setText('');
  }

  return (
    <div className={styles['comment-section']}>
      <h3 className={styles['comment-title']}>{testComments.length} comments</h3>

      <div className={styles['comment-warning']}>
        Comment section has not been implemented yet below this are test data. This feature will be available soon.
      </div>

      <div className={styles['comment-input-wrapper']}>
        <div className={styles['comment-input-row']}>
          <div className={styles['input-avatar']}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="rgba(139, 92, 246, 0.2)"/>
              <circle cx="16" cy="12" r="5" fill="#8b5cf6"/>
              <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="#8b5cf6"/>
            </svg>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder="Write your message"
            className={styles['comment-textarea']}
          />
        </div>
      </div>

      <div className={`${styles['comment-list']} comment-list`}>
        {testComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

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
