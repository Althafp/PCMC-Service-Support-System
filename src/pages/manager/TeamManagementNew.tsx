import React, { useState, useEffect } from 'react';
import { Plus, Users, UserPlus, Edit2, Trash2, Shield, Eye, UserCheck, ChevronDown, ChevronUp, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDepartment } from '../../contexts/DepartmentContext';
import { AddTechnicianModal } from '../../components/Manager/AddTechnicianModal';

interface Team {
  id: string;
  team_name: string;
  manager_id: string;
  team_leader_id: string | null;
  zone: string | null;
  is_active: boolean;
  created_at: string;
  team_leader?: {
    full_name: string;
    employee_id: string;
  };
}

interface TeamMember {
  id: string;
  full_name: string;
  employee_id: string;
  email: string;
  mobile: string;
  zone: string;
  designation: string;
  is_active: boolean;
}

export function TeamManagementNew() {
  const { user } = useAuth();
  const { selectedDepartment } = useDepartment();
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassignedMembers, setUnassignedMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showTeamMembersModal, setShowTeamMembersModal] = useState(false);
  const [showAssignLeaderModal, setShowAssignLeaderModal] = useState(false);
  const [showAssignToTeamModal, setShowAssignToTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showAddUnassignedMemberModal, setShowAddUnassignedMemberModal] = useState(false);
  
  // Selected team
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [allTeamLeaders, setAllTeamLeaders] = useState<any[]>([]);
  
  // Form data
  const [teamName, setTeamName] = useState('');
  const [teamZone, setTeamZone] = useState('');
  
  // Edit team form data
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamZone, setEditTeamZone] = useState('');
  const [editTeamLeaderId, setEditTeamLeaderId] = useState<string>('');

  useEffect(() => {
    if (user && selectedDepartment) {
      fetchTeams();
      fetchUnassignedMembers();
    }
  }, [user, selectedDepartment]);

  const fetchTeams = async () => {
    if (!user || !selectedDepartment) return;
    
    try {
      setLoading(true);
      console.log('Fetching teams for department:', selectedDepartment.id);
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_leader:users!teams_team_leader_id_fkey(full_name, employee_id)
        `)
        .eq('department_id', selectedDepartment.id)
        .order('created_at', { ascending: false});

      if (error) throw error;
      console.log('Teams fetched:', data?.length || 0, data);
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedMembers = async () => {
    if (!user || !selectedDepartment) return;
    
    try {
      console.log('=== FETCHING UNASSIGNED MEMBERS ===');
      console.log('Selected Department ID:', selectedDepartment.id);
      console.log('Selected Department Name:', selectedDepartment.name);
      
      // First, check ALL technicians and team leaders in this department
      const { data: allMembers } = await supabase
        .from('users')
        .select('id, full_name, employee_id, department_id, department, team_id, manager_id, role')
        .eq('department_id', selectedDepartment.id)
        .in('role', ['technician', 'team_leader']);
      
      console.log('ALL technicians/team leaders in this department:', allMembers?.length || 0, allMembers);
      
      // Fetch unassigned technicians and team leaders in selected department
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, employee_id, email, mobile, zone, designation, is_active, department_id, department, role')
        .eq('department_id', selectedDepartment.id)
        .in('role', ['technician', 'team_leader'])
        .is('team_id', null)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      console.log('Unassigned members (techs + team leaders) WITH department filter:', data?.length || 0, data);
      setUnassignedMembers(data || []);
    } catch (error) {
      console.error('Error fetching unassigned members:', error);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, employee_id, email, mobile, zone, designation, is_active')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !selectedDepartment) return;
    if (!teamName.trim()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .insert({
          team_name: teamName.trim(),
          manager_id: user.id,
          department_id: selectedDepartment.id,
          zone: teamZone.trim() || null,
        });

      if (error) {
        if (error.code === '23505') {
          console.error('A team with this name already exists');
        } else {
          throw error;
        }
        return;
      }

      setShowCreateTeamModal(false);
      setTeamName('');
      setTeamZone('');
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"? All members will be unassigned from this team.`)) {
      return;
    }

    try {
      // First, unassign all team members
      await supabase
        .from('users')
        .update({ team_id: null, team_name: null, team_leader_id: null })
        .eq('team_id', teamId);

      // Then delete the team
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleToggleTeamStatus = async (team: Team) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ is_active: !team.is_active })
        .eq('id', team.id);

      if (error) throw error;
      fetchTeams();
    } catch (error) {
      console.error('Error updating team status:', error);
    }
  };

  const handleViewTeam = async (team: Team) => {
    setSelectedTeam(team);
    await fetchTeamMembers(team.id);
    setShowTeamMembersModal(true);
  };

  const handleAssignLeader = async (team: Team) => {
    setSelectedTeam(team);
    await fetchTeamMembers(team.id);
    setShowAssignLeaderModal(true);
  };

  const handleSetTeamLeader = async (memberId: string) => {
    if (!selectedTeam) return;

    try {
      // Update team's team_leader_id
      const { error: teamError } = await supabase
        .from('teams')
        .update({ team_leader_id: memberId })
        .eq('id', selectedTeam.id);

      if (teamError) throw teamError;

      // Update all team members' team_leader_id
      const { error: usersError } = await supabase
        .from('users')
        .update({ team_leader_id: memberId })
        .eq('team_id', selectedTeam.id);

      if (usersError) throw usersError;

      setShowAssignLeaderModal(false);
      fetchTeams();
    } catch (error) {
      console.error('Error assigning team leader:', error);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this team?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          team_id: null, 
          team_name: null, 
          team_leader_id: null 
        })
        .eq('id', memberId);

      if (error) throw error;

      if (selectedTeam) {
        await fetchTeamMembers(selectedTeam.id);
      }
      fetchUnassignedMembers();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleAssignToTeam = async (teamId: string, teamName: string) => {
    if (!selectedMember) return;

    try {
      const updateData: any = {
        team_id: teamId, 
        team_name: teamName,
      };

      // If member is a team leader, convert to technician when adding to team
      if ((selectedMember as any).role === 'team_leader') {
        updateData.role = 'technician';
        console.log('Converting team leader to technician when adding to team');
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', selectedMember.id);

      if (error) throw error;

      setShowAssignToTeamModal(false);
      setSelectedMember(null);
      fetchUnassignedMembers();
      fetchTeams();
    } catch (error) {
      console.error('Error assigning member to team:', error);
    }
  };

  const handleAddUnassignedMemberToTeam = async (memberId: string) => {
    if (!selectedTeam) return;

    try {
      const member = unassignedMembers.find(m => m.id === memberId);
      if (!member) return;

      const updateData: any = {
        team_id: selectedTeam.id, 
        team_name: selectedTeam.team_name,
      };

      // If member is a team leader, convert to technician when adding to team
      if ((member as any).role === 'team_leader') {
        updateData.role = 'technician';
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', memberId);

      if (error) throw error;

      setShowAddUnassignedMemberModal(false);
      fetchUnassignedMembers();
      fetchTeams();
      // Refresh team members if we're in edit mode
      if (selectedTeam) {
        await fetchTeamMembers(selectedTeam.id);
      }
    } catch (error) {
      console.error('Error adding member to team:', error);
    }
  };

  const toggleTeamExpand = async (team: Team) => {
    setSelectedTeam(team);
    await fetchTeamMembers(team.id);
    setShowTeamMembersModal(true);
  };

  const fetchAllTeamLeaders = async () => {
    if (!user || !selectedDepartment) return;
    
    try {
      // Get all teams with their team leaders in selected department
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select(`
          id,
          team_name,
          team_leader_id,
          team_leader:users!teams_team_leader_id_fkey(id, full_name, employee_id)
        `)
        .eq('department_id', selectedDepartment.id)
        .not('team_leader_id', 'is', null);

      if (error) throw error;
      
      // Format the data
      const leaders = (teamsData || [])
        .filter(t => t.team_leader)
        .map(t => ({
          id: t.team_leader.id,
          full_name: t.team_leader.full_name,
          employee_id: t.team_leader.employee_id,
          current_team_name: t.team_name,
          current_team_id: t.id
        }));
      
      setAllTeamLeaders(leaders);
    } catch (error) {
      console.error('Error fetching team leaders:', error);
    }
  };

  const handleEditTeam = async (team: Team) => {
    setSelectedTeam(team);
    setEditTeamName(team.team_name);
    setEditTeamZone(team.zone || '');
    setEditTeamLeaderId(team.team_leader_id || '');
    await fetchTeamMembers(team.id);
    await fetchAllTeamLeaders();
    setShowEditTeamModal(true);
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;
    if (!editTeamName.trim()) {
      return;
    }

    try {
      // Update team details
      const { error: teamError } = await supabase
        .from('teams')
        .update({
          team_name: editTeamName.trim(),
          zone: editTeamZone.trim() || null,
          team_leader_id: editTeamLeaderId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTeam.id);

      if (teamError) throw teamError;

      // Update all team members with new team name and team leader
      const { error: membersError } = await supabase
        .from('users')
        .update({
          team_name: editTeamName.trim(),
          team_leader_id: editTeamLeaderId || null,
        })
        .eq('team_id', selectedTeam.id);

      if (membersError) throw membersError;

      setShowEditTeamModal(false);
      fetchTeams();
      fetchTeamMembers(selectedTeam.id);
    } catch (error: any) {
      console.error('Error updating team:', error);
      if (error.code === '23505') {
        console.error('A team with this name already exists');
      }
    }
  };

  const handleRemoveMemberFromEdit = async (memberId: string, memberName: string) => {
    if (!selectedTeam) return;
    if (!confirm(`Remove ${memberName} from ${selectedTeam.team_name}?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          team_id: null, 
          team_name: null, 
          team_leader_id: null 
        })
        .eq('id', memberId);

      if (error) throw error;

      // If removing the team leader, update team
      if (selectedTeam.team_leader_id === memberId) {
        await supabase
          .from('teams')
          .update({ team_leader_id: null })
          .eq('id', selectedTeam.id);
        setEditTeamLeaderId('');
      }

      await fetchTeamMembers(selectedTeam.id);
      fetchUnassignedMembers();
      fetchTeams();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">Department: <span className="font-semibold text-blue-600">{selectedDepartment?.name}</span></p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span>Create User</span>
          </button>
          <button
            onClick={() => setShowCreateTeamModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Team</span>
          </button>
        </div>
      </div>

      {/* Info Box */}
      {teams.length === 0 && unassignedMembers.length === 0 && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Getting Started:</strong> No teams or members found in the <strong>{selectedDepartment?.name}</strong> department yet. 
            Create your first team or technician to get started!
          </p>
        </div>
      )}

      {/* Teams List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading teams...</div>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
          <p className="text-gray-600 mb-6">Create your first team to start managing technicians</p>
          <button
            onClick={() => setShowCreateTeamModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Team</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className={`bg-white rounded-lg shadow-sm border ${
                team.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
              }`}
            >
              {/* Team Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{team.team_name}</h3>
                    {team.zone && (
                      <p className="text-sm text-gray-600">Zone: {team.zone}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        team.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {team.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Team Leader */}
                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900">Team Leader</span>
                  </div>
                  {team.team_leader ? (
                    <div className="text-sm text-blue-800">
                      <div className="font-medium">{team.team_leader.full_name}</div>
                      <div className="text-xs text-blue-600">{team.team_leader.employee_id}</div>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-600 italic">Not assigned</p>
                  )}
                </div>

                {/* Edit and Delete Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => handleEditTeam(team)}
                    className="flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Team</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id, team.team_name)}
                    className="flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Members View Button */}
                <button
                  onClick={() => toggleTeamExpand(team)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">View Members</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unassigned Members Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Unassigned Members</h2>
              <p className="text-sm text-gray-600">
                {unassignedMembers.length} member{unassignedMembers.length !== 1 ? 's' : ''} without a team (Technicians & Team Leaders)
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {unassignedMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">All members are assigned to teams</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedMembers.map((member) => (
                <div
                  key={member.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{member.full_name}</h3>
                      <p className="text-sm text-gray-600">{member.employee_id}</p>
                      {member.designation && (
                        <p className="text-xs text-gray-500 mt-1">{member.designation}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                        Unassigned
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        (member as any).role === 'team_leader' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {((member as any).role || 'technician').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  {member.zone && (
                    <p className="text-sm text-gray-600 mb-2">Zone: {member.zone}</p>
                  )}
                  
                  {member.mobile && (
                    <p className="text-sm text-gray-500 mb-2">{member.mobile}</p>
                  )}

                  {(member as any).role === 'team_leader' && (
                    <p className="text-xs text-orange-600 mb-2 italic">
                      ⚠️ Will be converted to Technician when added to team
                    </p>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedMember(member);
                      setShowAssignToTeamModal(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Assign to Team</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Team</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., North Zone Team"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone (Optional)
                </label>
                <input
                  type="text"
                  value={teamZone}
                  onChange={(e) => setTeamZone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., North, South, East, West"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateTeamModal(false);
                  setTeamName('');
                  setTeamZone('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Team Members Modal */}
      {showTeamMembersModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedTeam.team_name}</h2>
                <p className="text-sm text-gray-600">{teamMembers.length} members</p>
              </div>
              <button
                onClick={() => setShowTeamMembersModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No members in this team yet</p>
                <button
                  onClick={() => {
                    setShowTeamMembersModal(false);
                    setShowAddMemberModal(true);
                  }}
                  className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Members</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{member.full_name}</h3>
                        {selectedTeam.team_leader_id === member.id && (
                          <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                            Team Leader
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>{member.employee_id}</span>
                        {member.designation && <span> • {member.designation}</span>}
                        {member.zone && <span> • {member.zone}</span>}
                      </div>
                      {member.mobile && (
                        <div className="text-sm text-gray-500">{member.mobile}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.full_name)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowTeamMembersModal(false);
                  setShowAddMemberModal(true);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add Member to Team</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Team Leader Modal */}
      {showAssignLeaderModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Assign Team Leader</h2>
                <p className="text-sm text-gray-600">{selectedTeam.team_name}</p>
              </div>
              <button
                onClick={() => setShowAssignLeaderModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No members available. Add members to the team first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSetTeamLeader(member.id)}
                    className={`w-full text-left p-4 border rounded-lg transition-colors ${
                      selectedTeam.team_leader_id === member.id
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{member.full_name}</div>
                        <div className="text-sm text-gray-600">
                          {member.employee_id} • {member.designation || 'Technician'}
                        </div>
                      </div>
                      {selectedTeam.team_leader_id === member.id && (
                        <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                          Current Leader
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && selectedTeam && (
        <AddTechnicianModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={() => {
            fetchTeams();
            fetchUnassignedMembers();
            if (selectedTeam) {
              fetchTeamMembers(selectedTeam.id);
            }
          }}
          teamId={selectedTeam.id}
          teamName={selectedTeam.team_name}
        />
      )}

      {/* Create User Modal (No Team Assignment) */}
      {showCreateUserModal && (
        <AddTechnicianModal
          isOpen={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
          onSuccess={() => {
            fetchUnassignedMembers();
          }}
          teamId=""
          teamName="(Will be assigned later)"
        />
      )}

      {/* Assign to Team Modal */}
      {showAssignToTeamModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Assign to Team</h2>
                <p className="text-sm text-gray-600">Select a team for {selectedMember.full_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignToTeamModal(false);
                  setSelectedMember(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No teams available. Create a team first.</p>
                <button
                  onClick={() => {
                    setShowAssignToTeamModal(false);
                    setShowCreateTeamModal(true);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Team
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {teams
                  .filter(team => team.is_active)
                  .map((team) => (
                    <button
                      key={team.id}
                      onClick={() => handleAssignToTeam(team.id, team.team_name)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{team.team_name}</div>
                          {team.zone && (
                            <div className="text-sm text-gray-600">Zone: {team.zone}</div>
                          )}
                          {team.team_leader && (
                            <div className="text-xs text-gray-500 mt-1">
                              Leader: {team.team_leader.full_name}
                            </div>
                          )}
                        </div>
                        <UserPlus className="w-5 h-5 text-blue-600" />
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeamModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full my-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Team</h2>
                <p className="text-sm text-gray-600">{selectedTeam.team_name}</p>
              </div>
              <button
                onClick={() => setShowEditTeamModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Team Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter team name"
                />
              </div>

              {/* Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone (Optional)
                </label>
                <input
                  type="text"
                  value={editTeamZone}
                  onChange={(e) => setEditTeamZone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter zone"
                />
              </div>

              {/* Team Leader Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Leader
                </label>
                <select
                  value={editTeamLeaderId}
                  onChange={(e) => setEditTeamLeaderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No Team Leader</option>
                  
                  {/* Current Team Members */}
                  {teamMembers.length > 0 && (
                    <optgroup label="─── Current Team Members ───">
                      {teamMembers.map((member) => (
                        <option key={`member-${member.id}`} value={member.id}>
                          {member.full_name} - {member.employee_id}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* Team Leaders from Other Teams */}
                  {allTeamLeaders.length > 0 && (
                    <optgroup label="─── Team Leaders from Other Teams ───">
                      {allTeamLeaders
                        .filter(leader => 
                          // Don't show if they're already in current team members
                          !teamMembers.some(m => m.id === leader.id) &&
                          // Don't show if they're from the current team
                          leader.current_team_id !== selectedTeam?.id
                        )
                        .map((leader) => (
                          <option key={`leader-${leader.id}`} value={leader.id}>
                            {leader.full_name} - {leader.employee_id} (Team: {leader.current_team_name})
                          </option>
                        ))
                      }
                    </optgroup>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select from current team members or temporarily assign a team leader from another team
                </p>
              </div>

              {/* Team Members List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Team Members ({teamMembers.length})
                </label>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No members in this team</p>
                    <button
                      onClick={() => {
                        setShowAddUnassignedMemberModal(true);
                      }}
                      className="mt-3 inline-flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Member</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{member.full_name}</p>
                            {editTeamLeaderId === member.id && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                                Team Leader
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{member.employee_id}</p>
                          {member.designation && (
                            <p className="text-xs text-gray-500">{member.designation}</p>
                          )}
                          {member.zone && (
                            <p className="text-xs text-gray-500">Zone: {member.zone}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveMemberFromEdit(member.id, member.full_name)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from team"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Member Button */}
              {teamMembers.length > 0 && (
                <button
                  onClick={() => {
                    setShowAddUnassignedMemberModal(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-green-500 hover:text-green-600 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add More Members</span>
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setShowEditTeamModal(false)}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTeam}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Unassigned Member Modal */}
      {showAddUnassignedMemberModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add Members to {selectedTeam.team_name}</h2>
                <p className="text-sm text-gray-600">Select members to add to the team</p>
              </div>
              <button
                onClick={() => setShowAddUnassignedMemberModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {unassignedMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No unassigned members available</p>
                <p className="text-sm text-gray-500">All members are already assigned to teams.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unassignedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{member.full_name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                          (member as any).role === 'team_leader' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {((member as any).role || 'technician').replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{member.employee_id}</p>
                      {member.designation && (
                        <p className="text-xs text-gray-500 mt-1">{member.designation}</p>
                      )}
                      {member.zone && (
                        <p className="text-xs text-gray-500">Zone: {member.zone}</p>
                      )}
                      {(member as any).role === 'team_leader' && (
                        <p className="text-xs text-orange-600 mt-1 italic">
                          ⚠️ Will be converted to Technician
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddUnassignedMemberToTeam(member.id)}
                      className="ml-4 flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setShowAddUnassignedMemberModal(false)}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

