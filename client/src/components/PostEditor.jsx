import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'react-toastify';
import api from '../services/api';

const CATEGORIES = ['Tech', 'Travel', 'Food', 'Lifestyle', 'Coding', 'General'];

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ header: [1, 2, 3, false] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

const PostEditor = ({ initial, onSubmit, submitLabel }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [category, setCategory] = useState(initial?.category || 'General');
  const [content, setContent] = useState(initial?.content || '');
  const [coverImage, setCoverImage] = useState(initial?.coverImage || '');
  const [tags, setTags] = useState(initial?.tags || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [rewriting, setRewriting] = useState(null);

  const plainTextLength = content.replace(/<[^>]*>/g, '').length;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCoverImage(res.data.data.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const plainContentText = content.replace(/<[^>]*>/g, ' ').trim();

  const handleGenerateTitleTags = async () => {
    if (!plainContentText || plainContentText.length < 20) {
      toast.error('Write at least a bit of content first, then generate titles & tags');
      return;
    }
    setGeneratingTitles(true);
    setTitleSuggestions([]);
    try {
      const res = await api.post('/ai/generate-title-tags', { content });
      setTitleSuggestions(res.data.data.titles);
      setTags((prev) => {
        const merged = [...prev, ...res.data.data.tags];
        return [...new Set(merged.map((t) => t.toLowerCase().trim()))].slice(0, 8);
      });
      toast.success('Titles and tags generated — pick a title below');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate titles and tags');
    } finally {
      setGeneratingTitles(false);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleRewrite = async (mode) => {
    if (!plainContentText || plainContentText.length < 10) {
      toast.error('Write some content first');
      return;
    }
    setRewriting(mode);
    try {
      const res = await api.post('/ai/rewrite', { text: plainContentText, mode });
      const rewrittenHtml = res.data.data.rewritten
        .split('\n')
        .filter(Boolean)
        .map((line) => `<p>${line}</p>`)
        .join('');
      setContent(rewrittenHtml);
      setErrors((prev) => ({ ...prev, content: undefined }));
      toast.success('Content rewritten — review before publishing');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rewrite text');
    } finally {
      setRewriting(null);
    }
  };

  const validateTitle = (value) => {
    if (!value.trim()) return 'Title is required';
    if (value.trim().length < 5) return 'Title should be at least 5 characters';
    return undefined;
  };

  const validateContentValue = (value) => {
    const isEmpty = !value.trim() || value === '<p><br></p>';
    return isEmpty ? 'Content is required — write something before publishing' : undefined;
  };

  const validate = () => {
    const newErrors = {
      title: validateTitle(title),
      content: validateContentValue(content),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((err) => !err);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ title, category, content, coverImage, tags });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="text-muted small mb-3">
        <span className="text-danger">*</span> indicates a required field
      </p>

      <div className="mb-3">
        <label className="form-label">
          Title <span className="text-danger">*</span>
        </label>
        <input
          className={`form-control ${errors.title ? 'is-invalid' : ''}`}
          value={title}
          onChange={(e) => {
            const value = e.target.value;
            setTitle(value);
            setErrors((prev) => {
              if (!prev.title && !value) return prev;
              return { ...prev, title: validateTitle(value) };
            });
          }}
          maxLength={150}
          placeholder="e.g. Understanding REST APIs: A Beginner's Guide"
        />
        {errors.title && <div className="invalid-feedback">{errors.title}</div>}

        {titleSuggestions.length > 0 && (
          <div className="mt-2">
            <div className="text-muted small mb-1">
              <i className="bi bi-stars me-1"></i>AI suggestions — click to use:
            </div>
            <div className="d-flex flex-column gap-1">
              {titleSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn btn-sm btn-outline-secondary text-start"
                  onClick={() => { setTitle(suggestion); setErrors((prev) => ({ ...prev, title: undefined })); setTitleSuggestions([]); }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">
            Category <span className="text-danger">*</span>
          </label>
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Cover Image <span className="text-muted fw-normal">(optional)</span>
          </label>
          <input type="file" className="form-control" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
        </div>
      </div>

      {uploading && <p className="text-muted small">Uploading image...</p>}
      {coverImage && <img src={coverImage} alt="cover preview" className="img-fluid rounded mb-3" style={{ maxHeight: 220, objectFit: 'cover' }} />}

      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <label className="form-label mb-0">
            Tags <span className="text-muted fw-normal">(optional)</span>
          </label>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={handleGenerateTitleTags}
            disabled={generatingTitles}
          >
            <i className="bi bi-stars me-1"></i>
            {generatingTitles ? 'Generating...' : 'Generate Title & Tags with AI'}
          </button>
        </div>
        {tags.length > 0 ? (
          <div className="d-flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="badge bg-light text-dark border d-flex align-items-center gap-1">
                {tag}
                <button
                  type="button"
                  className="btn-close btn-close-sm"
                  style={{ fontSize: '0.6rem' }}
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                ></button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted small mb-0">No tags yet — write some content and click "Generate" above.</p>
        )}
      </div>

      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
          <label className="form-label mb-0">
            Content <span className="text-danger">*</span>
          </label>
          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleRewrite('grammar')}
              disabled={rewriting !== null}
            >
              {rewriting === 'grammar' ? 'Fixing...' : 'Fix Grammar'}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleRewrite('professional')}
              disabled={rewriting !== null}
            >
              {rewriting === 'professional' ? 'Rewriting...' : 'Make Professional'}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleRewrite('simple')}
              disabled={rewriting !== null}
            >
              {rewriting === 'simple' ? 'Rewriting...' : 'Make Simple'}
            </button>
          </div>
        </div>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={(value) => {
            setContent(value);
            setErrors((prev) => {
              if (!prev.content && (!value.trim() || value === '<p><br></p>')) return prev;
              return { ...prev, content: validateContentValue(value) };
            });
          }}
          modules={QUILL_MODULES}
          style={{ height: 260, marginBottom: 40 }}
          className={errors.content ? 'is-invalid border border-danger rounded' : ''}
        />
        {errors.content && <div className="text-danger small mt-1">{errors.content}</div>}
        <div className="form-text text-end">{plainTextLength} characters</div>
      </div>

      <div className="d-flex gap-2 mt-4">
        <button type="submit" className="btn btn-dark" disabled={saving || uploading}>
          {saving ? 'Saving...' : submitLabel}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => window.history.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PostEditor;