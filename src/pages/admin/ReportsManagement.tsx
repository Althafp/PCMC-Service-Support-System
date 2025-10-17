import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, Download, Filter, Calendar, MapPin } from 'lucide-react';
import { supabase, ServiceReport, ReportStatus } from '../../lib/supabase';
import { format } from 'date-fns';

export function ReportsManagement() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [technicians, setTechnicians] = useState<{ id: string; full_name: string; employee_id: string; role: string }[]>([]);

  useEffect(() => {
    fetchReports();
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, employee_id, role')
        .in('role', ['technician', 'technical_executive'])
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const getReportStatus = (report: ServiceReport) => {
    // If approval_status exists, use it; otherwise use the basic status
    if (report.approval_status) {
      return report.approval_status;
    }
    return report.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approve': return 'bg-green-100 text-green-800';
      case 'reject': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approve': return 'Approved';
      case 'reject': return 'Rejected';
      case 'pending': return 'Pending';
      case 'submitted': return 'Submitted';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Exclude drafts - only show submitted/approved/rejected reports
      const { data, error } = await supabase
        .from('service_reports')
        .select(`
          *,
          technician:users!service_reports_technician_id_fkey(full_name, employee_id, team_leader_id, manager_id)
        `)
        .neq('status', 'draft') // Exclude drafts
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Fetch team leader and manager names for each report
      const reportsWithHierarchy = await Promise.all(
        (data || []).map(async (report) => {
          const technician = report.technician;
          if (!technician) return report;

          let teamLeaderName = 'Unassigned';
          let managerName = 'Unassigned';

          // Fetch team leader name if exists
          if (technician.team_leader_id) {
            try {
              const { data: tlData } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', technician.team_leader_id)
                .single();
              if (tlData) teamLeaderName = tlData.full_name;
            } catch (error) {
              console.warn('Could not fetch team leader name:', error);
            }
          }

          // Fetch manager name if exists
          if (technician.manager_id) {
            try {
              const { data: mgrData } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', technician.manager_id)
                .single();
              if (mgrData) managerName = mgrData.full_name;
            } catch (error) {
              console.warn('Could not fetch manager name:', error);
            }
          }

          return {
            ...report,
            technician: {
              ...technician,
              teamLeaderName,
              managerName
            }
          };
        })
      );

      setReports(reportsWithHierarchy);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const reportStatus = getReportStatus(report);
    const matchesStatus = statusFilter === 'all' || reportStatus === statusFilter;
    const matchesDate = !dateFilter || report.date === dateFilter;
    const matchesTechnician = !technicianFilter || report.technician_id === technicianFilter;
    return matchesStatus && matchesDate && matchesTechnician;
  });

  const downloadReport = async (report: ServiceReport) => {
    try {
      // Create a CSV content for the report
      const csvContent = [
        ['Report ID', report.id],
        ['Complaint Number', report.complaint_no],
        ['Complaint Type', report.complaint_type],
        ['Project Phase', report.project_phase],
        ['System Type', report.system_type],
        ['Date', report.date],
        ['Location', report.location],
        ['Zone', report.zone],
        ['Status', getStatusText(getReportStatus(report))],
        ['Technician', (report as any).technician?.full_name || 'Unassigned'],
        ['Created At', report.created_at],
        ['Updated At', report.updated_at],
      ].map(row => row.join(',')).join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${report.complaint_no}_${report.date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please try again.');
    }
  };

  const exportAllReports = async () => {
    try {
      // Create CSV header
      const headers = [
        'Report ID',
        'Complaint Number',
        'Complaint Type',
        'Project Phase',
        'System Type',
        'Date',
        'Location',
        'Zone',
        'Status',
        'Technician',
        'Created At',
        'Updated At'
      ];

      // Create CSV rows
      const csvRows = filteredReports.map(report => [
        report.id,
        report.complaint_no,
        report.complaint_type,
        report.project_phase,
        report.system_type,
        report.date,
        report.location,
        report.zone,
        getStatusText(getReportStatus(report)),
        (report as any).technician?.full_name || 'Unassigned',
        report.created_at,
        report.updated_at
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...csvRows].map(row => row.join(',')).join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_reports_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting reports:', error);
      alert('Error exporting reports. Please try again.');
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
        <button 
          onClick={exportAllReports}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Reports
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="approve">Approved</option>
              <option value="reject">Rejected</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Technicians</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.full_name} ({tech.employee_id}) - {tech.role.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('');
                setTechnicianFilter('');
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                  Hierarchy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {report.complaint_no}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.complaint_type} - {report.system_type}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(report.date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(report as any).technician?.full_name || 'Unassigned'}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {(report as any).technician?.employee_id || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="text-xs text-gray-500 mb-1">Team Leader:</div>
                      <div className="text-sm font-medium">
                        {(report as any).technician?.teamLeaderName || 'Unassigned'}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">Manager:</div>
                      <div className="text-sm font-medium">
                        {(report as any).technician?.managerName || 'Unassigned'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {report.location}
                    </div>
                    <div className="text-xs text-gray-500">Zone: {report.zone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(getReportStatus(report))}`}>
                      {getStatusText(getReportStatus(report))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => navigate(`/admin/report-view/${report.id}`)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="View Report"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => downloadReport(report)}
                      className="text-green-600 hover:text-green-900"
                      title="Download Report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No reports found matching your criteria</p>
        </div>
      )}
    </div>
  );
}