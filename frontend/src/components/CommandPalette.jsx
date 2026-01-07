import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, FileText, Folder, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader
} from './ui/dialog';

const CommandPalette = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    requests,
    collections,
    history,
    openRequestInTab,
    createNewRequest
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Filter items based on search
  const filteredItems = [
    {
      category: 'Actions',
      items: [
        { id: 'new-request', name: 'New Request', icon: Zap, action: () => createNewRequest() },
      ]
    },
    {
      category: 'Recent',
      items: history.slice(0, 3).map(h => ({
        id: h.history_id,
        name: `${h.method} ${h.url}`,
        icon: Clock,
        action: () => {
          const req = requests.find(r => r.request_id === h.request_id);
          if (req) openRequestInTab(req);
        }
      }))
    },
    {
      category: 'Requests',
      items: requests
        .filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
        .map(r => ({
          id: r.request_id,
          name: r.name,
          subtitle: `${r.method} • ${r.url.substring(0, 40)}...`,
          icon: FileText,
          action: () => openRequestInTab(r)
        }))
    },
    {
      category: 'Collections',
      items: collections
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        .map(c => ({
          id: c.collection_id,
          name: c.name,
          subtitle: c.description,
          icon: Folder,
          action: () => {}
        }))
    }
  ].filter(group => group.items.length > 0);

  const allItems = filteredItems.flatMap(group => group.items);

  useEffect(() => {
    if (commandPaletteOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandPaletteOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault();
      allItems[selectedIndex].action();
      setCommandPaletteOpen(false);
      setSearch('');
      setSelectedIndex(0);
    }
  };

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="p-0 gap-0 max-w-2xl bg-zinc-900 border-zinc-800">
        <div className="flex items-center border-b border-zinc-800 px-4 py-3">
          <Search className="w-5 h-5 text-zinc-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search requests, collections, or actions..."
            className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredItems.map((group, groupIdx) => {
            let currentIndex = filteredItems
              .slice(0, groupIdx)
              .reduce((acc, g) => acc + g.items.length, 0);

            return (
              <div key={group.category} className="py-2">
                <div className="px-4 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {group.category}
                </div>
                {group.items.map((item, idx) => {
                  const itemIndex = currentIndex + idx;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors ${
                        itemIndex === selectedIndex ? 'bg-zinc-800' : ''
                      }`}
                      onClick={() => {
                        item.action();
                        setCommandPaletteOpen(false);
                        setSearch('');
                        setSelectedIndex(0);
                      }}
                    >
                      <Icon className="w-4 h-4 text-zinc-400" />
                      <div className="flex-1 text-left">
                        <div className="text-sm text-zinc-100">{item.name}</div>
                        {item.subtitle && (
                          <div className="text-xs text-zinc-500">{item.subtitle}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {allItems.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              No results found
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800 px-4 py-2 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↵</kbd> Select</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">⌘K</kbd> Close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
