import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Initialize from localStorage synchronously
  const getInitialUser = () => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  };

  const getInitialOrgs = () => {
    try {
      const stored = localStorage.getItem('auth_orgs');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  const getInitialHistory = () => {
    try {
      const stored = localStorage.getItem('request_history');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  const initialUser = getInitialUser();
  const initialOrgs = getInitialOrgs();
  const initialHistory = getInitialHistory();

  const [user, setUser] = useState(initialUser);
  const [organizations, setOrganizations] = useState(initialOrgs);
  const [currentOrg, setCurrentOrg] = useState(initialOrgs[0] || null);
  const [currentOrgRole, setCurrentOrgRole] = useState(null);
  const [collections, setCollections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState(initialHistory);
  const [environments, setEnvironments] = useState([]);
  const [currentEnv, setCurrentEnv] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [loading, setLoading] = useState(!initialUser);

  // Validate session and refresh data on mount
  useEffect(() => {
    const validateAndRefresh = async () => {
      try {
        // Verify session is still valid
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setUser(response.data);
        localStorage.setItem('auth_user', JSON.stringify(response.data));

        // Refresh organizations
        const orgsResponse = await axios.get(`${API}/organizations`, { withCredentials: true });
        setOrganizations(orgsResponse.data);
        localStorage.setItem('auth_orgs', JSON.stringify(orgsResponse.data));
        
        if (orgsResponse.data.length > 0 && !currentOrg) {
          setCurrentOrg(orgsResponse.data[0]);
        }
      } catch (error) {
        // Session invalid - clear localStorage
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_orgs');
        localStorage.removeItem('auth_timestamp');
        setUser(null);
        setOrganizations([]);
      }
      setLoading(false);
    };

    if (initialUser) {
      validateAndRefresh();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load organization-specific data
  useEffect(() => {
    const loadOrgData = async () => {
      if (currentOrg && user) {
        try {
          const [roleRes, collectionsRes, requestsRes, envsRes] = await Promise.all([
            axios.get(`${API}/organizations/${currentOrg.org_id}/my-role`, { withCredentials: true }),
            axios.get(`${API}/organizations/${currentOrg.org_id}/collections`, { withCredentials: true }),
            axios.get(`${API}/organizations/${currentOrg.org_id}/requests`, { withCredentials: true }),
            axios.get(`${API}/organizations/${currentOrg.org_id}/environments`, { withCredentials: true })
          ]);

          setCurrentOrgRole(roleRes.data.role);
          setCollections(collectionsRes.data);
          setRequests(requestsRes.data);
          setEnvironments(envsRes.data);
          if (envsRes.data.length > 0) setCurrentEnv(envsRes.data[0]);
          // Note: History is managed locally via localStorage, not from API
        } catch (error) {
          console.error('Failed to load org data:', error);
        }
      }
    };
    loadOrgData();
  }, [currentOrg, user]);

  const refreshCollections = async () => {
    if (currentOrg) {
      try {
        const [collectionsRes, requestsRes] = await Promise.all([
          axios.get(`${API}/organizations/${currentOrg.org_id}/collections`, { withCredentials: true }),
          axios.get(`${API}/organizations/${currentOrg.org_id}/requests`, { withCredentials: true })
        ]);
        setCollections(collectionsRes.data);
        setRequests(requestsRes.data);
      } catch (error) {
        console.error('Failed to refresh collections:', error);
      }
    }
  };

  // Add request to local history (max 100 items)
  const addToHistory = (request, response) => {
    const historyItem = {
      id: `hist_${Date.now()}`,
      method: request.method,
      url: request.url,
      name: request.name || 'Untitled Request',
      status: response?.status || 0,
      statusText: response?.statusText || 'Error',
      time: response?.time || 0,
      timestamp: new Date().toISOString(),
      request: {
        headers: request.headers,
        params: request.params,
        body: request.body,
        auth: request.auth
      }
    };

    setHistory(prev => {
      const newHistory = [historyItem, ...prev].slice(0, 100);
      localStorage.setItem('request_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('request_history');
  };

  const openRequestInTab = (request) => {
    const existingTab = openTabs.find(tab => tab.request_id === request.request_id);
    if (existingTab) {
      setActiveTab(existingTab.request_id);
    } else {
      setOpenTabs(prev => [...prev, request]);
      setActiveTab(request.request_id);
    }
  };

  const closeTab = (requestId) => {
    const tabIndex = openTabs.findIndex(tab => tab.request_id === requestId);
    const newTabs = openTabs.filter(tab => tab.request_id !== requestId);
    setOpenTabs(newTabs);
    if (activeTab === requestId) {
      if (newTabs.length > 0) {
        setActiveTab(newTabs[tabIndex > 0 ? tabIndex - 1 : 0]?.request_id);
      } else {
        setActiveTab(null);
      }
    }
  };

  const createNewRequest = () => {
    const newRequest = {
      request_id: `req_new_${Date.now()}`,
      collection_id: null,
      org_id: currentOrg?.org_id,
      name: 'Untitled Request',
      method: 'GET',
      url: '',
      headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
      params: [],
      body: { type: 'none', content: '' },
      auth: { type: 'none' },
      created_at: new Date().toISOString()
    };
    openRequestInTab(newRequest);
  };

  const updateRequest = (requestId, updates) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.request_id === requestId ? { ...tab, ...updates } : tab
    ));
  };

  const saveRequest = async (request) => {
    if (request.request_id.startsWith('req_new_')) {
      const response = await axios.post(`${API}/requests`, request, { withCredentials: true });
      const savedRequest = response.data;
      setOpenTabs(prev => prev.map(tab => tab.request_id === request.request_id ? savedRequest : tab));
      setActiveTab(savedRequest.request_id);
      setRequests(prev => [...prev, savedRequest]);
      return savedRequest;
    } else {
      const response = await axios.put(`${API}/requests/${request.request_id}`, request, { withCredentials: true });
      const updatedRequest = response.data;
      setRequests(prev => prev.map(r => r.request_id === request.request_id ? updatedRequest : r));
      return updatedRequest;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      // Ignore logout errors
    }
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_orgs');
    localStorage.removeItem('auth_timestamp');
    setUser(null);
    setOrganizations([]);
    setCurrentOrg(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.ctrlKey && !e.metaKey && e.key === 't') {
        e.preventDefault();
        createNewRequest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg]);

  const value = {
    user, setUser, organizations, currentOrg, setCurrentOrg, currentOrgRole,
    collections, requests, history, environments, currentEnv, setCurrentEnv,
    openTabs, activeTab, setActiveTab, openRequestInTab, closeTab,
    createNewRequest, updateRequest, saveRequest, refreshCollections,
    commandPaletteOpen, setCommandPaletteOpen, loading, logout,
    addToHistory, clearHistory
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
