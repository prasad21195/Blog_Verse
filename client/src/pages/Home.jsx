import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';

const CATEGORIES = ['All', 'Tech', 'Travel', 'Food', 'Lifestyle', 'Coding', 'General'];

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const debounceRef = useRef(null);

  const fetchPosts = useCallback(async (searchVal, categoryVal, pageVal) => {
    setLoading(true);
    try {
      const params = { page: pageVal, limit: 9 };
      if (searchVal) params.search = searchVal;
      if (categoryVal && categoryVal !== 'All') params.category = categoryVal;
      const res = await api.get('/posts', { params });
      setPosts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(search, category, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, page]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    // Simple debounce so we don't fire a request on every keystroke
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchPosts(value, category, 1);
    }, 400);
  };

  return (
    <div>
      <div className="bv-hero">
        <h1>Share your ideas with the world.</h1>
        <p>Write, publish and discover stories across technology, travel, coding and more.</p>

        <div className="mx-auto mt-4" style={{ maxWidth: 480 }}>
          <input
            className="form-control form-control-lg rounded-pill px-4"
            placeholder="Search by title or topic..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="d-flex justify-content-center flex-wrap gap-2 mt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm category-pill ${category === cat ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => { setCategory(cat); setPage(1); }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="container pb-5">
        {loading ? (
          <Loader />
        ) : posts.length === 0 ? (
          <p className="text-center text-muted py-5">No posts found. Try a different search or category.</p>
        ) : (
          <div className="row g-4">
            {posts.map((post) => (
              <div className="col-12 col-md-6 col-lg-4" key={post._id}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="d-flex justify-content-center gap-2 mt-5">
            <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="align-self-center text-muted small">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
