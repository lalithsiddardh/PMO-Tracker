import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly, pmOnly, adminOrPm }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const id = setTimeout(() => setTimedOut(true), 5000);
      return () => clearTimeout(id);
    }
  }, [isLoading]);

  if (isLoading) {
    if (timedOut) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">Loading timed out. Please try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const role = user?.role;

  if (adminOnly && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (pmOnly && role !== 'PM' && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (adminOrPm && role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'PM') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
