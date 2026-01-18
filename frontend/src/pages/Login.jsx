import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from '../hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (!clientId) return;
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !scriptLoaded || !buttonRef.current) return;
    const handleCredential = async (response) => {
      if (!response?.credential) {
        toast({ title: 'Google sign-in failed', variant: 'destructive' });
        return;
      }
      setLoading(true);
      try {
        const authResponse = await axios.post(
          `${BACKEND_URL}/api/auth/google`,
          { id_token: response.credential },
          { withCredentials: true }
        );

        const userData = authResponse.data;
        await new Promise(resolve => setTimeout(resolve, 300));

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

        localStorage.setItem('auth_user', JSON.stringify(userData));
        localStorage.setItem('auth_orgs', JSON.stringify(organizations));
        localStorage.setItem('auth_timestamp', Date.now().toString());

        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Google login error:', error);
        toast({
          title: 'Authentication failed',
          description: error.response?.data?.detail || error.message,
          variant: 'destructive'
        });
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    buttonRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 360
    });
  }, [BACKEND_URL, clientId, navigate, scriptLoaded]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center transform rotate-12 transition-transform hover:rotate-0">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-zinc-100 mb-2">API Nexus</h2>
          <p className="text-zinc-400 text-lg">Your powerful API testing companion</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-zinc-100">Welcome back</h3>
              <p className="text-zinc-500 text-sm">
                Sign in to access your API collections and workspaces
              </p>
            </div>

            {clientId ? (
              <div className="flex justify-center">
                <div ref={buttonRef} className="w-full flex justify-center" />
              </div>
            ) : (
              <div className="text-sm text-red-500">
                Google login is not configured. Set REACT_APP_GOOGLE_CLIENT_ID.
              </div>
            )}

            {loading && (
              <p className="text-xs text-zinc-500 text-center">Signing you in...</p>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-zinc-600 text-sm">
            Join thousands of developers building amazing APIs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
