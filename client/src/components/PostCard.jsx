import { Link } from 'react-router-dom';
import { getReadingTime, formatDate } from '../utils/readingTime';

const PLACEHOLDER = 'https://placehold.co/600x400?text=BlogVerse';

const PostCard = ({ post }) => {
  const readingTime = getReadingTime(post.content);

  return (
    <Link to={`/post/${post.slug}`} className="text-decoration-none text-dark">
      <div className="bv-card">
        <img src={post.coverImage || PLACEHOLDER} alt={post.title} className="cover" />
        <div className="p-3">
          <span className="badge bg-light text-dark border bv-badge mb-2">{post.category}</span>
          <h5 className="fw-bold mb-1">{post.title}</h5>
          <p className="text-muted small mb-3">{post.excerpt}</p>

          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <img
                src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'U')}`}
                alt={post.author?.name}
                className="bv-avatar"
              />
              <div>
                <div className="small fw-semibold">{post.author?.name}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {formatDate(post.createdAt)} · {readingTime} min read
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 mt-3 text-muted small">
            <span><i className="bi bi-heart-fill text-danger me-1"></i>{post.likes?.length || 0}</span>
            <span><i className="bi bi-eye-fill me-1"></i>{post.views || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
