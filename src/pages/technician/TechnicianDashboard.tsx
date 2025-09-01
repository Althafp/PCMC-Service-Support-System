import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TechnicianStats {
  totalReports: number;
  draftReports: number;
  submittedReports: number;
  approvedReports: number;
}

export function TechnicianDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TechnicianStats>({
    totalReports: 0,
    draftReports: 0,
    submittedReports: 0,
    approvedReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTechnicianStats();
    }
  }, [user]);

  const fetchTechnicianStats = async () => {
    if (!user) return;

    try {
      const { data: reports, error } = await supabase
        .from('service_reports')
        .select('id, status, approval_status')
        .eq('technician_id', user.id);

      if (error) throw error;

      const reportsData = reports || [];
      setStats({
        totalReports: reportsData.length,
        draftReports: reportsData.filter(r => r.status === 'draft').length,
        submittedReports: reportsData.filter(r => r.status === 'submitted').length,
        approvedReports: reportsData.filter(r => r.approval_status === 'approve').length,
      });
    } catch (error) {
      console.error('Error fetching technician stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Draft Reports',
      value: stats.draftReports,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Submitted',
      value: stats.submittedReports,
      icon: AlertCircle,
      color: 'bg-orange-500',
    },
    {
      title: 'Approved',
      value: stats.approvedReports,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
  ];

  if (loading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-gray-600 mt-1">Track your service reports and activities</p>
        </div>
        <Link
          to="/technician/new-report"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Report
        </Link>
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/technician/new-report"
            className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Plus className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Create New Report</h3>
            <p className="text-sm text-gray-600">Start a new service report</p>
          </Link>
          <Link
            to="/technician/reports"
            className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <FileText className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">View My Reports</h3>
            <p className="text-sm text-gray-600">Check report status</p>
          </Link>
          <Link
            to="/technician/locations"
            className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <CheckCircle className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">View Locations</h3>
            <p className="text-sm text-gray-600">Browse service locations</p>
          </Link>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h2>
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No recent reports found</p>
          <p className="text-sm">Create your first service report to get started</p>
        </div>
      </div>
    </div>
  );
}