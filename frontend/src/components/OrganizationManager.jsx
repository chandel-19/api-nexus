import React, { useState } from 'react';
import { Plus, Building2, Users, Mail, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const OrganizationManager = ({ onClose }) => {
  const { organizations, currentOrg, setCurrentOrg } = useApp();
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [addingMember, setAddingMember] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');

  const handleCreateOrganization = async () => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/organizations`,
        { name: newOrgName, type: 'team' },
        { withCredentials: true }
      );
      
      toast({
        title: 'Organization created',
        description: `${newOrgName} has been created successfully`,
      });
      
      setCreating(false);
      setNewOrgName('');
      window.location.reload(); // Reload to refresh organizations
    } catch (error) {
      toast({
        title: 'Failed to create organization',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  const handleAddMember = async (orgId) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/organizations/${orgId}/members`,
        { email: memberEmail },
        { withCredentials: true }
      );
      
      toast({
        title: 'Member added',
        description: `${memberEmail} has been added to the organization`,
      });
      
      setAddingMember(null);
      setMemberEmail('');
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Failed to add member',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Organization */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">Your Organizations</h3>
          <Button
            size="sm"
            onClick={() => setCreating(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Organization
          </Button>
        </div>

        {creating && (
          <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 mb-4">
            <Input
              placeholder="Organization name"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              className="mb-3 bg-zinc-900 border-zinc-700 text-zinc-100"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreateOrganization}
                disabled={!newOrgName}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                  setNewOrgName('');
                }}
                className="flex-1 text-zinc-400 hover:text-zinc-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Organization List */}
      <div className="space-y-3">
        {organizations.map(org => (
          <div
            key={org.org_id}
            className={`p-4 rounded-lg border transition-colors ${
              currentOrg?.org_id === org.org_id
                ? 'bg-blue-500/10 border-blue-500/50'
                : 'bg-zinc-800/50 border-zinc-700'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-100">{org.name}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {org.type === 'personal' ? 'Personal Workspace' : 'Team Workspace'}
                  </p>
                </div>
              </div>
              {currentOrg?.org_id === org.org_id && (
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                  Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>{org.members.length} member(s)</span>
            </div>

            {org.type === 'team' && (
              <div className="space-y-2">
                {addingMember === org.org_id ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Member email"
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-100 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(org.org_id)}
                      disabled={!memberEmail}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingMember(null);
                        setMemberEmail('');
                      }}
                      className="text-zinc-400 hover:text-zinc-100"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddingMember(org.org_id)}
                    className="w-full text-zinc-400 hover:text-zinc-100 border border-dashed border-zinc-700"
                  >
                    <Mail className="w-3.5 h-3.5 mr-1" />
                    Invite Member
                  </Button>
                )}
              </div>
            )}

            {currentOrg?.org_id !== org.org_id && (
              <Button
                size="sm"
                onClick={() => setCurrentOrg(org)}
                className="w-full mt-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
              >
                Switch to this workspace
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrganizationManager;