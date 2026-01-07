import React from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import RequestBuilder from './RequestBuilder';

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
      {openTabs.length > 0 && (
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
        </div>
      )}

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
              <div className="mt-6 text-xs text-zinc-600">
                <kbd className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800">⌘K</kbd>
                <span className="mx-2">or</span>
                <kbd className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800">⌘T</kbd>
                <span className="ml-2">for quick access</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabBar;
