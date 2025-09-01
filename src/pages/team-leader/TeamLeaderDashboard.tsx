import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  MapPin,
  UserCheck,
  UserX,
  Eye
} from 'lucide-react';
import { supabase, User } from '../../lib/supabase';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

interface TeamMember extends User {
  // Extends User interface, no additional properties needed
}

interface Report {
  id: string;
  title: string;
  status: string;
  technician_name: string;
  created_at: string;
  approval_status?: string;
  rejection_remarks?: string;
}

export function TeamLeaderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({
    totalTeamMembers: 0,
    activeMembers: 0,
    pendingApprovals: 0,
    approvedReports: 0,
    rejectedReports: 0,
  });

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    fetchPendingReports();
      fetchDashboardStats();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    if (!user) return;

    try {
      console.log('Fetching team members for team leader:', user.id, user.full_name);
      
      // Use the new service to get team members
      const { data, error } = await userService.getTeamLeaderTeam(user.id);
      if (error) throw error;
      
      console.log('Team members found:', data?.length || 0);
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchPendingReports = async () => {
    if (!user) return;

    try {
      // First get team member IDs
      const { data: teamData, error: teamError } = await supabase
        .from('users')
        .select('id')
        .eq('team_leader_id', user.id)
        .eq('is_active', true);

      if (teamError) throw teamError;

      if (!teamData || teamData.length === 0) {
        setPendingReports([]);
        return;
      }

      const teamMemberIds = teamData.map(member => member.id);

      const { data, error } = await supabase
        .from('service_reports')
        .select(`
          id,
          title,
          status,
          created_at,
          approval_status,
          rejection_remarks,
          users!technician_id(full_name)
        `)
        .in('technician_id', teamMemberIds)
        .or('approval_status.is.null,approval_status.eq.pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const reports = data?.map(report => ({
        id: report.id,
        title: report.title || 'Untitled Report',
        status: report.status,
        technician_name: report.users?.full_name || 'Unknown',
        created_at: report.created_at,
        approval_status: report.approval_status,
        rejection_remarks: report.rejection_remarks,
      })) || [];
      
      setPendingReports(reports);
    } catch (error) {
      console.error('Error fetching pending reports:', error);
    }
  };

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      // Get team member stats using the service
      const { data: teamData, error: teamError } = await userService.getTeamLeaderTeam(user.id);
      if (teamError) throw teamError;

      const totalTeamMembers = teamData?.length || 0;
      const activeMembers = teamData?.filter(member => member.is_active).length || 0;

      // Get report stats from team members
      if (totalTeamMembers > 0) {
        const teamMemberIds = teamData?.map(member => member.id) || [];
        
        const { data: reportData, error: reportError } = await supabase
        .from('service_reports')
          .select('approval_status')
          .in('technician_id', teamMemberIds);

        if (reportError) throw reportError;

        const pendingApprovals = reportData?.filter(report => 
          report.approval_status === 'pending' || report.approval_status === null
        ).length || 0;
        
        const approvedReports = reportData?.filter(report => 
          report.approval_status === 'approve'
        ).length || 0;
        
        const rejectedReports = reportData?.filter(report => 
          report.approval_status === 'reject'
        ).length || 0;

        setStats({
          totalTeamMembers,
          activeMembers,
          pendingApprovals,
          approvedReports,
          rejectedReports,
        });
      } else {
        setStats({
          totalTeamMembers,
          activeMembers,
          pendingApprovals: 0,
          approvedReports: 0,
          rejectedReports: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };



  const handleViewTeamReports = () => {
    navigate('/team-leader/reports');
  };

  const handleManageTeam = () => {
    navigate('/team-leader/team');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Leader Dashboard</h1>
          <p className="text-gray-600">Manage your team and approve service reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Welcome back, {user.full_name}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTeamMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.approvedReports}</p>
            </div>
          </div>
              </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
              </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.rejectedReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleManageTeam}
            className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Team</h3>
            <p className="text-sm text-gray-600">View and manage team members</p>
          </button>

                    <button
            onClick={handleViewTeamReports}
            className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
            <FileText className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Team Reports</h3>
            <p className="text-sm text-gray-600">View all team reports</p>
                    </button>

                                         <button
                       onClick={() => navigate('/team-leader/approvals')}
                       className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                     >
                       <CheckCircle className="w-6 h-6 text-orange-600 mb-2" />
                       <h3 className="font-medium text-gray-900">Report Approval</h3>
                       <p className="text-sm text-gray-600">Review and approve reports</p>
                     </button>
                  </div>
                </div>

      {/* Pending Reports */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pending Reports for Approval</h2>
          <p className="text-sm text-gray-600">Reports submitted by your team members</p>
              </div>
        
        {pendingReports.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending reports</h3>
            <p className="text-gray-500">All reports have been reviewed and processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Technician
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{report.title}</div>
                      <div className="text-sm text-gray-500">ID: {report.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{report.technician_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.approval_status === 'approve' 
                          ? 'bg-green-100 text-green-800'
                          : report.approval_status === 'reject'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.approval_status === 'approve' ? 'Approved' :
                         report.approval_status === 'reject' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/team-leader/report-view/${report.id}`)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Report Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team Members Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-600">Your team members and their status</p>
            </div>
            <button
              onClick={handleManageTeam}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-500">Team members will appear here once they are assigned to you.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.slice(0, 6).map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        member.is_active ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-900">
                        {member.full_name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">
                      {member.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>ID: {member.employee_id}</div>
                    <div>Zone: {member.zone}</div>
                    {member.last_login && (
                      <div>Last Login: {new Date(member.last_login).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}