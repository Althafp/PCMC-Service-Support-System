import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Search, Filter, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PendingReport {
  id: string;
  title: string;
  status: string;
  complaint_no: string;
  complaint_type: string;
  location: string;
  created_at: string;
  approval_status: string;
  rejection_remarks: string;
  technician: {
    full_name: string;
    employee_id: string;
  };
}

export function ReportApprovalList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (user) {
      fetchPendingReports();
    }
  }, [user]);

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
        setReports([]);
        return;
      }

      const teamMemberIds = teamData.map(member => member.id);

      const { data, error } = await supabase
        .from('service_reports')
        .select(`
          id,
          title,
          status,
          complaint_no,
          complaint_type,
          location,
          created_at,
          approval_status,
          rejection_remarks,
          technician:users!service_reports_technician_id_fkey(full_name, employee_id)
        `)
        .in('technician_id', teamMemberIds)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const pendingReports = data?.map(report => ({
        id: report.id,
        title: report.title || 'Untitled Report',
        status: report.status,
        complaint_no: report.complaint_no,
        complaint_type: report.complaint_type,
        location: report.location,
        created_at: report.created_at,
        approval_status: report.approval_status,
        rejection_remarks: report.rejection_remarks,
        technician: {
          full_name: report.technician?.full_name || 'Unknown',
          employee_id: report.technician?.employee_id || 'Unknown'
        },
      })) || [];
      
      setReports(pendingReports);
    } catch (error) {
      console.error('Error fetching pending reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.complaint_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.technician?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || report.approval_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
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
  };

  const handleViewReport = (reportId: string) => {
    navigate(`/team-leader/approvals/${reportId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/team-leader')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Report Approvals</h1>
                <p className="text-gray-600">Review and approve reports from your team members</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {filteredReports.length} of {reports.length} reports
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approve">Approved</option>
                <option value="reject">Rejected</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchPendingReports}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <FileText className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600">
                {reports.length === 0 
                  ? "No reports are currently pending approval from your team members."
                  : "No reports match your current search criteria."
                }
              </p>
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
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{report.title}</div>
                          <div className="text-sm text-gray-500">
                            {report.complaint_no && `Complaint: ${report.complaint_no}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {report.complaint_type && `Type: ${report.complaint_type}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {report.location && `Location: ${report.location}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{report.technician?.full_name}</div>
                        <div className="text-sm text-gray-500">{report.technician?.employee_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(report.approval_status || 'pending')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewReport(report.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
