import React, { useEffect, useState } from 'react';
import { Users, FileText, MapPin, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AddUserModal } from '../../components/Admin/AddUserModal';

interface DashboardStats {
  totalUsers: number;
  totalReports: number;
  totalLocations: number;
  pendingReports: number;
  activeUsers: number;
  completedReports: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'report' | 'location' | 'approval';
  message: string;
  timestamp: string;
  user?: string;
  role?: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [showAddUser, setShowAddUser] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalReports: 0,
    totalLocations: 0,
    pendingReports: 0,
    activeUsers: 0,
    completedReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [usersResult, reportsResult, locationsResult, pendingResult] = await Promise.all([
        supabase.from('users').select('id, is_active'),
        supabase.from('service_reports').select('id, status'),
        supabase.from('location_details').select('id'),
        supabase.from('service_reports').select('id').eq('status', 'submitted'),
      ]);

      const users = usersResult.data || [];
      const reports = reportsResult.data || [];
      const locations = locationsResult.data || [];
      const pending = pendingResult.data || [];

      setStats({
        totalUsers: users.length,
        totalReports: reports.length,
        totalLocations: locations.length,
        pendingReports: pending.length,
        activeUsers: users.filter(u => u.is_active).length,
        completedReports: reports.filter(r => r.status === 'approved').length,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Get recent users
      const { data: recentUsers } = await supabase
        .from('users')
        .select('full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent reports
      const { data: recentReports } = await supabase
        .from('service_reports')
        .select('id, created_at, technician:users!service_reports_technician_id_fkey(full_name, role)')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent approvals
      const { data: recentApprovals } = await supabase
        .from('service_reports')
        .select('id, approved_at, approval_status, technician:users!service_reports_technician_id_fkey(full_name, role)')
        .not('approved_at', 'is', null)
        .order('approved_at', { ascending: false })
        .limit(3);

      const activities: RecentActivity[] = [];

      // Add recent users
      recentUsers?.forEach(user => {
        activities.push({
          id: `user-${user.created_at}`,
          type: 'user',
          message: `New user registered: ${user.full_name} (${user.role})`,
          timestamp: user.created_at,
          user: user.full_name,
          role: user.role,
        });
      });

      // Add recent reports
      recentReports?.forEach(report => {
        activities.push({
          id: `report-${report.created_at}`,
          type: 'report',
          message: `New service report submitted by ${report.technician?.role || 'Technician'} ${report.technician?.full_name || 'Unknown'}`,
          timestamp: report.created_at,
          user: report.technician?.full_name,
          role: report.technician?.role,
        });
      });

      // Add recent approvals
      recentApprovals?.forEach(report => {
        if (report.approval_status === 'approve') {
          activities.push({
            id: `approval-${report.approved_at}`,
            type: 'approval',
            message: `Report approved by ${report.technician?.role || 'Technician'} ${report.technician?.full_name || 'Unknown'}`,
            timestamp: report.approved_at || '',
            user: report.technician?.full_name,
            role: report.technician?.role,
          });
        }
      });

      // Sort by timestamp and take the most recent 5
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return time.toLocaleDateString();
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: `${stats.activeUsers} active`,
    },
    {
      title: 'Service Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'bg-green-500',
      change: `${stats.completedReports} completed`,
    },
    {
      title: 'Locations',
      value: stats.totalLocations,
      icon: MapPin,
      color: 'bg-purple-500',
      change: 'Total locations',
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports,
      icon: AlertCircle,
      color: 'bg-orange-500',
      change: 'Awaiting approval',
    },
  ];

  if (loading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-400">{card.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowAddUser(true)}
            className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Add New User</h3>
            <p className="text-sm text-gray-600">Create a new system user</p>
          </button>
          <button 
            onClick={() => navigate('/admin/reports')}
            className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <FileText className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">View All Reports</h3>
            <p className="text-sm text-gray-600">Manage service reports</p>
          </button>
          <button 
            onClick={() => navigate('/admin/locations')}
            className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <MapPin className="w-6 h-6 text-orange-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Locations</h3>
            <p className="text-sm text-gray-600">View and edit locations</p>
          </button>
          <button 
            onClick={() => navigate('/admin/audit')}
            className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <Activity className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">Audit Logs</h3>
            <p className="text-sm text-gray-600">Monitor system activities</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  activity.type === 'user' ? 'bg-blue-500' :
                  activity.type === 'report' ? 'bg-green-500' :
                  activity.type === 'approval' ? 'bg-orange-500' :
                  'bg-gray-500'
                }`}></div>
                <span className="text-sm text-gray-600 flex-1">{activity.message}</span>
                <span className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSuccess={() => fetchDashboardStats()}
      />
    </div>
  );
}