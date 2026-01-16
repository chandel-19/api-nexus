import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
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
            url: {
              raw: req.url,
              host: [],
              path: [],
              query: (req.params || [])
                .filter(p => p.enabled)
                .map(p => ({ key: p.key, value: p.value }))
            },
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

  const navigate = useNavigate();
  const [expandedCollections, setExpandedCollections] = useState(new Set(['col_1']));
  const [activeTab, setActiveTab] = useState('collections');
  const [showEnvironments, setShowEnvironments] = useState(false);
  const [showOrgManager, setShowOrgManager] = useState(false);
  const [showCollectionManager, setShowCollectionManager] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [deletingCollection, setDeletingCollection] = useState(null);

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

  return (
    <>
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen">
        {/* Org Switcher */}
        <div className="p-4 border-b border-zinc-800">
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
                onClick={() => setShowOrgManager(true)}
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
            onClick={() => setActiveTab('collections')}
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
            onClick={() => setActiveTab('history')}
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

              {collections.map(collection => {
                const collectionRequests = requests.filter(
                  r => r.collection_id === collection.collection_id
                );
                const isExpanded = expandedCollections.has(collection.collection_id);

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
                        {collectionRequests.map(request => (
                          <button
                            key={request.request_id}
                            onClick={() => openRequestInTab(request)}
                            className="w-full px-4 py-2 flex items-center gap-2 hover:bg-zinc-800/50 transition-colors group"
                          >
                            <FileText className="w-3.5 h-3.5 text-zinc-600" />
                            <span
                              className={`text-xs font-medium ${getMethodColor(request.method)}`}
                            >
                              {request.method}
                            </span>
                            <span className="flex-1 text-left text-sm text-zinc-400 truncate group-hover:text-zinc-200 transition-colors">
                              {request.name}
                            </span>
                          </button>
                        ))}
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
            onClick={() => setShowEnvironments(true)}
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
      <Dialog open={showEnvironments} onOpenChange={setShowEnvironments}>
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
      <Dialog open={showOrgManager} onOpenChange={setShowOrgManager}>
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