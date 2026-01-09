import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          navigate('/login');
          return;
        }

        // Exchange session_id for user data
        const response = await axios.post(
          `${BACKEND_URL}/api/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        const userData = response.data;

        // Wait for cookie to be set
        await new Promise(resolve => setTimeout(resolve, 500));

        // Fetch organizations with retries
        let organizations = [];
        for (let i = 0; i < 5; i++) {
          try {
            const orgsResponse = await axios.get(
              `${BACKEND_URL}/api/organizations`,
              { withCredentials: true }
            );
            organizations = orgsResponse.data;
            break;
          } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        // Store in localStorage - this is synchronous and reliable
        localStorage.setItem('auth_user', JSON.stringify(userData));
        localStorage.setItem('auth_orgs', JSON.stringify(organizations));
        localStorage.setItem('auth_timestamp', Date.now().toString());

        // Navigate to dashboard
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Auth callback error:', error);
        alert('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-zinc-700 border-t-blue-600 mb-4"></div>
        <p className="text-zinc-400">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
