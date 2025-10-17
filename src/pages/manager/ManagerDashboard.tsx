import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  MapPin, 
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDepartment } from '../../contexts/DepartmentContext';

interface TeamMember {
  id: string;
  full_name: string;
  employee_id: string;
  role: string;
  zone?: string;
  is_active: boolean;
}

interface Report {
  id: string;
  status: string;
  approval_status: string;
  created_at: string;
}

export function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedDepartment } = useDepartment();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({
    totalTeamMembers: 0,
    activeMembers: 0,
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
  });

  useEffect(() => {
    if (user && selectedDepartment) {
      fetchDashboardData();
    }
  }, [user, selectedDepartment]);

    const fetchDashboardData = async () => {
    if (!user || !selectedDepartment) return;

    try {
      console.log('=== FETCHING DASHBOARD DATA ===');
      console.log('Manager ID:', user.id);
      console.log('Selected Department ID:', selectedDepartment.id);
      console.log('Selected Department Name:', selectedDepartment.name);
      
      // Debug: Check ALL users in selected department
      const { data: allMembers } = await supabase
        .from('users')
        .select('id, full_name, employee_id, department_id, department, role')
        .eq('department_id', selectedDepartment.id)
        .in('role', ['technician', 'team_leader']);
      
      console.log('ALL users in selected department:', allMembers?.length || 0, allMembers);
      
      // Get team members (technicians + team leaders) in selected department only
      const { data: teamMembersData, error: teamError } = await supabase
        .from('users')
        .select('*')
        .eq('department_id', selectedDepartment.id)
        .in('role', ['technician', 'team_leader'])
        .eq('is_active', true)
        .order('full_name');

      if (teamError) throw teamError;
      
      console.log('Team members WITH department filter:', teamMembersData?.length || 0, teamMembersData);
      setTeamMembers(teamMembersData || []);

      // Get reports from team members in this department
      const teamMemberIds = (teamMembersData || []).map(m => m.id);
      let reportData: any[] = [];
      
      if (teamMemberIds.length > 0) {
        const { data, error: reportError } = await supabase
          .from('service_reports')
          .select('*')
          .in('technician_id', teamMemberIds)
          .neq('status', 'draft')
          .order('created_at', { ascending: false });

        if (reportError) throw reportError;
        
        reportData = data || [];
        console.log('Reports fetched:', reportData.length);
        setReports(reportData);
      } else {
        setReports([]);
      }

      // Calculate stats
      const totalTeamMembers = teamMembersData?.length || 0;
      const activeMembers = teamMembersData?.filter(m => m.is_active).length || 0;
      const totalReports = reportData.length;
      const pendingReports = reportData.filter(r => 
        !r.approval_status || r.approval_status === 'pending'
      ).length;
      const approvedReports = reportData.filter(r => 
        r.approval_status === 'approve'
      ).length;
      const rejectedReports = reportData.filter(r => 
        r.approval_status === 'reject'
      ).length;

      console.log('Stats calculated:', {
        totalTeamMembers,
        activeMembers,
        totalReports,
        pendingReports
      });

      setStats({
        totalTeamMembers,
        activeMembers,
        totalReports,
        pendingReports,
        approvedReports,
        rejectedReports,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleTeamManagement = () => {
    console.log('Navigating to team management...');
    navigate('/manager/team');
  };

  const handleReportsOverview = () => {
    navigate('/manager/reports');
  };

  const handleLocationManagement = () => {
    navigate('/manager/locations');
  };

  const handleAnalytics = () => {
    navigate('/manager/analytics');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600">Overview of your teams and operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Welcome back, {user.full_name}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleTeamManagement}
            className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Team Management</h3>
            <p className="text-sm text-gray-600">Manage team leaders and members</p>
          </button>

          <button
            onClick={handleReportsOverview}
            className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <FileText className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Reports Overview</h3>
            <p className="text-sm text-gray-600">View all team reports and analytics</p>
          </button>

          <button
            onClick={handleLocationManagement}
            className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <MapPin className="w-6 h-6 text-orange-600 mb-2" />
            <h3 className="font-medium text-gray-900">Location Management</h3>
            <p className="text-sm text-gray-600">Manage project locations</p>
          </button>

          <button
            onClick={handleAnalytics}
            className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600">Performance metrics and insights</p>
          </button>
        </div>
      </div>

      {/* Team Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Team Overview</h2>
              <p className="text-sm text-gray-600">Your team leaders and their status</p>
            </div>
            <button
              onClick={handleTeamManagement}
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
                    <div>Zone: {member.zone || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reports Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reports Summary</h2>
              <p className="text-sm text-gray-600">Overview of all team reports</p>
            </div>
            <button
              onClick={handleReportsOverview}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.approvedReports}</div>
              <div className="text-sm text-gray-600">Approved Reports</div>
              <div className="flex items-center justify-center mt-2">
                <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-xs text-green-600">Success</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.pendingReports}</div>
              <div className="text-sm text-gray-600">Pending Reports</div>
              <div className="flex items-center justify-center mt-2">
                <Clock className="w-4 h-4 text-yellow-600 mr-1" />
                <span className="text-xs text-yellow-600">In Progress</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{stats.rejectedReports}</div>
              <div className="text-sm text-gray-600">Rejected Reports</div>
              <div className="flex items-center justify-center mt-2">
                <XCircle className="w-4 h-4 text-red-600 mr-1" />
                <span className="text-xs text-red-600">Needs Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-600">Latest reports and updates from your teams</p>
        </div>
        
        <div className="p-6">
          {reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No reports submitted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Report #{report.id}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(report.approval_status || 'pending')}
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'approve':
      return <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Approved
      </span>;
    case 'reject':
      return <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Rejected
      </span>;
    default:
      return <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>;
  }
}