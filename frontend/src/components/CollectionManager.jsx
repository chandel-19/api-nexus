import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Folder } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from '../hooks/use-toast';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

const CollectionManager = ({ collection, isOpen, onClose, mode = 'create' }) => {
  const { currentOrg, refreshCollections } = useApp();
  const [formData, setFormData] = useState({
    name: collection?.name || '',
    description: collection?.description || '',
    color: collection?.color || '#3B82F6',
    pre_request_script: collection?.pre_request_script || '',
    post_request_script: collection?.post_request_script || ''
  });
  const [loading, setLoading] = useState(false);
  const [showScripts, setShowScripts] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        await axios.post(
          `${BACKEND_URL}/api/organizations/${currentOrg.org_id}/collections`,
          formData,
          { withCredentials: true }
        );
        toast({
          title: 'Collection created',
          description: `${formData.name} has been created successfully`,
        });
      } else if (mode === 'edit') {
        await axios.put(
          `${BACKEND_URL}/api/collections/${collection.collection_id}`,
          formData,
          { withCredentials: true }
        );
        toast({
          title: 'Collection updated',
          description: `${formData.name} has been updated successfully`,
        });
      }

      // Refresh collections list
      if (refreshCollections) {
        await refreshCollections();
      }
      
      onClose();
    } catch (error) {
      toast({
        title: `Failed to ${mode} collection`,
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {mode === 'create' ? 'Create New Collection' : 'Edit Collection'}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            {mode === 'create'
              ? 'Create a new collection to organize your API requests'
              : 'Update collection details and settings'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Collection Name */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">
              Collection Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., User API, Payment Gateway"
              required
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this collection is for..."
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">
              Collection Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Scripts Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowScripts(!showScripts)}
              className="text-sm font-medium text-zinc-300 hover:text-zinc-100 flex items-center gap-2 transition-colors"
            >
              {showScripts ? '▼' : '▶'} Pre/Post Request Scripts (Advanced)
            </button>
            
            {showScripts && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">
                    Pre-request Script (JavaScript)
                  </label>
                  <Textarea
                    value={formData.pre_request_script}
                    onChange={(e) => setFormData({ ...formData, pre_request_script: e.target.value })}
                    placeholder="// Runs before each request in this collection\nconsole.log('Before request');"
                    rows={4}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">
                    Post-request Script (JavaScript)
                  </label>
                  <Textarea
                    value={formData.post_request_script}
                    onChange={(e) => setFormData({ ...formData, post_request_script: e.target.value })}
                    placeholder="// Runs after each request in this collection\nconsole.log('After request', response);"
                    rows={4}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Create Collection' : 'Save Changes'}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="flex-1 text-zinc-400 hover:text-zinc-100"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionManager;