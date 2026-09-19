import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { formatDate } from '../utils/readingTime';

const Dashboard = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ totalPosts: 0, totalViews: 0, totalLikes: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts/dashboard/mine');
      setPosts(res.data.data.posts);
      setStats(res.data.data.stats);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success('Post deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete post');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-1">Welcome back, {user?.name}</h2>
      <p className="text-muted mb-4">Here's how your blog is doing.</p>

      <div className="row g-3 mb-5">
        <div className="col-md-4">
          <div className="border rounded-3 p-4 bg-white">
            <div className="text-muted small">Total Posts</div>
            <div className="fs-2 fw-bold">{stats.totalPosts}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="border rounded-3 p-4 bg-white">
            <div className="text-muted small">Total Views</div>
            <div className="fs-2 fw-bold">{stats.totalViews}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="border rounded-3 p-4 bg-white">
            <div className="text-muted small">Total Likes</div>
            <div className="fs-2 fw-bold">{stats.totalLikes}</div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">My Posts</h4>
        <Link to="/create" className="btn btn-dark btn-sm">+ New Post</Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted">You haven't written any posts yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle bg-white">
            <thead>
              <tr>
                <th>Cover</th>
                <th>Title</th>
                <th>Category</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p._id}>
                  <td>
                    <img
                      src={p.coverImage || 'https://placehold.co/80x60?text=BV'}
                      alt={p.title}
                      style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6 }}
                    />
                  </td>
                  <td className="fw-semibold">{p.title}</td>
                  <td><span className="badge bg-light text-dark border">{p.category}</span></td>
                  <td>{p.views}</td>
                  <td>{p.likes?.length || 0}</td>
                  <td className="text-muted small">{formatDate(p.createdAt)}</td>
                  <td className="text-end">
                    <Link to={`/edit/${p._id}`} className="btn btn-sm btn-outline-secondary me-2">Edit</Link>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
