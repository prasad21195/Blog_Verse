import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostEditor from '../components/PostEditor';
import Loader from '../components/Loader';

const EditPost = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // We only have slug-based GET, so we fetch via dashboard list and
        // find by id, keeping the API surface small.
        const res = await api.get('/posts/dashboard/mine');
        const found = res.data.data.posts.find((p) => p._id === id);
        if (!found) {
          toast.error('Post not found or you do not own this post');
          navigate('/dashboard');
          return;
        }
        setPost(found);
      } catch (err) {
        toast.error('Failed to load post');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  const handleSubmit = async (data) => {
    try {
      const res = await api.put(`/posts/${id}`, data);
      toast.success('Post updated!');
      navigate(`/post/${res.data.data.slug}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update post');
    }
  };

  if (loading) return <Loader />;
  if (!post) return null;

  return (
    <div className="container py-5" style={{ maxWidth: 760 }}>
      <h2 className="fw-bold mb-4">Edit post</h2>
      <PostEditor initial={post} onSubmit={handleSubmit} submitLabel="Save changes" />
    </div>
  );
};

export default EditPost;
