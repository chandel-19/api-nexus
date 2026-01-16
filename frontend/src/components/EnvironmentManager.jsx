import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EnvironmentManager = ({ onClose }) => {
  const { environments, currentEnv, setCurrentEnv, currentOrg, refreshEnvironments } = useApp();
  const [selectedEnv, setSelectedEnv] = useState(currentEnv || null);
  const [editingEnv, setEditingEnv] = useState(null);
  const [deletingEnv, setDeletingEnv] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('key'); // 'key', 'value', 'enabled'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [showCompare, setShowCompare] = useState(false);
  const [compareEnvAId, setCompareEnvAId] = useState(currentEnv?.env_id || null);
  const [compareEnvBId, setCompareEnvBId] = useState(null);
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
      if (refreshEnvironments) {
        await refreshEnvironments();
        // Select the newly created environment
        const updatedEnvs = await axios.get(
          `${BACKEND_URL}/api/organizations/${currentOrg.org_id}/environments`,
          { withCredentials: true }
        );
        const newEnvData = updatedEnvs.data.find(e => e.name === newEnv.name);
        if (newEnvData) setSelectedEnv(newEnvData);
      }
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
      if (refreshEnvironments) {
        await refreshEnvironments();
        // Update selected environment
        const updatedEnvs = await axios.get(
          `${BACKEND_URL}/api/organizations/${currentOrg.org_id}/environments`,
          { withCredentials: true }
        );
        const updatedEnv = updatedEnvs.data.find(e => e.env_id === editingEnv.env_id);
        if (updatedEnv) setSelectedEnv(updatedEnv);
      }
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
      if (selectedEnv?.env_id === deletingEnv.env_id) {
        setSelectedEnv(null);
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

  const toggleVariableEnabled = (index, isNew = false) => {
    if (isNew) {
      const updated = [...newEnv.variables];
      updated[index].enabled = !updated[index].enabled;
      setNewEnv({ ...newEnv, variables: updated });
    } else if (editingEnv) {
      const updated = [...editingEnv.variables];
      updated[index].enabled = !updated[index].enabled;
      setEditingEnv({ ...editingEnv, variables: updated });
    }
  };

  const getSortedVariables = (variables) => {
    if (!variables) return [];
    const sorted = [...variables];
    sorted.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'key') {
        aVal = (a.key || '').toLowerCase();
        bVal = (b.key || '').toLowerCase();
      } else if (sortBy === 'value') {
        aVal = (a.value || '').toLowerCase();
        bVal = (b.value || '').toLowerCase();
      } else if (sortBy === 'enabled') {
        aVal = a.enabled ? 1 : 0;
        bVal = b.enabled ? 1 : 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    return sorted;
  };

  const handleSelectEnvironment = (env) => {
    setSelectedEnv(env);
    setEditingEnv(null);
    setCreating(false);
    setShowCompare(false);
    setCompareEnvAId(env?.env_id || null);
    const otherEnv = environments.find(e => e.env_id !== env?.env_id);
    setCompareEnvBId(otherEnv?.env_id || null);
  };

  const handleSetAsActive = (env) => {
    setCurrentEnv(env);
    toast({
      title: 'Environment activated',
      description: `${env.name} is now active`,
    });
  };

  const getEnvById = (envId) => environments.find(env => env.env_id === envId);

  const getDiffRows = (envA, envB) => {
    if (!envA || !envB) return [];
    const mapA = new Map((envA.variables || []).map(v => [v.key || '', v]));
    const mapB = new Map((envB.variables || []).map(v => [v.key || '', v]));
    const keys = new Set([...mapA.keys(), ...mapB.keys()]);
    const rows = [];
    keys.forEach((key) => {
      if (!key) return;
      const a = mapA.get(key);
      const b = mapB.get(key);
      const aVal = a?.value ?? '';
      const bVal = b?.value ?? '';
      const aEnabled = a?.enabled !== false;
      const bEnabled = b?.enabled !== false;
      let status = 'same';
      if (!a) status = 'only_b';
      else if (!b) status = 'only_a';
      else if (aVal !== bVal || aEnabled !== bEnabled) status = 'diff';
      rows.push({
        key,
        aVal,
        bVal,
        aEnabled,
        bEnabled,
        status,
      });
    });
    return rows.sort((x, y) => x.key.localeCompare(y.key));
  };

  return (
    <div className="flex h-[70vh] bg-zinc-950">
      {/* Left Sidebar - Environment List */}
      <div className="w-64 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-100">Environments</h3>
            <Button
              size="sm"
              onClick={() => {
                setCreating(true);
                setSelectedEnv(null);
                setEditingEnv(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 h-7 px-2"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {environments.map(env => (
            <div
              key={env.env_id}
              className={`px-4 py-3 border-b border-zinc-800 cursor-pointer transition-colors ${
                selectedEnv?.env_id === env.env_id
                  ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                  : 'hover:bg-zinc-800/50'
              }`}
              onClick={() => handleSelectEnvironment(env)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-zinc-100 truncate">{env.name}</h4>
                    {currentEnv?.env_id === env.env_id && (
                      <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded flex-shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {env.variables?.length || 0} variable{env.variables?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {environments.length === 0 && !creating && (
            <div className="text-center py-8 text-zinc-500 text-sm px-4">
              No environments yet. Create one to get started.
            </div>
          )}

        </div>
      </div>

      {/* Right Side - Variables */}
      <div className="flex-1 flex flex-col">
        {creating ? (
          <>
            {/* Create New Environment */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-100">New Environment</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCreating(false);
                      setNewEnv({ name: '', variables: [{ key: '', value: '', enabled: true }] });
                    }}
                    className="h-7 px-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block">Environment Name</label>
                    <Input
                      placeholder="Environment name (e.g., Production)"
                      value={newEnv.name}
                      onChange={(e) => setNewEnv({ ...newEnv, name: e.target.value })}
                      className="bg-zinc-900 border-zinc-700 text-zinc-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-zinc-400">Variables</label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addVariable(true)}
                        className="text-zinc-400 hover:text-zinc-100 h-7"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Variable
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {newEnv.variables.map((variable, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-zinc-900 rounded border border-zinc-800">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Key"
                              value={variable.key}
                              onChange={(e) => updateVariable(index, 'key', e.target.value, true)}
                              className="bg-zinc-950 border-zinc-700 text-zinc-100"
                            />
                            <Input
                              placeholder="Value"
                              value={variable.value}
                              onChange={(e) => updateVariable(index, 'value', e.target.value, true)}
                              className="bg-zinc-950 border-zinc-700 text-zinc-100"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleVariableEnabled(index, true)}
                            className={`h-7 px-2 ${
                              variable.enabled !== false
                                ? 'text-green-400 hover:text-green-300'
                                : 'text-zinc-500 hover:text-zinc-400'
                            }`}
                            title={variable.enabled !== false ? 'Disable' : 'Enable'}
                          >
                            {variable.enabled !== false ? '✓' : '○'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeVariable(index, true)}
                            className="text-red-400 hover:text-red-300 h-7 px-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleCreateEnvironment}
                      disabled={!newEnv.name || loading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Create Environment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : editingEnv ? (
          <>
            {/* Edit Mode */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-100">Edit: {editingEnv.name}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdateEnvironment}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 h-7"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingEnv(null);
                        setSelectedEnv(environments.find(e => e.env_id === editingEnv.env_id) || null);
                      }}
                      className="h-7 px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block">Environment Name</label>
                    <Input
                      value={editingEnv.name}
                      onChange={(e) => setEditingEnv({ ...editingEnv, name: e.target.value })}
                      className="bg-zinc-900 border-zinc-700 text-zinc-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-zinc-400">Variables</label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addVariable()}
                        className="text-zinc-400 hover:text-zinc-100 h-7"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Variable
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editingEnv.variables.map((variable, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-zinc-900 rounded border border-zinc-800">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Key"
                              value={variable.key}
                              onChange={(e) => updateVariable(index, 'key', e.target.value)}
                              className="bg-zinc-950 border-zinc-700 text-zinc-100"
                            />
                            <Input
                              placeholder="Value"
                              value={variable.value}
                              onChange={(e) => updateVariable(index, 'value', e.target.value)}
                              className="bg-zinc-950 border-zinc-700 text-zinc-100"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleVariableEnabled(index)}
                            className={`h-7 px-2 ${
                              variable.enabled !== false
                                ? 'text-green-400 hover:text-green-300'
                                : 'text-zinc-500 hover:text-zinc-400'
                            }`}
                            title={variable.enabled !== false ? 'Disable' : 'Enable'}
                          >
                            {variable.enabled !== false ? '✓' : '○'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeVariable(index)}
                            className="text-red-400 hover:text-red-300 h-7 px-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : selectedEnv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">{selectedEnv.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {selectedEnv.variables?.length || 0} variable{selectedEnv.variables?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {environments.length >= 2 && (
                    <Button
                      size="sm"
                      variant={showCompare ? "secondary" : "ghost"}
                      onClick={() => {
                        const next = !showCompare;
                        setShowCompare(next);
                        if (next) {
                          setCompareEnvAId(selectedEnv?.env_id || null);
                          const otherEnv = environments.find(e => e.env_id !== selectedEnv?.env_id);
                          setCompareEnvBId(otherEnv?.env_id || null);
                        }
                      }}
                      className="h-7 px-2 text-zinc-300 hover:text-zinc-100"
                      title="Compare environments"
                    >
                      <ArrowUpDown className="w-4 h-4 mr-1" />
                      Compare
                    </Button>
                  )}
                  {currentEnv?.env_id !== selectedEnv.env_id && (
                    <Button
                      size="sm"
                      onClick={() => handleSetAsActive(selectedEnv)}
                      className="bg-blue-600 hover:bg-blue-700 h-7"
                    >
                      Set as Active
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingEnv({ ...selectedEnv });
                      setSelectedEnv(null);
                    }}
                    className="text-zinc-400 hover:text-zinc-100 h-7"
                    title="Edit environment"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingEnv(selectedEnv)}
                    className="text-red-400 hover:text-red-300 h-7"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 h-7 bg-zinc-900 border-zinc-700 text-zinc-100 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="key">Key</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="enabled">Status</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-7 px-2 text-zinc-400 hover:text-zinc-100"
                  title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Compare Panel */}
            {showCompare ? (
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 mb-2 block">Environment A</label>
                      <Select value={compareEnvAId || ''} onValueChange={setCompareEnvAId}>
                        <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-100">
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {environments.map(env => (
                            <SelectItem key={env.env_id} value={env.env_id}>
                              {env.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-2 block">Environment B</label>
                      <Select value={compareEnvBId || ''} onValueChange={setCompareEnvBId}>
                        <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-100">
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {environments.map(env => (
                            <SelectItem key={env.env_id} value={env.env_id}>
                              {env.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {compareEnvAId && compareEnvBId ? (
                    <div className="space-y-2">
                      {getDiffRows(getEnvById(compareEnvAId), getEnvById(compareEnvBId)).map((row) => (
                        <div key={row.key} className="p-3 bg-zinc-900 rounded border border-zinc-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-zinc-100 font-mono">{row.key}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              row.status === 'same'
                                ? 'bg-green-500/20 text-green-400'
                                : row.status === 'diff'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                            }`}>
                              {row.status === 'same' ? 'Same' : row.status === 'diff' ? 'Different' : row.status === 'only_a' ? 'Only in A' : 'Only in B'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <div className="text-zinc-500 mb-1">A</div>
                              <div className="text-zinc-100 font-mono truncate">{row.aVal || '(empty)'}</div>
                              <div className="text-[11px] text-zinc-500 mt-1">{row.aEnabled ? 'Enabled' : 'Disabled'}</div>
                            </div>
                            <div>
                              <div className="text-zinc-500 mb-1">B</div>
                              <div className="text-zinc-100 font-mono truncate">{row.bVal || '(empty)'}</div>
                              <div className="text-[11px] text-zinc-500 mt-1">{row.bEnabled ? 'Enabled' : 'Disabled'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500">Select two environments to compare.</div>
                  )}
                </div>
              </div>
            ) : (
              /* Variables List */
              <div className="flex-1 overflow-y-auto">
                {selectedEnv.variables && selectedEnv.variables.length > 0 ? (
                  <div className="p-4">
                    <div className="space-y-2">
                      {getSortedVariables(selectedEnv.variables).map((variable, index) => {
                        const originalIndex = selectedEnv.variables.findIndex(
                          v => v.key === variable.key && v.value === variable.value
                        );
                        return (
                          <div
                            key={originalIndex}
                            className="flex items-center gap-2 p-3 bg-zinc-900 rounded border border-zinc-800"
                          >
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-zinc-500 mb-1">Key</div>
                                <div className="text-sm text-zinc-100 font-mono">{variable.key || '(empty)'}</div>
                              </div>
                              <div>
                                <div className="text-xs text-zinc-500 mb-1">Value</div>
                                <div className="text-sm text-zinc-100 font-mono truncate">{variable.value || '(empty)'}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`px-2 py-1 rounded text-xs ${
                                variable.enabled !== false
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-zinc-800 text-zinc-500'
                              }`}>
                                {variable.enabled !== false ? 'Enabled' : 'Disabled'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                    No variables in this environment
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
            Select an environment to view its variables
          </div>
        )}
      </div>

      {/* Delete Environment Dialog */}
      <AlertDialog open={!!deletingEnv} onOpenChange={() => setDeletingEnv(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Environment?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete &quot;{deletingEnv?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEnvironment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnvironmentManager;
