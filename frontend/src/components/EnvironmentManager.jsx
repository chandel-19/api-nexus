import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from '../hooks/use-toast';
import axios from 'axios';
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EnvironmentManager = ({ onClose }) => {
  const { environments, currentEnv, setCurrentEnv, currentOrg, refreshEnvironments } = useApp();
  const [editingEnv, setEditingEnv] = useState(null);
  const [deletingEnv, setDeletingEnv] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newEnv, setNewEnv] = useState({
    name: '',
    variables: [{ key: '', value: '', enabled: true }]
  });

  const handleCreateEnvironment = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/organizations/${currentOrg.org_id}/environments`,
        newEnv,
        { withCredentials: true }
      );
      
      toast({
        title: 'Environment created',
        description: `${newEnv.name} has been created successfully`,
      });
      
      setCreating(false);
      setNewEnv({ name: '', variables: [{ key: '', value: '', enabled: true }] });
      if (refreshEnvironments) await refreshEnvironments();
    } catch (error) {
      toast({
        title: 'Failed to create environment',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEnvironment = async () => {
    setLoading(true);
    try {
      await axios.put(
        `${BACKEND_URL}/api/environments/${editingEnv.env_id}`,
        { name: editingEnv.name, variables: editingEnv.variables },
        { withCredentials: true }
      );
      toast({
        title: 'Environment updated',
        description: 'Changes saved successfully',
      });
      setEditingEnv(null);
      if (refreshEnvironments) await refreshEnvironments();
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnvironment = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `${BACKEND_URL}/api/environments/${deletingEnv.env_id}`,
        { withCredentials: true }
      );
      toast({
        title: 'Environment deleted',
        description: `${deletingEnv.name} has been deleted`,
      });
      setDeletingEnv(null);
      if (currentEnv?.env_id === deletingEnv.env_id) {
        setCurrentEnv(null);
      }
      if (refreshEnvironments) await refreshEnvironments();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addVariable = (isNew = false) => {
    if (isNew) {
      setNewEnv({
        ...newEnv,
        variables: [...newEnv.variables, { key: '', value: '', enabled: true }]
      });
    } else if (editingEnv) {
      setEditingEnv({
        ...editingEnv,
        variables: [...editingEnv.variables, { key: '', value: '', enabled: true }]
      });
    }
  };

  const removeVariable = (index, isNew = false) => {
    if (isNew) {
      setNewEnv({
        ...newEnv,
        variables: newEnv.variables.filter((_, i) => i !== index)
      });
    } else if (editingEnv) {
      setEditingEnv({
        ...editingEnv,
        variables: editingEnv.variables.filter((_, i) => i !== index)
      });
    }
  };

  const updateVariable = (index, field, value, isNew = false) => {
    if (isNew) {
      const updated = [...newEnv.variables];
      updated[index][field] = value;
      setNewEnv({ ...newEnv, variables: updated });
    } else if (editingEnv) {
      const updated = [...editingEnv.variables];
      updated[index][field] = value;
      setEditingEnv({ ...editingEnv, variables: updated });
    }
  };

  return (
    <div className="space-y-6">
      {/* Environment List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-400">Environments</h3>
          <Button
            size="sm"
            onClick={() => setCreating(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Environment
          </Button>
        </div>

        {environments.map(env => (
          <div
            key={env.env_id}
            className={`p-4 rounded-lg border transition-colors cursor-pointer ${
              currentEnv?.env_id === env.env_id
                ? 'bg-blue-500/10 border-blue-500/50'
                : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
            }`}
            onClick={() => setCurrentEnv(env)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-zinc-100">{env.name}</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  {env.variables.length} variable(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentEnv?.env_id === env.env_id && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    Active
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingEnv(env);
                  }}
                  className="text-zinc-400 hover:text-zinc-100"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {environments.length === 0 && !creating && (
          <div className="text-center py-8 text-zinc-500">
            No environments yet. Create one to get started.
          </div>
        )}
      </div>

      {/* Create New Environment */}
      {creating && (
        <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-100 mb-4">New Environment</h3>
          
          <Input
            placeholder="Environment name (e.g., Production)"
            value={newEnv.name}
            onChange={(e) => setNewEnv({ ...newEnv, name: e.target.value })}
            className="mb-4 bg-zinc-900 border-zinc-700 text-zinc-100"
          />

          <div className="space-y-2 mb-4">
            <label className="text-xs text-zinc-400">Variables</label>
            {newEnv.variables.map((variable, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Key"
                  value={variable.key}
                  onChange={(e) => updateVariable(index, 'key', e.target.value, true)}
                  className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-100"
                />
                <Input
                  placeholder="Value"
                  value={variable.value}
                  onChange={(e) => updateVariable(index, 'value', e.target.value, true)}
                  className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-100"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeVariable(index, true)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addVariable(true)}
              className="w-full text-zinc-400 hover:text-zinc-100 border border-dashed border-zinc-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Variable
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateEnvironment}
              disabled={!newEnv.name}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Create
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setNewEnv({ name: '', variables: [{ key: '', value: '', enabled: true }] });
              }}
              className="flex-1 text-zinc-400 hover:text-zinc-100"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Edit Environment */}
      {editingEnv && (
        <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-100 mb-4">
            Edit: {editingEnv.name}
          </h3>
          
          <div className="space-y-2 mb-4">
            <label className="text-xs text-zinc-400">Variables</label>
            {editingEnv.variables.map((variable, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Key"
                  value={variable.key}
                  onChange={(e) => updateVariable(index, 'key', e.target.value)}
                  className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-100"
                />
                <Input
                  placeholder="Value"
                  value={variable.value}
                  onChange={(e) => updateVariable(index, 'value', e.target.value)}
                  className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-100"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeVariable(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addVariable()}
              className="w-full text-zinc-400 hover:text-zinc-100 border border-dashed border-zinc-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Variable
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={async () => {
                try {
                  await axios.put(
                    `${BACKEND_URL}/api/environments/${editingEnv.env_id}`,
                    editingEnv,
                    { withCredentials: true }
                  );
                  toast({
                    title: 'Environment updated',
                    description: 'Changes saved successfully',
                  });
                  setEditingEnv(null);
                  window.location.reload();
                } catch (error) {
                  toast({
                    title: 'Update failed',
                    description: error.message,
                    variant: 'destructive'
                  });
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => setEditingEnv(null)}
              className="flex-1 text-zinc-400 hover:text-zinc-100"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentManager;