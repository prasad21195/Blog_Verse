import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/readingTime';
import Loader from './Loader';

const CommentSection = ({ postId }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data.data);
    } catch (err) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { text });
      setComments((prev) => [res.data.data, ...prev]);
      setText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  return (
    <div className="mt-5">
      <h5 className="fw-bold mb-3">Comments ({comments.length})</h5>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-4">
          <textarea
            className="form-control mb-2"
            rows="3"
            placeholder="Write a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
          />
          <button className="btn btn-dark btn-sm" disabled={submitting || !text.trim()}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <p className="text-muted mb-4">
          <a href="/login">Login</a> to comment.
        </p>
      )}

      {loading ? (
        <Loader small />
      ) : comments.length === 0 ? (
        <p className="text-muted">No comments yet. Be the first to comment!</p>
      ) : (
        comments.map((c) => (
          <div key={c._id} className="d-flex gap-3 mb-3 pb-3 border-bottom">
            <img
              src={c.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'U')}`}
              alt={c.user?.name}
              className="bv-avatar"
            />
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between">
                <div>
                  <span className="fw-semibold">{c.user?.name}</span>
                  <span className="text-muted small ms-2">{formatDate(c.createdAt)}</span>
                </div>
                {user?._id === c.user?._id && (
                  <button className="btn btn-link btn-sm text-danger p-0" onClick={() => handleDelete(c._id)}>
                    Delete
                  </button>
                )}
              </div>
              <p className="mb-0 mt-1">{c.text}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CommentSection;
