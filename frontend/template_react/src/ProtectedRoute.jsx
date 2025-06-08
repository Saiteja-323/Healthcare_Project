// src/ProtectedRoute.jsx
import { useAuth } from './AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading authentication state...</div>; // Or a spinner component
    }

    if (!user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to so we can send them along after they login.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        // User is logged in but doesn't have the required role.
        // Redirect to home or an "unauthorized" page.
        // Consider if admin should access employee routes or vice-versa.
        // For now, strictly enforce the role.
        return <Navigate to="/" state={{ from: location }} replace />; 
    }

    return children;
};

export default ProtectedRoute;