
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/api';
import { useAuthStore } from '../lib/store';
import { MessageSquare, ThumbsUp, Reply } from 'lucide-react';

interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: User;
  upvotes: number;
  isUpvoted: boolean;
  replies?: Comment[];
}

export default function DiscussionBoard({ problemId }: { problemId: string }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [problemId]);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/discussions/problem/${problemId}`);
      // Organize flat list into tree
      const commentMap = new Map<string, Comment>();
      const roots: Comment[] = [];

      data.forEach((c: any) => {
        c.replies = [];
        commentMap.set(c.id, c);
      });

      data.forEach((c: any) => {
        if (c.parentId) {
          const parent = commentMap.get(c.parentId);
          if (parent) parent.replies?.push(c);
        } else {
          roots.push(c);
        }
      });
      
      setComments(roots);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (parentId: string | null = null) => {
    if (!newComment.trim()) return;

    try {
      await api.post('/discussions', {
        problemId,
        content: newComment,
        parentId
      });

      // Optimistic update or refresh
      fetchComments();
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleVote = async (commentId: string) => {
    try {
      await api.post(`/discussions/${commentId}/vote`);
       // Refresh or optimistic update
      fetchComments(); 
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment, depth?: number }) => (
    <div className={`flex gap-3 mb-4 ${depth > 0 ? 'ml-8' : ''}`}>
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-lc-fill-3 flex items-center justify-center text-xs font-bold text-lc-text-secondary overflow-hidden">
          {comment.user.avatarUrl ? (
             <img src={comment.user.avatarUrl} alt={comment.user.username} className="w-full h-full object-cover" />
          ) : (
            comment.user.username[0].toUpperCase()
          )}
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-lc-layer-2 rounded-lg p-3 border border-lc-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-lc-text-primary hover:text-lc-accent cursor-pointer">
              {comment.user.username}
            </span>
            <span className="text-[10px] text-lc-text-tertiary">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <div className="text-sm text-lc-text-secondary whitespace-pre-wrap mb-3">
             {comment.content}
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => handleVote(comment.id)}
               className={`flex items-center gap-1 text-xs ${comment.isUpvoted ? 'text-lc-accent' : 'text-lc-text-tertiary hover:text-lc-text-secondary'}`}
             >
               <ThumbsUp className="w-3.5 h-3.5" />
               <span>{comment.upvotes}</span>
             </button>
             <button 
               onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
               className="flex items-center gap-1 text-xs text-lc-text-tertiary hover:text-lc-text-secondary"
             >
               <Reply className="w-3.5 h-3.5" />
               <span>Reply</span>
             </button>
          </div>
        </div>
        
        {/* Reply Input */}
        {replyTo === comment.id && (
          <div className="mt-2 ml-2">
             <div className="flex gap-2">
               <textarea
                 value={newComment}
                 onChange={(e) => setNewComment(e.target.value)}
                 placeholder={`Reply to ${comment.user.username}...`}
                 className="flex-1 bg-lc-layer-2 border border-lc-border rounded p-2 text-sm text-lc-text-primary focus:border-lc-accent focus:outline-none min-h-[60px]"
               />
               <button
                 onClick={() => handlePostComment(comment.id)}
                 className="px-3 py-1 bg-lc-accent text-white rounded text-xs font-medium h-fit self-end"
               >
                 Reply
               </button>
             </div>
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="p-4 text-lc-text-tertiary">Loading discussion...</div>;

  return (
    <div className="p-4">
      {/* New Comment Input */}
      <div className="mb-6 flex gap-3">
        <div className="w-8 h-8 rounded-full bg-lc-fill-3 flex-shrink-0 flex items-center justify-center text-xs font-bold text-lc-text-secondary">
           {user?.username?.[0].toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <textarea
            value={replyTo ? '' : newComment} 
            onChange={(e) => { if (!replyTo) setNewComment(e.target.value) }}
            placeholder="Type your comment here (Markdown supported)..."
            className="w-full bg-lc-layer-2 border border-lc-border rounded-lg p-3 text-sm text-lc-text-primary focus:border-lc-accent focus:outline-none min-h-[80px]"
            disabled={!!replyTo}
          />
          <div className="flex justify-between items-center mt-2">
             <span className="text-xs text-lc-text-tertiary">Markdown supported</span>
             <button
               onClick={() => handlePostComment(null)}
               disabled={!!replyTo || !newComment.trim()}
               className="px-4 py-2 bg-lc-accent hover:bg-lc-accent/90 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Post Comment
             </button>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {comments.length > 0 ? (
          comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
        ) : (
          <div className="text-center py-10 text-lc-text-tertiary">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
}
