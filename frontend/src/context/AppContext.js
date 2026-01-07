import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  mockUser,
  mockOrganizations,
  mockCollections,
  mockRequests,
  mockHistory,
  mockEnvironments
} from '../mock';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(mockUser);
  const [organizations, setOrganizations] = useState(mockOrganizations);
  const [currentOrg, setCurrentOrg] = useState(mockOrganizations[0]);
  const [collections, setCollections] = useState(mockCollections);
  const [requests, setRequests] = useState(mockRequests);
  const [history, setHistory] = useState(mockHistory);
  const [environments, setEnvironments] = useState(mockEnvironments);
  const [currentEnv, setCurrentEnv] = useState(mockEnvironments[0]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Filter data by current org
  const orgCollections = collections.filter(c => c.org_id === currentOrg?.org_id);
  const orgRequests = requests.filter(r => r.org_id === currentOrg?.org_id);
  const orgEnvironments = environments.filter(e => e.org_id === currentOrg?.org_id);
  const orgHistory = history.filter(h => h.org_id === currentOrg?.org_id);

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
      org_id: currentOrg.org_id,
      name: 'Untitled Request',
      method: 'GET',
      url: '',
      headers: [{ key: '', value: '', enabled: true }],
      params: [{ key: '', value: '', enabled: true }],
      body: { type: 'none', content: '' },
      auth: { type: 'none' },
      created_at: new Date().toISOString()
    };
    openRequestInTab(newRequest);
  };

  // Update request
  const updateRequest = (requestId, updates) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.request_id === requestId ? { ...tab, ...updates } : tab
    ));
    setRequests(prev => prev.map(req => 
      req.request_id === requestId ? { ...req, ...updates } : req
    ));
  };

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        createNewRequest();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentOrg]);

  const value = {
    user,
    setUser,
    organizations,
    currentOrg,
    setCurrentOrg,
    collections: orgCollections,
    requests: orgRequests,
    history: orgHistory,
    environments: orgEnvironments,
    currentEnv,
    setCurrentEnv,
    openTabs,
    activeTab,
    openRequestInTab,
    closeTab,
    createNewRequest,
    updateRequest,
    commandPaletteOpen,
    setCommandPaletteOpen
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
