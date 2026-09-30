import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import CommentSection from '../components/CommentSection';
import { getReadingTime, formatDate } from '../utils/readingTime';

const PostDetails = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/posts/${slug}`);
        setPost(res.data.data);
      } catch (err) {
        toast.error('Post not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, navigate]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.info('Login to like this post');
      return;
    }
    setLiking(true);
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setPost((prev) => ({ ...prev, likes: res.data.data.isLiked
        ? [...(prev.likes || []), user._id]
        : (prev.likes || []).filter((id) => id !== user._id) }));
    } catch (err) {
      toast.error('Failed to like post');
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async (type) => {
    const url = window.location.href;
    if (type === 'copy') {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } else if (type === 'native' && navigator.share) {
      navigator.share({ title: post.title, url });
    } else if (type === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`, '_blank');
    } else if (type === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  const handleSummarize = async () => {
    if (!isAuthenticated) {
      toast.info('Login to summarize this post');
      return;
    }
    setSummarizing(true);
    try {
      const res = await api.post(`/posts/${post._id}/summarize`, {
        title: post.title,
        content: post.content,
      });
      setSummary(res.data.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate summary');
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) return <Loader />;
  if (!post) return null;

  const isLiked = isAuthenticated && post.likes?.includes(user._id);
  const readingTime = getReadingTime(post.content);
  const cleanHtml = DOMPurify.sanitize(post.content);

  return (
    <div className="container py-5" style={{ maxWidth: 760 }}>
      {post.coverImage && <img src={post.coverImage} alt={post.title} className="w-100 rounded mb-4" style={{ maxHeight: 420, objectFit: 'cover' }} />}

      <span className="badge bg-light text-dark border mb-2">{post.category}</span>
      {post.tags?.length > 0 && (
        <span className="ms-2">
          {post.tags.map((tag) => (
            <span key={tag} className="badge bg-light text-muted border me-1" style={{ fontWeight: 400 }}>
              #{tag}
            </span>
          ))}
        </span>
      )}
      <h1 className="fw-bold mb-3">{post.title}</h1>

      <div className="d-flex align-items-center gap-2 mb-4 text-muted small">
        <img
          src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'U')}`}
          className="bv-avatar"
          alt={post.author?.name}
        />
        <div>
          <div className="fw-semibold text-dark">{post.author?.name}</div>
          <div>{formatDate(post.createdAt)} · {readingTime} min read · {post.views} views</div>
        </div>
      </div>

      <div className="bv-content" dangerouslySetInnerHTML={{ __html: cleanHtml }} />

      <div className="d-flex align-items-center gap-3 mt-5 pt-3 border-top flex-wrap">
        <button className={`btn btn-sm ${isLiked ? 'btn-danger' : 'btn-outline-danger'}`} onClick={handleLike} disabled={liking}>
          <i className="bi bi-heart-fill me-1"></i> {post.likes?.length || 0}
        </button>

        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleShare('copy')}>
          <i className="bi bi-link-45deg"></i> Copy link
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleShare('twitter')}>
          <i className="bi bi-twitter-x"></i>
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleShare('linkedin')}>
          <i className="bi bi-linkedin"></i>
        </button>

        <button className="btn btn-sm btn-outline-primary ms-auto" onClick={handleSummarize} disabled={summarizing}>
          <i className="bi bi-stars me-1"></i>
          {summarizing ? 'Summarizing...' : 'Summarize with AI'}
        </button>
      </div>

      {summary && (
        <div className="border rounded-3 p-3 mt-3 bg-light">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="fw-semibold small text-muted">
              <i className="bi bi-stars me-1"></i>AI Summary
            </span>
            <button className="btn btn-sm btn-link text-muted p-0" onClick={() => setSummary(null)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {summary.split('\n').filter(Boolean).map((line, i) => (
            <p key={i} className="mb-1">{line}</p>
          ))}
        </div>
      )}

      <CommentSection postId={post._id} />
    </div>
  );
};

export default PostDetails;