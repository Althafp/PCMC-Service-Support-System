import React, { useState, useEffect } from 'react';
import { FileText, Eye, Edit, Clock, CheckCircle, XCircle, AlertCircle, Copy } from 'lucide-react';
import { supabase, ServiceReport } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function MyReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchMyReports();
    }
  }, [user]);

  const fetchMyReports = async () => {
    if (!user) return;

    try {
      // Exclude drafts - only show submitted, approved, rejected reports
      const { data, error } = await supabase
        .from('service_reports')
        .select('*')
        .eq('technician_id', user.id)
        .neq('status', 'draft') // Exclude drafts
        .order('created_at', { ascending: false});

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'approve' || statusFilter === 'reject') {
      return report.approval_status === statusFilter;
    }
    return report.status === statusFilter;
  });

  const getStatusIcon = (status: string, approvalStatus?: string) => {
    if (approvalStatus === 'approve') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (approvalStatus === 'reject') return <XCircle className="w-5 h-5 text-red-500" />;
    
    switch (status) {
      case 'draft': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'submitted': return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string, approvalStatus?: string) => {
    if (approvalStatus === 'approve') return 'bg-green-100 text-green-800';
    if (approvalStatus === 'reject') return 'bg-red-100 text-red-800';
    
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, approvalStatus?: string) => {
    if (approvalStatus === 'approve') return 'Approved';
    if (approvalStatus === 'reject') return 'Rejected';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleCloneReport = async (report: ServiceReport) => {
    if (!user) return;
    
    // Instead of cloning to database, navigate to new report with form data
    // We'll pass the report data as state to pre-populate the form
    navigate('/technician/new-report', { 
      state: { 
        cloneData: {
          ...report,
          id: undefined, // Remove ID
          complaint_no: '', // Leave complaint_no blank (unique constraint)
          status: 'draft',
          approval_status: 'pending',
          created_at: undefined,
          updated_at: undefined,
          tech_signature: null,
          tl_signature: null,
          rejection_remarks: null,
          approved_at: null,
          approved_by: null,
          approval_notes: null,
        }
      }
    });
  };

  if (loading) {
    return <div className="animate-pulse">Loading your reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approve">Approved</option>
            <option value="reject">Rejected</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {getStatusIcon(report.status, report.approval_status)}
                <h3 className="text-lg font-semibold text-gray-900 ml-2">
                  {report.complaint_no}
                </h3>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(report.status, report.approval_status)}`}>
                {getStatusText(report.status, report.approval_status)}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="font-medium">{report.complaint_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">System:</span>
                <span className="font-medium">{report.system_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location:</span>
                <span className="font-medium">{report.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium">
                  {format(new Date(report.date), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>

            {report.rejection_remarks && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Rejection Reason:</strong> {report.rejection_remarks}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                Created {format(new Date(report.created_at), 'MMM dd, yyyy')}
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => navigate(`/technician/report-view/${report.id}`)}
                  className="text-blue-600 hover:text-blue-900"
                  title="View Report"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {report.status === 'draft' && (
                  <button className="text-green-600 hover:text-green-900">
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {(report.status === 'submitted' || report.approval_status === 'approve' || report.approval_status === 'reject') && (
                  <button
                    onClick={() => handleCloneReport(report)}
                    className="text-purple-600 hover:text-purple-900"
                    title="Clone Report"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No reports found</p>
          <p className="text-sm">
            {statusFilter === 'all' 
              ? "You haven't created any reports yet" 
              : `No ${statusFilter} reports found`
            }
          </p>
        </div>
      )}
    </div>
  );
}