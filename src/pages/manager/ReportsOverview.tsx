import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Search, Filter, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TeamReport {
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

export function ReportsOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<TeamReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTeamLeader, setFilterTeamLeader] = useState('');
  const [teamLeaders, setTeamLeaders] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    if (user) {
      fetchTeamReports();
    }
  }, [user, filterTeamLeader]);

  const fetchTeamReports = async () => {
    if (!user) return;

    try {
      // First get team leaders under this manager
      const { data: teamLeadersData, error: teamLeadersError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('manager_id', user.id)
        .eq('role', 'team_leader')
        .eq('is_active', true);

      if (teamLeadersError) throw teamLeadersError;
      setTeamLeaders(teamLeadersData || []);

      // Get all team members under this manager (including team leaders and their subordinates)
      const { data: teamData, error: teamError } = await supabase
        .from('users')
        .select('id, team_leader_id')
        .eq('manager_id', user.id);

      if (teamError) throw teamError;

      if (!teamData || teamData.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      // Filter by team leader if selected
      let technicianIds = teamData.map(m => m.id);
      if (filterTeamLeader) {
        // Get technicians under the selected team leader
        const { data: techData, error: techError } = await supabase
          .from('users')
          .select('id')
          .eq('team_leader_id', filterTeamLeader)
          .in('role', ['technician', 'technical_executive'])
          .eq('is_active', true);
        
        if (techError) throw techError;
        technicianIds = techData?.map(t => t.id) || [];
      }

      // Then get reports from filtered team members
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
        .in('technician_id', technicianIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const teamReports = data?.map(report => ({
        id: report.id,
        title: report.title || 'Untitled Report',
        status: report.status,
        complaint_no: report.complaint_no,
        complaint_type: report.complaint_type,
        location: report.location,
        created_at: report.created_at,
        approval_status: report.approval_status,
        rejection_remarks: report.rejection_remarks,
        technician: report.technician,
      })) || [];
      
      setReports(teamReports);
    } catch (error) {
      console.error('Error fetching team reports:', error);
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
    const matchesType = !filterType || report.complaint_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
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

  const uniqueTypes = [...new Set(reports.map(r => r.complaint_type).filter(Boolean))];

  if (loading) {
    return <div className="animate-pulse">Loading team reports...</div>;
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
        <h1 className="text-2xl font-bold text-gray-900">Reports Overview</h1>
        <div></div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search reports, complaints, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Leader</label>
            <select
              value={filterTeamLeader}
              onChange={(e) => setFilterTeamLeader(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Teams</option>
              {teamLeaders.map(leader => (
                <option key={leader.id} value={leader.id}>{leader.full_name}</option>
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
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approve">Approved</option>
              <option value="reject">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterTeamLeader('');
                setFilterStatus('');
                setFilterType('');
              }}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Team Reports</h2>
          <p className="text-sm text-gray-600">Reports submitted by your team members</p>
        </div>
        
        {filteredReports.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus || filterType 
                ? 'Try adjusting your search criteria'
                : 'No reports have been submitted by your teams yet'
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
                    Type & Location
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
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{report.title}</div>
                      <div className="text-sm text-gray-500">ID: {report.complaint_no || report.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{report.technician?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{report.technician?.employee_id || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{report.complaint_type || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{report.location || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(report.approval_status || 'pending')}
                      {report.rejection_remarks && (
                        <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={report.rejection_remarks}>
                          {report.rejection_remarks}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/manager/report-view/${report.id}`)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reports.filter(r => !r.approval_status || r.approval_status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reports.filter(r => r.approval_status === 'approve').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reports.filter(r => r.approval_status === 'reject').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
