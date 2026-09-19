import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/readingTime';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatarUrl = user.avatar;

      if (avatarFile) {
        const formData = new FormData();
        formData.append('image', avatarFile);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        avatarUrl = uploadRes.data.data.url;
      }

      const res = await api.put('/users/profile', { name, avatar: avatarUrl });
      updateUser(res.data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      <h2 className="fw-bold mb-4">Your Profile</h2>

      <div className="text-center mb-4">
        <img
          src={preview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`}
          alt="avatar"
          className="bv-avatar-lg mb-2"
        />
        <div>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="form-control form-control-sm mt-2" />
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" value={user?.email} disabled />
          <div className="form-text">Email cannot be changed without verification.</div>
        </div>
        <div className="mb-3">
          <label className="form-label">Joined</label>
          <input className="form-control" value={formatDate(user?.createdAt)} disabled />
        </div>
        <button className="btn btn-dark w-100" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
