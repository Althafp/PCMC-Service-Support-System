import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Filter, 
  Eye, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  MapPin,
  ChevronDown,
  ChevronRight,
  UsersIcon
} from 'lucide-react';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../lib/supabase';

interface TeamLeaderWithTechnicians extends User {
  technicians?: User[];
  isExpanded?: boolean;
}

export function HierarchicalTeamManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teamLeaders, setTeamLeaders] = useState<TeamLeaderWithTechnicians[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (user) {
      fetchTeamLeaders();
    }
  }, [user]);

  const fetchTeamLeaders = async () => {
    if (!user) return;

    try {
      console.log('Fetching team leaders for manager:', user.id, user.full_name);
      
      // Get only team leaders under this manager
      const { data: teamLeadersData, error } = await userService.getManagerTeamLeaders(user.id);
      if (error) throw error;
      
      console.log('Team leaders found:', teamLeadersData.length);
      
      // Initialize with isExpanded false
      const teamLeadersWithState = teamLeadersData.map(leader => ({
        ...leader,
        technicians: [],
        isExpanded: false
      }));
      
      setTeamLeaders(teamLeadersWithState);
    } catch (error) {
      console.error('Error fetching team leaders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamLeaderExpansion = async (teamLeaderId: string) => {
    const updatedTeamLeaders = [...teamLeaders];
    const teamLeaderIndex = updatedTeamLeaders.findIndex(tl => tl.id === teamLeaderId);
    
    if (teamLeaderIndex === -1) return;
    
    const teamLeader = updatedTeamLeaders[teamLeaderIndex];
    
    if (!teamLeader.isExpanded) {
      // Expand - fetch technicians
      try {
        console.log('Fetching technicians for team leader:', teamLeader.full_name);
        const { data: technicians, error } = await userService.getTechniciansUnderTeamLeader(teamLeaderId);
        if (error) throw error;
        
        console.log('Technicians found:', technicians.length);
        teamLeader.technicians = technicians;
        teamLeader.isExpanded = true;
      } catch (error) {
        console.error('Error fetching technicians:', error);
        return;
      }
    } else {
      // Collapse
      teamLeader.isExpanded = false;
    }
    
    setTeamLeaders(updatedTeamLeaders);
  };

  const filteredTeamLeaders = teamLeaders.filter(leader => {
    const matchesSearch = 
      leader.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leader.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leader.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesZone = !filterZone || leader.zone === filterZone;
    const matchesStatus = !filterStatus || 
      (filterStatus === 'active' && leader.is_active) ||
      (filterStatus === 'inactive' && !leader.is_active);
    
    return matchesSearch && matchesZone && matchesStatus;
  });

  const uniqueZones = [...new Set(teamLeaders.map(tl => tl.zone).filter(Boolean))];

  const getRoleBadge = (role: string) => {
    const roleColors: { [key: string]: string } = {
      technician: 'bg-blue-100 text-blue-800',
      technical_executive: 'bg-purple-100 text-purple-800',
      team_leader: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        roleColors[role] || 'bg-gray-100 text-gray-800'
      }`}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        <UserCheck className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        <UserX className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  if (loading) {
    return <div className="animate-pulse">Loading team leaders...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/manager')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        <div></div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search team leaders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Zones</option>
              {uniqueZones.map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterZone('');
                setFilterStatus('');
              }}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Team Leaders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Team Leaders ({filteredTeamLeaders.length})
            </h2>
            <div className="text-sm text-gray-500">
              Click on a team leader to view their technicians
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTeamLeaders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No team leaders found</p>
            </div>
          ) : (
            filteredTeamLeaders.map((teamLeader) => (
              <div key={teamLeader.id} className="hover:bg-gray-50">
                {/* Team Leader Row */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleTeamLeaderExpansion(teamLeader.id)}
                        className="flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {teamLeader.isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {teamLeader.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{teamLeader.full_name}</h3>
                        <p className="text-sm text-gray-500">{teamLeader.email}</p>
                        <p className="text-xs text-gray-400">ID: {teamLeader.employee_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {getRoleBadge(teamLeader.role)}
                      {getStatusBadge(teamLeader.is_active)}
                      
                      <div className="text-right text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {teamLeader.zone || 'No zone'}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {teamLeader.mobile || 'No mobile'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technicians List (when expanded) */}
                  {teamLeader.isExpanded && (
                    <div className="mt-4 ml-9 space-y-3">
                      {teamLeader.technicians && teamLeader.technicians.length > 0 ? (
                        <>
                          <div className="flex items-center text-sm font-medium text-gray-700 mb-3">
                            <UsersIcon className="w-4 h-4 mr-2" />
                            Technicians ({teamLeader.technicians.length})
                          </div>
                          {teamLeader.technicians.map((technician) => (
                            <div key={technician.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    {technician.full_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{technician.full_name}</p>
                                  <p className="text-xs text-gray-500">{technician.email}</p>
                                  <p className="text-xs text-gray-400">ID: {technician.employee_id}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {getRoleBadge(technician.role)}
                                {getStatusBadge(technician.is_active)}
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 italic ml-6">
                          No technicians assigned to this team leader
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
