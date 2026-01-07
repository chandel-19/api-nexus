import React, { useState } from 'react';
import {
  Folder,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  Clock,
  Settings,
  Database,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Sidebar = () => {
  const {
    collections,
    requests,
    openRequestInTab,
    createNewRequest,
    currentOrg,
    organizations,
    setCurrentOrg
  } = useApp();

  const [expandedCollections, setExpandedCollections] = useState(new Set(['col_1']));
  const [activeTab, setActiveTab] = useState('collections');

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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* New Request Button */}
      <div className="p-4">
        <Button
          onClick={createNewRequest}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
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
            {collections.map(collection => {
              const collectionRequests = requests.filter(
                r => r.collection_id === collection.collection_id
              );
              const isExpanded = expandedCollections.has(collection.collection_id);

              return (
                <div key={collection.collection_id}>
                  <button
                    onClick={() => toggleCollection(collection.collection_id)}
                    className="w-full px-4 py-2 flex items-center gap-2 hover:bg-zinc-800/50 transition-colors group"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    )}
                    <Folder
                      className="w-4 h-4"
                      style={{ color: collection.color }}
                    />
                    <span className="flex-1 text-left text-sm text-zinc-300 truncate">
                      {collection.name}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {collectionRequests.length}
                    </span>
                  </button>

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
              </div>
            )}
          </div>
        ) : (
          <div className="py-2">
            {/* History view would go here */}
            <div className="px-4 py-2 text-sm text-zinc-500">
              Recent requests will appear here
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 mt-1"
        >
          <Database className="w-4 h-4 mr-2" />
          Environments
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
