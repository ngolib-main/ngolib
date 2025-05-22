/*
 * -- PROTECTED ROUTE --
 * This file helps restricting access to certain routes
 * according to user's authentication status
 *
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/auth/me", {
            credentials: "include"
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                setUser(data);
                setLoading(false);
            })
            .catch(() => {
                setUser(null);
                setLoading(false);
            });
    }, []);

    if (loading) return null; // Or show a spinner

    if (!user) return <Navigate to="/login" replace />;
    if (!allowedRoles.includes(user.type)) {
        // Redirect to the correct route for their role
        if (user.type === "admin") return <Navigate to="/admin" replace />;
        if (user.type === "NGO") return <Navigate to="/profile" replace />;
        if (user.type === "user") return <Navigate to="/user" replace />;
        return <Navigate to="/home" replace />;
    }

    return children;
}

export default ProtectedRoute;
