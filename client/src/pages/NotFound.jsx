import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="container text-center py-5">
    <h1 className="display-4 fw-bold">404</h1>
    <p className="text-muted mb-4">Page not found.</p>
    <Link to="/" className="btn btn-dark">Back to Home</Link>
  </div>
);

export default NotFound;
