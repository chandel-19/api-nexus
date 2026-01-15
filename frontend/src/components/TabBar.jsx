import React from 'react';
import { X, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import RequestBuilder from './RequestBuilder';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

const TabBar = () => {
  const { openTabs, activeTab, setActiveTab, closeTab, createNewRequest } = useApp();

  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-green-500',
      POST: 'bg-blue-500',
      PUT: 'bg-yellow-500',
      DELETE: 'bg-red-500',
      PATCH: 'bg-purple-500'
    };
    return colors[method] || 'bg-zinc-500';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-zinc-900 border-b border-zinc-800 overflow-x-auto">
        {openTabs.map(tab => (
          <div
            key={tab.request_id}
            onClick={() => setActiveTab(tab.request_id)}
            className={`group flex items-center gap-2 px-4 py-2.5 border-r border-zinc-800 cursor-pointer min-w-max transition-colors ${
              activeTab === tab.request_id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${getMethodColor(tab.method)}`}
            />
            <span className="text-sm font-medium">{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.request_id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded p-0.5 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={createNewRequest}
                className="flex items-center justify-center w-8 h-8 mx-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
                aria-label="Create new request"
              >
                <Plus className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-zinc-800 text-zinc-100 border-zinc-700">
              <p>Create new request</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <RequestBuilder
            request={openTabs.find(tab => tab.request_id === activeTab)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-500">
            <div className="text-center space-y-4">
              <div className="text-6xl">🚀</div>
              <h2 className="text-2xl font-semibold text-zinc-300">No Request Open</h2>
              <p className="text-sm">Create a new request or open one from collections</p>
              <div className="flex gap-2 justify-center mt-4">
                <button
                  onClick={createNewRequest}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  New Request
                </button>
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors">
                  Browse Collections
                </button>
              </div>
              <div className="mt-8 text-xs text-zinc-600 space-y-2">
                <div className="text-sm font-semibold text-zinc-500 mb-3">⌨️ Keyboard Shortcuts</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-left max-w-md mx-auto">
                  <div><kbd className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 text-zinc-500">⌘/Ctrl + K</kbd></div>
                  <div className="text-zinc-500">Command Palette</div>
                  
                  <div><kbd className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 text-zinc-500">⌘/Ctrl + S</kbd></div>
                  <div className="text-zinc-500">Save Request</div>
                  
                  <div><kbd className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 text-zinc-500">⌘/Ctrl + Enter</kbd></div>
                  <div className="text-zinc-500">Send Request</div>
                  
                  <div><kbd className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 text-zinc-500">⌘/Ctrl + D</kbd></div>
                  <div className="text-zinc-500">Delete Request</div>
                </div>
                <div className="text-xs text-zinc-600 mt-4 italic">
                  Tip: Use "New Request" button or Ctrl+T (Windows/Linux only)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabBar;
