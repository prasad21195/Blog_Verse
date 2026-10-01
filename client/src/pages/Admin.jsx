import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import Loader from '../components/Loader';
import { formatDate } from '../utils/readingTime';

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('overview'); // 'overview' | 'users' | 'posts'

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, postsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/posts'),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setPosts(postsRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete ${userName}'s account? This also deletes all their posts and comments. This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success('User deleted');
      fetchAll(); // refresh stats/posts since counts changed
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleDeletePost = async (postId, postTitle) => {
    if (!window.confirm(`Delete "${postTitle}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success('Post deleted');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete post');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-1">Admin Dashboard</h2>
      <p className="text-muted mb-4">Site-wide moderation and stats.</p>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
            Users ({users.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>
            All Posts ({posts.length})
          </button>
        </li>
      </ul>

      {tab === 'overview' && stats && (
        <div className="row g-3">
          <div className="col-md-4 col-6">
            <div className="border rounded-3 p-4 bg-white">
              <div className="text-muted small">Total Users</div>
              <div className="fs-2 fw-bold">{stats.totalUsers}</div>
            </div>
          </div>
          <div className="col-md-4 col-6">
            <div className="border rounded-3 p-4 bg-white">
              <div className="text-muted small">Total Posts</div>
              <div className="fs-2 fw-bold">{stats.totalPosts}</div>
            </div>
          </div>
          <div className="col-md-4 col-6">
            <div className="border rounded-3 p-4 bg-white">
              <div className="text-muted small">Total Comments</div>
              <div className="fs-2 fw-bold">{stats.totalComments}</div>
            </div>
          </div>
          <div className="col-md-4 col-6">
            <div className="border rounded-3 p-4 bg-white">
              <div className="text-muted small">Total Views</div>
              <div className="fs-2 fw-bold">{stats.totalViews}</div>
            </div>
          </div>
          <div className="col-md-4 col-6">
            <div className="border rounded-3 p-4 bg-white">
              <div className="text-muted small">Total Likes</div>
              <div className="fs-2 fw-bold">{stats.totalLikes}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="table-responsive">
          <table className="table align-middle bg-white">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="fw-semibold">{u.name}</td>
                  <td className="text-muted small">{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'bg-dark' : 'bg-light text-dark border'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="text-muted small">{formatDate(u.createdAt)}</td>
                  <td className="text-end">
                    {u.role !== 'admin' && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(u._id, u.name)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'posts' && (
        <div className="table-responsive">
          <table className="table align-middle bg-white">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
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
                  <td className="fw-semibold">{p.title}</td>
                  <td className="text-muted small">{p.author?.name} <br />{p.author?.email}</td>
                  <td><span className="badge bg-light text-dark border">{p.category}</span></td>
                  <td>{p.views}</td>
                  <td>{p.likes?.length || 0}</td>
                  <td className="text-muted small">{formatDate(p.createdAt)}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePost(p._id, p.title)}>
                      Delete
                    </button>
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

export default Admin;