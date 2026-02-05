import React, { useEffect, useRef, useState } from 'react';
import {
  Folder,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  Clock,
  Database,
  Building2,
  LogOut,
  Users,
  Edit2,
  Trash2,
  MoreVertical,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EnvironmentManager from './EnvironmentManager';
import OrganizationManager from './OrganizationManager';
import CollectionManager from './CollectionManager';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Sidebar = () => {
  const {
    collections,
    requests,
    history,
    openRequestInTab,
    createNewRequest,
    currentOrg,
    organizations,
    setCurrentOrg,
    user,
    refreshCollections,
    currentOrgRole,
    logout,
    clearHistory
  } = useApp();
  const fileInputRef = useRef(null);

  const buildExportUrl = (req) => {
    let url = req.url || '';
    const queryParams = (req.params || []).filter(p => p.enabled);
    if (queryParams.length > 0) {
      const paramsString = queryParams
        .map(p => `${encodeURIComponent(p.key || '')}=${encodeURIComponent(p.value || '')}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + paramsString;
    }
    return url || '/';
  };

  const handleExportCollection = (collection) => {
    try {
      const collectionRequests = requests.filter(
        r => r.collection_id === collection.collection_id
      );

      const exportData = {
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        info: {
          name: collection.name,
          description: collection.description || '',
          _postman_id: collection.collection_id,
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
        },
        item: collectionRequests.map(req => ({
          name: req.name || 'Untitled Request',
          request: {
            method: req.method,
            header: (req.headers || [])
              .filter(h => h.enabled)
              .map(h => ({ key: h.key, value: h.value })),
            url: buildExportUrl(req),
            body: req.body?.type && req.body?.type !== 'none'
              ? {
                  mode: req.body.type,
                  raw: req.body.content || ''
                }
              : undefined,
            auth: req.auth || { type: 'none' }
          }
        })),
        variables: [],
        metadata: {
          exportedFrom: 'API Nexus',
          exportedAt: new Date().toISOString(),
          collection: {
            collection_id: collection.collection_id,
            color: collection.color,
            pre_request_script: collection.pre_request_script || '',
            post_request_script: collection.post_request_script || ''
          }
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collection.name || 'collection'}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Collection exported',
        description: `${collection.name} exported successfully`
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error.message || 'Unable to export collection',
        variant: 'destructive'
      });
    }
  };

  const handleCreateFolder = async (collection) => {
    if (!collection) return;
    const input = window.prompt('Folder name (use "/" for nested folders):');
    const raw = (input || '').trim();
    if (!raw) return;
    const normalized = raw
      .split(/\s*\/\s*/)
      .map(part => part.trim())
      .filter(Boolean)
      .join(' / ');

    if (!normalized) return;
    const currentFolders = Array.isArray(collection.folders) ? collection.folders : [];
    if (currentFolders.includes(normalized)) {
      toast({ title: 'Folder already exists', description: normalized });
      return;
    }

    try {
      await axios.put(
        `${BACKEND_URL}/api/collections/${collection.collection_id}`,
        { folders: [...currentFolders, normalized] },
        { withCredentials: true }
      );
      await refreshCollections?.();
      toast({ title: 'Folder created', description: normalized });
    } catch (error) {
      toast({
        title: 'Failed to create folder',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  const navigate = useNavigate();
  const location = useLocation();
  const [expandedCollections, setExpandedCollections] = useState(new Set(['col_1']));
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [activeTab, setActiveTab] = useState('collections');
  const [showEnvironments, setShowEnvironments] = useState(false);
  const [showOrgManager, setShowOrgManager] = useState(false);
  const [showCollectionManager, setShowCollectionManager] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [deletingCollection, setDeletingCollection] = useState(null);
  const [collectionSearch, setCollectionSearch] = useState('');
  const getRawUrl = (url) => {
    if (!url) return '';
    if (typeof url === 'string') return url;
    if (url.raw) return url.raw;
    const protocol = url.protocol ? `${url.protocol}://` : '';
    const host = Array.isArray(url.host) ? url.host.join('.') : (url.host || '');
    const path = Array.isArray(url.path) ? `/${url.path.join('/')}` : (url.path ? `/${url.path}` : '');
    const query = Array.isArray(url.query) && url.query.length > 0
      ? `?${url.query.map(q => `${encodeURIComponent(q.key || '')}=${encodeURIComponent(q.value || '')}`).join('&')}`
      : '';
    return `${protocol}${host}${path}${query}`.trim();
  };

  const parseRequestBody = (body) => {
    if (!body || !body.mode) return { type: 'none', content: '' };
    if (body.mode === 'raw') {
      const content = body.raw || '';
      let type = 'raw';
      try {
        JSON.parse(content);
        type = 'json';
      } catch {
        // keep as raw
      }
      return { type, content };
    }
    if (body.mode === 'formdata' || body.mode === 'urlencoded') {
      const items = body[body.mode] || [];
      const content = items
        .filter(item => item && item.disabled !== true)
        .map(item => `${item.key || ''}=${item.value || ''}`)
        .join('&');
      return { type: 'form', content };
    }
    return { type: 'raw', content: body.raw || '' };
  };

  const parseAuth = (auth) => {
    if (!auth || !auth.type || auth.type === 'noauth') {
      return { type: 'none' };
    }
    if (auth.type === 'basic') {
      const user = auth.basic?.find(i => i.key === 'username')?.value || '';
      const pass = auth.basic?.find(i => i.key === 'password')?.value || '';
      return { type: 'basic', username: user, password: pass };
    }
    if (auth.type === 'bearer') {
      const token = auth.bearer?.find(i => i.key === 'token')?.value || '';
      return { type: 'bearer', token };
    }
    if (auth.type === 'apikey') {
      const key = auth.apikey?.find(i => i.key === 'key')?.value || '';
      const value = auth.apikey?.find(i => i.key === 'value')?.value || '';
      return { type: 'apikey', key, value };
    }
    return { type: 'none' };
  };

  const flattenItemsWithPath = (items, path = []) => {
    if (!Array.isArray(items)) return [];
    const results = [];
    items.forEach(item => {
      if (item?.item && Array.isArray(item.item)) {
        const folderName = item.name || 'Folder';
        results.push(...flattenItemsWithPath(item.item, [...path, folderName]));
      } else if (item?.request) {
        results.push({
          ...item,
          name: item.name || 'Untitled Request',
          folderPath: path
        });
      }
    });
    return results;
  };

  const buildRequestTree = (items, folderPaths = []) => {
    const root = { folders: {}, requests: [] };

    const ensureFolderPath = (segments) => {
      let node = root;
      segments.forEach((segment) => {
        const name = (segment || '').trim();
        if (!name) return;
        if (!node.folders[name]) {
          node.folders[name] = { folders: {}, requests: [] };
        }
        node = node.folders[name];
      });
    };

    (folderPaths || []).forEach((path) => {
      if (Array.isArray(path)) {
        ensureFolderPath(path);
      } else if (typeof path === 'string') {
        ensureFolderPath(path.split(/\s*\/\s*/));
      }
    });

    (items || []).forEach((req) => {
      const rawName = (req.name || 'Untitled Request').trim();
      const folderParts = Array.isArray(req.folder_path)
        ? req.folder_path.filter(Boolean).map(part => String(part).trim()).filter(Boolean)
        : [];
      const parts = folderParts.length > 0
        ? folderParts
        : rawName.split(/\s*\/\s*/).map(part => part.trim()).filter(Boolean).slice(0, -1);
      const leafName = folderParts.length > 0
        ? rawName
        : (rawName.split(/\s*\/\s*/).map(part => part.trim()).filter(Boolean).pop() || 'Untitled Request');
      let node = root;
      parts.forEach((part) => {
        if (!node.folders[part]) {
          node.folders[part] = { folders: {}, requests: [] };
        }
        node = node.folders[part];
      });
      node.requests.push({ ...req, _displayName: leafName });
    });

    const countRequests = (node) => {
      const childCounts = Object.values(node.folders || {}).reduce(
        (sum, child) => sum + countRequests(child),
        0
      );
      return (node.requests?.length || 0) + childCounts;
    };

    const toNodes = (node, path = '') => {
      const folderNodes = Object.keys(node.folders || {})
        .sort()
        .map((name) => {
          const nextPath = path ? `${path} / ${name}` : name;
          const childNode = node.folders[name];
          return {
            type: 'folder',
            name,
            path: nextPath,
            count: countRequests(childNode),
            children: toNodes(childNode, nextPath)
          };
        });
      const requestNodes = (node.requests || []).map((request) => ({
        type: 'request',
        request
      }));
      return [...folderNodes, ...requestNodes];
    };

    return toNodes(root);
  };

  const handleAddRequestInFolder = (collectionId, folderPath) => {
    if (!currentOrg?.org_id) return;
    const newRequest = {
      request_id: `req_new_${Date.now()}`,
      collection_id: collectionId || null,
      org_id: currentOrg.org_id,
      name: 'Untitled Request',
      method: 'GET',
      url: '',
      headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
      params: [],
      body: { type: 'none', content: '' },
      auth: { type: 'none' },
      folder_path: folderPath || [],
      created_at: new Date().toISOString()
    };
    openRequestInTab(newRequest);
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderRequestNodes = (collection, nodes, depth = 0) => {
    return nodes.map((node) => {
      if (node.type === 'folder') {
        const isOpen = expandedFolders.has(node.path);
        return (
          <div key={`folder-${node.path}`}>
            <div
              className="w-full px-4 py-2 flex items-center gap-2 text-zinc-400 hover:bg-zinc-800/40 transition-colors group"
              style={{ paddingLeft: 16 + depth * 12 }}
            >
              <button
                onClick={() => toggleFolder(node.path)}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                )}
                <Folder className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                <span className="text-sm truncate">{node.name}</span>
                <span className="text-xs text-zinc-500">{node.count}</span>
              </button>
              <button
                onClick={() => handleAddRequestInFolder(collection?.collection_id, node.path.split(/\s*\/\s*/))}
                className="opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded p-1 transition-opacity"
                title="Add request"
              >
                <Plus className="w-3 h-3 text-zinc-400" />
              </button>
            </div>
            {isOpen && renderRequestNodes(collection, node.children, depth + 1)}
          </div>
        );
      }

      const req = node.request;
      return (
        <button
          key={req.request_id}
          onClick={() => openRequestInTab(req)}
          className="w-full px-4 py-2 flex items-center gap-2 hover:bg-zinc-800/50 transition-colors group"
          style={{ paddingLeft: 16 + depth * 12 }}
        >
          <FileText className="w-3.5 h-3.5 text-zinc-600" />
          <span className={`text-xs font-medium ${getMethodColor(req.method)}`}>
            {req.method}
          </span>
          <span className="flex-1 text-left text-sm text-zinc-400 truncate group-hover:text-zinc-200 transition-colors">
            {req._displayName || req.name}
          </span>
        </button>
      );
    });
  };

  const handleImportCollection = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !currentOrg) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data?.info?.name || !Array.isArray(data?.item)) {
        throw new Error('Invalid Postman collection format');
      }

      const flatItems = flattenItemsWithPath(data.item);
      const folderPaths = Array.from(
        new Set(
          flatItems
            .map(item => (item.folderPath || []).map(part => part.trim()).filter(Boolean))
            .filter(path => path.length > 0)
            .map(path => path.join(' / '))
        )
      );

      const collectionPayload = {
        name: data.info.name || 'Imported Collection',
        description: data.info.description || '',
        color: '#3B82F6',
        pre_request_script: '',
        post_request_script: '',
        folders: folderPaths
      };

      const collectionRes = await axios.post(
        `${BACKEND_URL}/api/organizations/${currentOrg.org_id}/collections`,
        collectionPayload,
        { withCredentials: true }
      );

      const createdCollection = collectionRes.data;

      for (const item of flatItems) {
        const req = item.request || {};
        const url = getRawUrl(req.url);
        const params = Array.isArray(req.url?.query)
          ? req.url.query.map(q => ({
              key: q.key || '',
              value: q.value || '',
              enabled: q.disabled !== true
            }))
          : [];
        const headers = Array.isArray(req.header)
          ? req.header.map(h => ({
              key: h.key || '',
              value: h.value || '',
              enabled: h.disabled !== true
            }))
          : [];

        await axios.post(
          `${BACKEND_URL}/api/requests`,
          {
            collection_id: createdCollection.collection_id,
            name: item.name || req.name || 'Untitled Request',
            method: (req.method || 'GET').toUpperCase(),
            url: url || '/',
            headers,
            params,
            body: parseRequestBody(req.body),
            auth: parseAuth(req.auth),
            folder_path: item.folderPath || []
          },
          { withCredentials: true }
        );
      }

      await refreshCollections?.();
      toast({
        title: 'Collection imported',
        description: `${createdCollection.name} imported with ${flatItems.length} request${flatItems.length !== 1 ? 's' : ''}`
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error.message || 'Unable to import collection',
        variant: 'destructive'
      });
    } finally {
      event.target.value = '';
    }
  };


  useEffect(() => {
    if (location.pathname === '/collections') {
      setActiveTab('collections');
      setShowEnvironments(false);
      setShowOrgManager(false);
    } else if (location.pathname === '/history') {
      setActiveTab('history');
      setShowEnvironments(false);
      setShowOrgManager(false);
    } else if (location.pathname === '/environments') {
      setShowEnvironments(true);
      setShowOrgManager(false);
    } else if (location.pathname === '/organizations') {
      setShowOrgManager(true);
      setShowEnvironments(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('last_saved_location');
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved?.collection_id) return;
      setExpandedCollections(prev => new Set(prev).add(saved.collection_id));
      if (Array.isArray(saved.folder_path)) {
        let current = '';
        setExpandedFolders(prev => {
          const next = new Set(prev);
          saved.folder_path.forEach((part) => {
            current = current ? `${current} / ${part}` : part;
            next.add(current);
          });
          return next;
        });
      }
      localStorage.removeItem('last_saved_location');
    } catch {
      // ignore
    }
  }, [collections.length, requests.length]);

  // Permission checks
  const canEdit = currentOrgRole === 'edit' || currentOrgRole === 'admin';
  const isAdmin = currentOrgRole === 'admin';

  const toggleCollection = (collectionId) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteCollection = async () => {
    if (!deletingCollection) return;

    try {
      await axios.delete(
        `${BACKEND_URL}/api/collections/${deletingCollection.collection_id}`,
        { withCredentials: true }
      );

      toast({
        title: 'Collection deleted',
        description: `${deletingCollection.name} has been deleted successfully`,
      });

      // Refresh collections
      if (refreshCollections) {
        await refreshCollections();
      }

      setDeletingCollection(null);
    } catch (error) {
      toast({
        title: 'Failed to delete collection',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'text-green-400',
      POST: 'text-blue-400',
      PUT: 'text-yellow-400',
      DELETE: 'text-red-400',
      PATCH: 'text-purple-400'
    };
    return colors[method] || 'text-zinc-400';
  };

  const normalizedSearch = collectionSearch.trim().toLowerCase();
  const filteredCollections = normalizedSearch
    ? collections.filter(collection => {
        const nameMatch = collection.name?.toLowerCase().includes(normalizedSearch);
        const requestMatch = requests.some(req =>
          req.collection_id === collection.collection_id &&
          (req.name || '').toLowerCase().includes(normalizedSearch)
        );
        return nameMatch || requestMatch;
      })
    : collections;

  return (
    <>
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen">
        {/* Brand */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="font-semibold text-zinc-900">API Nexus</div>
          </div>

          {/* Org Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium truncate">{currentOrg?.name}</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800">
              {organizations.map(org => (
                <DropdownMenuItem
                  key={org.org_id}
                  onClick={() => setCurrentOrg(org)}
                  className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {org.name}
                  {org.type === 'personal' && (
                    <span className="ml-auto text-xs text-zinc-500">Personal</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => {
                setShowOrgManager(true);
                navigate('/organizations');
              }}
                className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Organizations
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Role Badge */}
          {currentOrgRole && (
            <div className="mt-2 flex items-center gap-2 px-2 py-1 bg-zinc-800 rounded text-xs">
              {currentOrgRole === 'admin' && <span className="text-purple-400">👑 Admin</span>}
              {currentOrgRole === 'edit' && <span className="text-blue-400">✏️ Editor</span>}
              {currentOrgRole === 'view' && <span className="text-zinc-400">👁️ Viewer</span>}
            </div>
          )}
        </div>

        {/* New Request Button */}
        <div className="p-4">
          <Button
            onClick={createNewRequest}
            disabled={!canEdit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canEdit ? "You need Edit or Admin access to create requests" : "Create a new request"}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => {
              setActiveTab('collections');
              navigate('/collections');
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'collections'
                ? 'text-zinc-100 border-b-2 border-blue-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Folder className="w-4 h-4 inline mr-2" />
            Collections
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              navigate('/history');
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-zinc-100 border-b-2 border-blue-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            History
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'collections' ? (
            <div className="py-2">
              <div className="px-4 pb-2">
                <input
                  type="text"
                  value={collectionSearch}
                  onChange={(e) => setCollectionSearch(e.target.value)}
                  placeholder="Search collections"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Create Collection Button (Edit/Admin only) */}
              {canEdit && (
                <div className="px-4 pb-2">
                  <Button
                    onClick={() => setShowCollectionManager(true)}
                    variant="ghost"
                    className="w-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-dashed border-zinc-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Collection
                  </Button>
                </div>
              )}
              {canEdit && (
                <div className="px-4 pb-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleImportCollection}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="ghost"
                    className="w-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-dashed border-zinc-700"
                  >
                    Import Collection
                  </Button>
                </div>
              )}

              {filteredCollections.map(collection => {
                const collectionRequests = requests.filter(
                  r => r.collection_id === collection.collection_id
                    && (!normalizedSearch || (r.name || '').toLowerCase().includes(normalizedSearch))
                );
                const isExpanded = expandedCollections.has(collection.collection_id);
                const requestTree = buildRequestTree(collectionRequests, collection.folders || []);

                return (
                  <div key={collection.collection_id}>
                    <div className="group px-4 py-2 flex items-center gap-2 hover:bg-zinc-800/50 transition-colors">
                      <button
                        onClick={() => toggleCollection(collection.collection_id)}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                        )}
                        <Folder
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: collection.color }}
                        />
                        <span className="flex-1 text-left text-sm text-zinc-300 truncate">
                          {collection.name}
                        </span>
                        <span className="text-xs text-zinc-600 flex-shrink-0">
                          {collectionRequests.length}
                        </span>
                      </button>

                      {/* Collection Actions (Edit/Admin only) */}
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-opacity">
                              <MoreVertical className="w-4 h-4 text-zinc-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                            <DropdownMenuItem
                            onClick={() => handleExportCollection(collection)}
                            className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Collection
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                              onClick={() => {
                                setEditingCollection(collection);
                              }}
                              className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Collection
                            </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCreateFolder(collection)}
                            className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                          >
                            <Folder className="w-4 h-4 mr-2" />
                            Create Folder
                          </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingCollection(collection)}
                              className="text-red-400 focus:bg-zinc-800 focus:text-red-300"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Collection
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="ml-4">
                        {renderRequestNodes(collection, requestTree)}
                        {collectionRequests.length === 0 && normalizedSearch && (
                          <div className="px-4 py-2 text-xs text-zinc-500">
                            No matching requests
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {collections.length === 0 && (
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                  No collections yet
                  <br />
                  <span className="text-xs text-zinc-600">Click &quot;Create Collection&quot; to get started</span>
                </div>
              )}

              {collections.length > 0 && filteredCollections.length === 0 && (
                <div className="px-4 py-6 text-center text-zinc-500 text-sm">
                  No collections match "{collectionSearch}"
                </div>
              )}
            </div>
          ) : (
            <div className="py-2">
              {history.length > 0 ? (
                <>
                  <div className="px-4 pb-2 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">{history.length} request{history.length !== 1 ? 's' : ''}</span>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  {history.map(item => (
                    <button
                      key={item.id}
                      onClick={() => openRequestInTab({
                        request_id: `req_new_${Date.now()}`,
                        name: item.name,
                        method: item.method,
                        url: item.url,
                        headers: item.request?.headers || [],
                        params: item.request?.params || [],
                        body: item.request?.body || { type: 'none', content: '' },
                        auth: item.request?.auth || { type: 'none' }
                      })}
                      className="w-full px-4 py-2 flex items-center gap-2 hover:bg-zinc-800/50 transition-colors group"
                    >
                      <span className={`text-xs font-medium min-w-[42px] ${getMethodColor(item.method)}`}>
                        {item.method}
                      </span>
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="text-sm text-zinc-400 truncate group-hover:text-zinc-200 transition-colors">
                          {item.url || item.name}
                        </p>
                        <p className="text-xs text-zinc-600 truncate">
                          {item.status > 0 ? (
                            <span className={item.status < 400 ? 'text-green-500' : 'text-red-400'}>
                              {item.status}
                            </span>
                          ) : (
                            <span className="text-red-400">Error</span>
                          )}
                          <span className="mx-1">•</span>
                          {item.time}ms
                          <span className="mx-1">•</span>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                  No history yet
                  <br />
                  <span className="text-xs text-zinc-600">Send a request to see it here</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 space-y-1">
          <Button
            variant="ghost"
            onClick={() => {
              setShowEnvironments(true);
              navigate('/environments');
            }}
            className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <Database className="w-4 h-4 mr-2" />
            Environments
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-zinc-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
          {user && (
            <div className="pt-2 border-t border-zinc-800 mt-2">
              <div className="flex items-center gap-2 px-2">
                <img
                  src={user.picture || 'https://via.placeholder.com/32'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-zinc-300 truncate">{user.name}</p>
                  <p className="text-xs text-zinc-600 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Environment Manager Dialog */}
      <Dialog
        open={showEnvironments}
        onOpenChange={(open) => {
          setShowEnvironments(open);
          if (!open && location.pathname === '/environments') {
            navigate('/collections');
          }
        }}
      >
        <DialogContent className="max-w-6xl w-[90vw] bg-zinc-950 border-zinc-800 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800">
            <DialogTitle className="text-zinc-100">Environment Manager</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden">
            <EnvironmentManager onClose={() => setShowEnvironments(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Organization Manager Dialog */}
      <Dialog
        open={showOrgManager}
        onOpenChange={(open) => {
          setShowOrgManager(open);
          if (!open && location.pathname === '/organizations') {
            navigate('/collections');
          }
        }}
      >
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Manage Organizations</DialogTitle>
          </DialogHeader>
          <OrganizationManager onClose={() => setShowOrgManager(false)} />
        </DialogContent>
      </Dialog>

      {/* Collection Manager Dialog - Create */}
      <CollectionManager
        isOpen={showCollectionManager}
        onClose={() => setShowCollectionManager(false)}
        mode="create"
      />

      {/* Collection Manager Dialog - Edit */}
      {editingCollection && (
        <CollectionManager
          isOpen={!!editingCollection}
          onClose={() => setEditingCollection(null)}
          collection={editingCollection}
          mode="edit"
        />
      )}

      {/* Delete Collection Confirmation */}
      <AlertDialog open={!!deletingCollection} onOpenChange={() => setDeletingCollection(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{deletingCollection?.name}"? This will permanently
              delete the collection and all its requests. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Collection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Sidebar;