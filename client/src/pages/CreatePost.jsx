import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import PostEditor from '../components/PostEditor';

const CreatePost = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    try {
      const res = await api.post('/posts', data);
      toast.success('Post published!');
      navigate(`/post/${res.data.data.slug}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish post');
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 760 }}>
      <h2 className="fw-bold mb-4">Create a new post</h2>
      <PostEditor onSubmit={handleSubmit} submitLabel="Publish" />
    </div>
  );
};

export default CreatePost;
