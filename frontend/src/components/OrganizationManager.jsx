import React, { useState, useEffect } from 'react';
import { Plus, Building2, Users, Mail, Trash2, Crown, Edit, Eye, Shield, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from '../hooks/use-toast';
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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

const OrganizationManager = ({ onClose }) => {
  const { organizations, currentOrg, setCurrentOrg, currentOrgRole, user } = useApp();
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgMembers, setOrgMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('edit');
  const [deletingOrg, setDeletingOrg] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);
  const [ssoAllowlist, setSsoAllowlist] = useState([]);
  const [ssoEmail, setSsoEmail] = useState('');
  const [loadingAllowlist, setLoadingAllowlist] = useState(false);
  const [savingAllowlist, setSavingAllowlist] = useState(false);

  const isAdmin = currentOrgRole === 'admin';

  // Load members when viewing an org
  useEffect(() => {
    if (selectedOrg) {
      loadOrgMembers(selectedOrg.org_id);
      if (isAdmin) {
        loadSsoAllowlist(selectedOrg.org_id);
      }
    }
  }, [selectedOrg, isAdmin]);

  const loadOrgMembers = async (orgId) => {
    setLoadingMembers(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/organizations/${orgId}/members`,
        { withCredentials: true }
      );
      setOrgMembers(response.data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadSsoAllowlist = async (orgId) => {
    setLoadingAllowlist(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/organizations/${orgId}/sso-allowlist`,
        { withCredentials: true }
      );
      setSsoAllowlist(response.data.emails || []);
    } catch (error) {
      console.error('Failed to load SSO allowlist:', error);
    } finally {
      setLoadingAllowlist(false);
    }
  };

  const saveSsoAllowlist = async (orgId, emails) => {
    setSavingAllowlist(true);
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/organizations/${orgId}/sso-allowlist`,
        { emails },
        { withCredentials: true }
      );
      setSsoAllowlist(response.data.emails || []);
      loadOrgMembers(orgId);
      toast({
        title: 'SSO allowlist updated',
        description: `${response.data.emails?.length || 0} email(s) allowed`
      });
    } catch (error) {
      toast({
        title: 'Failed to update allowlist',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    } finally {
      setSavingAllowlist(false);
    }
  };

  const handleAddSsoEmail = async () => {
    const email = ssoEmail.trim().toLowerCase();
    if (!email || !selectedOrg) return;
    if (!email.includes('@')) {
      toast({ title: 'Invalid email', description: 'Enter a valid email address', variant: 'destructive' });
      return;
    }
    if (ssoAllowlist.includes(email)) {
      toast({ title: 'Already added', description: `${email} is already in the allowlist` });
      return;
    }
    await saveSsoAllowlist(selectedOrg.org_id, [...ssoAllowlist, email]);
    setSsoEmail('');
  };

  const handleRemoveSsoEmail = async (email) => {
    if (!selectedOrg) return;
    const updated = ssoAllowlist.filter(e => e !== email);
    await saveSsoAllowlist(selectedOrg.org_id, updated);
  };

  const handleCreateOrganization = async () => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/organizations`,
        { name: newOrgName, type: 'team' },
        { withCredentials: true }
      );
      
      toast({
        title: 'Organization created',
        description: `${newOrgName} has been created successfully. You are the admin.`,
      });
      
      setCreating(false);
      setNewOrgName('');
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Failed to create organization',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  const handleAddMember = async () => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/organizations/${selectedOrg.org_id}/members`,
        { email: memberEmail, role: memberRole },
        { withCredentials: true }
      );
      
      toast({
        title: 'Member added',
        description: `${memberEmail} has been added as ${memberRole}`,
      });
      
      setAddingMember(false);
      setMemberEmail('');
      setMemberRole('edit');
      loadOrgMembers(selectedOrg.org_id);
      if (isAdmin) {
        loadSsoAllowlist(selectedOrg.org_id);
      }
    } catch (error) {
      toast({
        title: 'Failed to add member',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/organizations/${selectedOrg.org_id}/members/${memberId}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      
      toast({
        title: 'Role updated',
        description: `Member role updated to ${newRole}`,
      });
      
      loadOrgMembers(selectedOrg.org_id);
    } catch (error) {
      toast({
        title: 'Failed to update role',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await axios.delete(
        `${BACKEND_URL}/api/organizations/${selectedOrg.org_id}/members/${memberId}`,
        { withCredentials: true }
      );
      
      toast({
        title: 'Member removed',
        description: 'Member has been removed from the organization',
      });
      
      setRemovingMember(null);
      loadOrgMembers(selectedOrg.org_id);
    } catch (error) {
      toast({
        title: 'Failed to remove member',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteOrg = async () => {
    try {
      await axios.delete(
        `${BACKEND_URL}/api/organizations/${deletingOrg.org_id}`,
        { withCredentials: true }
      );
      
      toast({
        title: 'Organization deleted',
        description: `${deletingOrg.name} has been deleted`,
      });
      
      setDeletingOrg(null);
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Failed to delete organization',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'edit':
        return <Edit className="w-4 h-4 text-blue-400" />;
      case 'view':
        return <Eye className="w-4 h-4 text-zinc-400" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'edit':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'view':
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50';
    }
  };

  return (
    <div className="space-y-6">
      {!selectedOrg ? (
        <>
          {/* Organization List View */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-zinc-400">Your Organizations</h3>
                {currentOrgRole && (
                  <p className="text-xs text-zinc-600 mt-1">
                    Current role: <span className="text-zinc-400 font-medium capitalize">{currentOrgRole}</span>
                  </p>
                )}
              </div>
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

          {/* Organization Cards */}
          <div className="space-y-3">
            {organizations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium text-zinc-300 mb-2">No Organizations Yet</h3>
                <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
                  Create your first team organization to collaborate with others and share your API collections.
                </p>
                <Button
                  onClick={() => setCreating(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Organization
                </Button>
              </div>
            ) : (
              organizations.map(org => {
                const isOwner = org.owner_id === user?.user_id;
                
                return (
                  <div
                    key={org.org_id}
                    className={`p-4 rounded-lg border transition-colors ${
                      currentOrg?.org_id === org.org_id
                        ? 'bg-blue-500/10 border-blue-500/50'
                        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-zinc-100">{org.name}</h4>
                            {isOwner && (
                              <Crown className="w-4 h-4 text-yellow-500" title="Owner" />
                            )}
                          </div>
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

                    <div className="flex items-center gap-2 text-xs mb-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 rounded-full border border-zinc-700">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-zinc-400 font-medium">{org.members?.length || 0}</span>
                        <span className="text-zinc-600">member{(org.members?.length || 0) !== 1 ? 's' : ''}</span>
                      </div>
                      {org.type === 'team' && (
                        <span className="text-zinc-600">• Click &quot;View Members&quot; to manage</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {currentOrg?.org_id !== org.org_id && (
                        <Button
                          size="sm"
                          onClick={() => setCurrentOrg(org)}
                          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
                        >
                          Switch to this workspace
                        </Button>
                      )}
                      
                      {/* Show Manage button for all team orgs - admin check happens in backend */}
                      {org.type === 'team' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrg(org)}
                          className="flex-1 bg-blue-600/10 border-blue-500/50 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300"
                        >
                          <Users className="w-3.5 h-3.5 mr-1" />
                          View Members
                        </Button>
                      )}
                      
                      {isOwner && org.type === 'team' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingOrg(org)}
                          className="text-red-400 hover:text-red-300 hover:bg-zinc-700"
                          title="Delete Organization"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          {/* Member Management View */}
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedOrg(null)}
                  className="text-zinc-400 hover:text-zinc-100"
                >
                  <X className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div className="h-8 w-px bg-zinc-700"></div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    {selectedOrg.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Manage members and permissions
                  </p>
                </div>
              </div>
            </div>

            {/* Add Member Section (Admin Only) */}
            {isAdmin && (
              <div className="mb-4">
                {addingMember ? (
                  <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="space-y-3">
                      <Input
                        placeholder="Member email"
                        type="email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-zinc-100"
                      />
                      <Select value={memberRole} onValueChange={setMemberRole}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-purple-400" />
                              Admin - Full access
                            </div>
                          </SelectItem>
                          <SelectItem value="edit">
                            <div className="flex items-center gap-2">
                              <Edit className="w-4 h-4 text-blue-400" />
                              Edit - Create/edit/delete
                            </div>
                          </SelectItem>
                          <SelectItem value="view">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-zinc-400" />
                              View - Read only
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddMember}
                          disabled={!memberEmail}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Add Member
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setAddingMember(false);
                            setMemberEmail('');
                            setMemberRole('edit');
                          }}
                          className="flex-1 text-zinc-400 hover:text-zinc-100"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setAddingMember(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="w-3.5 h-3.5 mr-1" />
                    Invite Member
                  </Button>
                )}
              </div>
            )}

            {/* SSO Allowlist (Admin Only) */}
            {isAdmin && (
              <div className="mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-100">SSO Allowlist</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Only these emails can sign in via Google when any allowlist is configured.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Add allowed email"
                    type="email"
                    value={ssoEmail}
                    onChange={(e) => setSsoEmail(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-zinc-100"
                  />
                  <Button
                    onClick={handleAddSsoEmail}
                    disabled={!ssoEmail || savingAllowlist}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add
                  </Button>
                </div>

                {loadingAllowlist ? (
                  <div className="text-xs text-zinc-500">Loading allowlist...</div>
                ) : ssoAllowlist.length === 0 ? (
                  <div className="text-xs text-zinc-500">No emails added yet.</div>
                ) : (
                  <div className="space-y-2">
                    {ssoAllowlist.map(email => (
                      <div key={email} className="flex items-center justify-between px-3 py-2 bg-zinc-900 rounded border border-zinc-700">
                        <span className="text-xs text-zinc-300">{email}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveSsoEmail(email)}
                          className="text-red-400 hover:text-red-300 hover:bg-zinc-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members List */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-zinc-500 uppercase">Members</h4>
              {loadingMembers ? (
                <div className="text-center py-8 text-zinc-500">Loading members...</div>
              ) : (
                orgMembers.map(member => (
                  <div
                    key={member.user_id}
                    className="p-3 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={member.picture || 'https://via.placeholder.com/40'}
                        alt={member.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-100">{member.name}</p>
                          {member.is_owner && (
                            <Crown className="w-3.5 h-3.5 text-yellow-500" title="Owner" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && !member.is_owner ? (
                        <Select
                          value={member.role}
                          onValueChange={(newRole) => handleUpdateRole(member.user_id, newRole)}
                        >
                          <SelectTrigger className={`w-28 border ${getRoleBadgeColor(member.role)}`}>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(member.role)}
                              <span className="capitalize text-xs">{member.role}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="edit">Edit</SelectItem>
                            <SelectItem value="view">View</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs border flex items-center gap-1 ${getRoleBadgeColor(member.role)}`}>
                          {getRoleIcon(member.role)}
                          <span className="capitalize">{member.role}</span>
                        </span>
                      )}

                      {isAdmin && !member.is_owner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRemovingMember(member)}
                          className="text-red-400 hover:text-red-300 hover:bg-zinc-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete Organization Dialog */}
      <AlertDialog open={!!deletingOrg} onOpenChange={() => setDeletingOrg(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Organization?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{deletingOrg?.name}"? This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All collections</li>
                <li>All requests</li>
                <li>All environments</li>
                <li>All member access</li>
              </ul>
              <p className="mt-2 font-semibold text-red-400">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrg}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Dialog */}
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Remove Member?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to remove {removingMember?.name} from this organization?
              They will lose access to all collections, requests, and environments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRemoveMember(removingMember.user_id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrganizationManager;