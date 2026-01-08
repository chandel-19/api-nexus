import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [currentOrgRole, setCurrentOrgRole] = useState(null);
  const [collections, setCollections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [currentEnv, setCurrentEnv] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user data if not already loaded
  useEffect(() => {
    const loadUser = async () => {
      if (!user) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            withCredentials: true
          });
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          setLoading(false);
        }
      }
    };
    loadUser();
  }, [user]);

  // Load organizations when user is available
  useEffect(() => {
    const loadOrganizations = async () => {
      if (user) {
        try {
          const response = await axios.get(`${API}/organizations`, {
            withCredentials: true
          });
          setOrganizations(response.data);
          if (response.data.length > 0) {
            setCurrentOrg(response.data[0]);
          }
          setLoading(false);
        } catch (error) {
          console.error('Failed to load organizations:', error);
          setLoading(false);
        }
      }
    };
    loadOrganizations();
  }, [user]);

  // Load organization-specific data
  useEffect(() => {
    const loadOrgData = async () => {
      if (currentOrg) {
        try {
          // Load collections
          const collectionsRes = await axios.get(
            `${API}/organizations/${currentOrg.org_id}/collections`,
            { withCredentials: true }
          );
          setCollections(collectionsRes.data);

          // Load requests
          const requestsRes = await axios.get(
            `${API}/organizations/${currentOrg.org_id}/requests`,
            { withCredentials: true }
          );
          setRequests(requestsRes.data);

          // Load environments
          const envsRes = await axios.get(
            `${API}/organizations/${currentOrg.org_id}/environments`,
            { withCredentials: true }
          );
          setEnvironments(envsRes.data);
          if (envsRes.data.length > 0) {
            setCurrentEnv(envsRes.data[0]);
          }

          // Load history
          const historyRes = await axios.get(
            `${API}/organizations/${currentOrg.org_id}/history`,
            { withCredentials: true }
          );
          setHistory(historyRes.data);
        } catch (error) {
          console.error('Failed to load org data:', error);
        }
      }
    };
    loadOrgData();
  }, [currentOrg]);

  // Refresh collections function
  const refreshCollections = async () => {
    if (currentOrg) {
      try {
        const collectionsRes = await axios.get(
          `${API}/organizations/${currentOrg.org_id}/collections`,
          { withCredentials: true }
        );
        setCollections(collectionsRes.data);

        // Also refresh requests in case they were affected
        const requestsRes = await axios.get(
          `${API}/organizations/${currentOrg.org_id}/requests`,
          { withCredentials: true }
        );
        setRequests(requestsRes.data);
      } catch (error) {
        console.error('Failed to refresh collections:', error);
      }
    }
  };

  // Add request to tab
  const openRequestInTab = (request) => {
    const existingTab = openTabs.find(tab => tab.request_id === request.request_id);
    if (existingTab) {
      setActiveTab(existingTab.request_id);
    } else {
      setOpenTabs(prev => [...prev, request]);
      setActiveTab(request.request_id);
    }
  };

  // Close tab
  const closeTab = (requestId) => {
    const tabIndex = openTabs.findIndex(tab => tab.request_id === requestId);
    const newTabs = openTabs.filter(tab => tab.request_id !== requestId);
    setOpenTabs(newTabs);

    if (activeTab === requestId) {
      if (newTabs.length > 0) {
        const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
        setActiveTab(newTabs[newActiveIndex]?.request_id);
      } else {
        setActiveTab(null);
      }
    }
  };

  // Create new request tab
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

  // Update request (local state for unsaved changes)
  const updateRequest = (requestId, updates) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.request_id === requestId ? { ...tab, ...updates } : tab
    ));
  };

  // Save request to backend
  const saveRequest = async (request) => {
    try {
      if (request.request_id.startsWith('req_new_')) {
        // Create new request
        const response = await axios.post(
          `${API}/requests`,
          request,
          { withCredentials: true }
        );
        const savedRequest = response.data;
        
        // Update tabs and requests list
        setOpenTabs(prev => prev.map(tab =>
          tab.request_id === request.request_id ? savedRequest : tab
        ));
        setActiveTab(savedRequest.request_id);
        setRequests(prev => [...prev, savedRequest]);
        
        return savedRequest;
      } else {
        // Update existing request
        const response = await axios.put(
          `${API}/requests/${request.request_id}`,
          request,
          { withCredentials: true }
        );
        const updatedRequest = response.data;
        
        // Update local state
        setRequests(prev => prev.map(r =>
          r.request_id === request.request_id ? updatedRequest : r
        ));
        
        return updatedRequest;
      }
    } catch (error) {
      console.error('Failed to save request:', error);
      throw error;
    }
  };

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K - Command Palette (works everywhere)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      
      // Ctrl + T - New Request (Windows/Linux only - Cmd+T conflicts with browser on Mac)
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
    user,
    setUser,
    organizations,
    currentOrg,
    setCurrentOrg,
    collections,
    requests,
    history,
    environments,
    currentEnv,
    setCurrentEnv,
    openTabs,
    activeTab,
    setActiveTab,
    openRequestInTab,
    closeTab,
    createNewRequest,
    updateRequest,
    saveRequest,
    refreshCollections,
    commandPaletteOpen,
    setCommandPaletteOpen,
    loading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
