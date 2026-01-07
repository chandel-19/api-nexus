import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        console.log('Processing auth callback...', { hash, sessionId });

        if (!sessionId) {
          console.error('No session_id found in URL');
          navigate('/login');
          return;
        }

        console.log('Exchanging session_id for user data...');

        // Exchange session_id for user data
        const response = await axios.post(
          `${BACKEND_URL}/api/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        const userData = response.data;
        console.log('Auth successful! User:', userData);

        // Navigate to dashboard with user data
        navigate('/dashboard', { state: { user: userData }, replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        console.error('Error details:', error.response?.data);
        
        // Show user-friendly error
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
        <p className="text-zinc-600 text-sm mt-2">Please wait while we verify your credentials</p>
      </div>
    </div>
  );
};

export default AuthCallback;
