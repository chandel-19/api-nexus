import React, { useState } from 'react';
import { Play, Save, Trash2, Plus, X, Copy, Folder } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from '../hooks/use-toast';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
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
const API = `${BACKEND_URL}/api`;

const RequestBuilder = ({ request }) => {
  const { updateRequest, saveRequest, collections, refreshCollections, closeTab } = useApp();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(request?.collection_id || null);
  const [saveAsName, setSaveAsName] = useState(request?.name || '');

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      // Execute request via backend proxy
      const executeResponse = await axios.post(
        `${API}/requests/execute`,
        {
          method: request.method,
          url: request.url,
          headers: request.headers,
          params: request.params,
          body: request.body,
          auth: request.auth
        },
        { withCredentials: true }
      );

      setResponse(executeResponse.data);
      setLoading(false);
      
      toast({
        title: 'Request sent',
        description: `${request.method} request completed in ${executeResponse.data.time}ms`,
      });
    } catch (error) {
      setLoading(false);
      toast({
        title: 'Request failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    // If request is new (starts with req_new_), show collection selector
    if (request.request_id.startsWith('req_new_')) {
      setShowSaveDialog(true);
    } else {
      // Update existing request
      await performSave(request.collection_id, request.name);
    }
  };

  const handleSaveAs = () => {
    setSaveAsName(request.name + ' (Copy)');
    setSelectedCollection(request.collection_id);
    setShowSaveAsDialog(true);
  };

  const performSave = async (collectionId, requestName) => {
    try {
      const requestData = {
        collection_id: collectionId,
        name: requestName || request.name,
        method: request.method,
        url: request.url,
        headers: request.headers,
        params: request.params,
        body: request.body,
        auth: request.auth
      };

      await saveRequest({ ...request, ...requestData });
      
      toast({
        title: 'Request saved',
        description: `${requestName || request.name} has been saved successfully`,
      });

      // Refresh collections to update request counts
      if (refreshCollections) {
        await refreshCollections();
      }

      setShowSaveDialog(false);
      setShowSaveAsDialog(false);
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  const performSaveAs = async () => {
    try {
      const newRequestData = {
        collection_id: selectedCollection,
        name: saveAsName,
        method: request.method,
        url: request.url,
        headers: request.headers,
        params: request.params,
        body: request.body,
        auth: request.auth
      };

      // Create new request (force new ID)
      await axios.post(
        `${API}/requests`,
        newRequestData,
        { withCredentials: true }
      );
      
      toast({
        title: 'Request saved as new',
        description: `${saveAsName} has been created successfully`,
      });

      // Refresh collections
      if (refreshCollections) {
        await refreshCollections();
      }

      setShowSaveAsDialog(false);
    } catch (error) {
      toast({
        title: 'Save As failed',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    try {
      // Only delete if it's a saved request (not a new one)
      if (!request.request_id.startsWith('req_new_')) {
        await axios.delete(
          `${API}/requests/${request.request_id}`,
          { withCredentials: true }
        );

        toast({
          title: 'Request deleted',
          description: `${request.name} has been deleted successfully`,
        });

        // Refresh collections
        if (refreshCollections) {
          await refreshCollections();
        }

        // Close the tab
        closeTab(request.request_id);
      }

      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  const updateField = (field, value) => {
    updateRequest(request.request_id, { [field]: value });
  };

  const addHeader = () => {
    updateRequest(request.request_id, {
      headers: [...request.headers, { key: '', value: '', enabled: true }]
    });
  };

  const updateHeader = (index, field, value) => {
    const newHeaders = [...request.headers];
    newHeaders[index][field] = value;
    updateRequest(request.request_id, { headers: newHeaders });
  };

  const removeHeader = (index) => {
    updateRequest(request.request_id, {
      headers: request.headers.filter((_, i) => i !== index)
    });
  };

  const addParam = () => {
    updateRequest(request.request_id, {
      params: [...request.params, { key: '', value: '', enabled: true }]
    });
  };

  const updateParam = (index, field, value) => {
    const newParams = [...request.params];
    newParams[index][field] = value;
    updateRequest(request.request_id, { params: newParams });
  };

  const removeParam = (index) => {
    updateRequest(request.request_id, {
      params: request.params.filter((_, i) => i !== index)
    });
  };

  return (
    <>
      <div className="flex flex-col h-full bg-zinc-950">
        {/* Request Header */}
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex items-center gap-2">
            <Select
              value={request.method}
              onValueChange={(value) => updateField('method', value)}
            >
              <SelectTrigger className="w-32 bg-zinc-900 border-zinc-800 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="GET" className="text-green-400">GET</SelectItem>
                <SelectItem value="POST" className="text-blue-400">POST</SelectItem>
                <SelectItem value="PUT" className="text-yellow-400">PUT</SelectItem>
                <SelectItem value="DELETE" className="text-red-400">DELETE</SelectItem>
                <SelectItem value="PATCH" className="text-purple-400">PATCH</SelectItem>
                <SelectItem value="OPTIONS" className="text-zinc-400">OPTIONS</SelectItem>
                <SelectItem value="HEAD" className="text-zinc-400">HEAD</SelectItem>
              </SelectContent>
            </Select>

            <input
              type="text"
              value={request.url}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="Enter request URL"
              className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />

            <Button
              onClick={handleSendRequest}
              disabled={loading || !request.url}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Send</>
              )}
            </Button>

            <Button
              onClick={handleSave}
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleSaveAs}
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              title="Save As"
            >
              <Copy className="w-4 h-4" />
            </Button>

            {!request.request_id.startsWith('req_new_') && (
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-zinc-800"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <input
            type="text"
            value={request.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Request name"
            className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Request Details & Response */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Request Config */}
          <div className="w-1/2 border-r border-zinc-800 overflow-y-auto">
            <Tabs defaultValue="params" className="w-full">
              <TabsList className="w-full justify-start border-b border-zinc-800 bg-zinc-900 rounded-none h-auto p-0">
                <TabsTrigger
                  value="params"
                  className="rounded-none data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500"
                >
                  Params
                </TabsTrigger>
                <TabsTrigger
                  value="auth"
                  className="rounded-none data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500"
                >
                  Auth
                </TabsTrigger>
                <TabsTrigger
                  value="headers"
                  className="rounded-none data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500"
                >
                  Headers
                </TabsTrigger>
                <TabsTrigger
                  value="body"
                  className="rounded-none data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500"
                >
                  Body
                </TabsTrigger>
              </TabsList>

              <TabsContent value="params" className="p-4 space-y-2">
                {request.params.map((param, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => updateParam(index, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => updateParam(index, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => updateParam(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeParam(index)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  onClick={addParam}
                  variant="ghost"
                  className="w-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-dashed border-zinc-800"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Parameter
                </Button>
              </TabsContent>

              <TabsContent value="auth" className="p-4">
                <Select
                  value={request.auth?.type || 'none'}
                  onValueChange={(value) => updateField('auth', { type: value })}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 mb-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="none">No Auth</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="apikey">API Key</SelectItem>
                  </SelectContent>
                </Select>

                {request.auth?.type === 'bearer' && (
                  <input
                    type="text"
                    value={request.auth?.token || ''}
                    onChange={(e) => updateField('auth', { ...request.auth, token: e.target.value })}
                    placeholder="Token"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}

                {request.auth?.type === 'apikey' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={request.auth?.key || ''}
                      onChange={(e) => updateField('auth', { ...request.auth, key: e.target.value })}
                      placeholder="Key"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={request.auth?.value || ''}
                      onChange={(e) => updateField('auth', { ...request.auth, value: e.target.value })}
                      placeholder="Value"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {request.auth?.type === 'basic' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={request.auth?.username || ''}
                      onChange={(e) => updateField('auth', { ...request.auth, username: e.target.value })}
                      placeholder="Username"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      value={request.auth?.password || ''}
                      onChange={(e) => updateField('auth', { ...request.auth, password: e.target.value })}
                      placeholder="Password"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="headers" className="p-4 space-y-2">
                {request.headers.map((header, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeHeader(index)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  onClick={addHeader}
                  variant="ghost"
                  className="w-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-dashed border-zinc-800"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Header
                </Button>
              </TabsContent>

              <TabsContent value="body" className="p-4">
                <Select
                  value={request.body?.type || 'none'}
                  onValueChange={(value) => updateField('body', { type: value, content: '' })}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 mb-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="form">Form Data</SelectItem>
                    <SelectItem value="raw">Raw</SelectItem>
                  </SelectContent>
                </Select>

                {request.body?.type !== 'none' && (
                  <textarea
                    value={request.body?.content || ''}
                    onChange={(e) => updateField('body', { ...request.body, content: e.target.value })}
                    placeholder={request.body?.type === 'json' ? '{\n  "key": "value"\n}' : 'Enter body content'}
                    className="w-full h-64 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Response */}
          <div className="w-1/2 bg-zinc-950 overflow-y-auto">
            {response ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-400">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        response.status < 300 ? 'bg-green-500/20 text-green-400' :
                        response.status < 400 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {response.status} {response.statusText}
                    </span>
                    <span className="text-sm text-zinc-500">Time: {response.time}ms</span>
                    <span className="text-sm text-zinc-500">Size: {response.size}</span>
                  </div>
                </div>

                <Tabs defaultValue="body" className="flex-1">
                  <TabsList className="w-full justify-start border-b border-zinc-800 bg-zinc-900 rounded-none h-auto p-0">
                    <TabsTrigger
                      value="body"
                      className="rounded-none data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500"
                    >
                      Body
                    </TabsTrigger>
                    <TabsTrigger
                      value="headers"
                      className="rounded-none data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500"
                    >
                      Headers
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="body" className="p-4 flex-1">
                    <pre className="text-sm text-zinc-300 font-mono bg-zinc-900 p-4 rounded overflow-auto">
                      {JSON.stringify(response.body, null, 2)}
                    </pre>
                  </TabsContent>

                  <TabsContent value="headers" className="p-4">
                    <div className="space-y-2">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-4 py-2 border-b border-zinc-800">
                          <span className="text-sm font-medium text-zinc-400 min-w-[200px]">
                            {key}
                          </span>
                          <span className="text-sm text-zinc-300 flex-1">{value}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600">
                <div className="text-center">
                  <div className="text-4xl mb-4">📡</div>
                  <p>Send a request to see the response</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog - Select Collection */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Save Request</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Choose a collection to save this request in
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Collection
              </label>
              <Select
                value={selectedCollection || ''}
                onValueChange={setSelectedCollection}
              >
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {collections.map(collection => (
                    <SelectItem key={collection.collection_id} value={collection.collection_id}>
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4" style={{ color: collection.color }} />
                        {collection.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => performSave(selectedCollection, request.name)}
                disabled={!selectedCollection}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Request
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 text-zinc-400 hover:text-zinc-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save As Dialog */}
      <Dialog open={showSaveAsDialog} onOpenChange={setShowSaveAsDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Save As New Request</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Create a copy of this request with a new name
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Request Name
              </label>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="Enter new request name"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Collection
              </label>
              <Select
                value={selectedCollection || ''}
                onValueChange={setSelectedCollection}
              >
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {collections.map(collection => (
                    <SelectItem key={collection.collection_id} value={collection.collection_id}>
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4" style={{ color: collection.color }} />
                        {collection.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={performSaveAs}
                disabled={!selectedCollection || !saveAsName}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Save As New
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSaveAsDialog(false)}
                className="flex-1 text-zinc-400 hover:text-zinc-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Request?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{request.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RequestBuilder;