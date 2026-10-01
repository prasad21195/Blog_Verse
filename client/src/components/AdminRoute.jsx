import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <Loader />;
  if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/" replace />;

  return children;
};

export default AdminRoute;