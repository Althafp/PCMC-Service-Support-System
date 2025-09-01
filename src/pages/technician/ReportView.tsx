import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin, Calendar, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase, ServiceReport } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface ReportData extends ServiceReport {
  technician: {
    full_name: string;
    employee_id: string;
  };
}

export function ReportView() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    if (!reportId) return;

    try {
      const { data, error } = await supabase
        .from('service_reports')
        .select(`
          *,
          technician:users!service_reports_technician_id_fkey(full_name, employee_id)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Error loading report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, approvalStatus?: string) => {
    if (approvalStatus === 'approve') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1" />
          Approved
        </span>
      );
    }
    if (approvalStatus === 'reject') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-4 h-4 mr-1" />
          Rejected
        </span>
      );
    }
    
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-4 h-4 mr-1" />
            Draft
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FileText className="w-4 h-4 mr-1" />
            Submitted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading report...</div>;
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Report not found</h3>
        <p className="text-gray-500">The report you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/technician/reports')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
            <p className="text-gray-600">View your service report</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(report.status, report.approval_status)}
        </div>
      </div>

      {/* Report Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Complaint Number</label>
                <p className="text-sm text-gray-900">{report.complaint_no || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Title</label>
                <p className="text-sm text-gray-900">{report.title || 'Untitled Report'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Complaint Type</label>
                <p className="text-sm text-gray-900">{report.complaint_type || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Project Phase</label>
                <p className="text-sm text-gray-900">{report.project_phase || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">System Type</label>
                <p className="text-sm text-gray-900">{report.system_type || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Location & Date */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location & Date</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Date</label>
                <p className="text-sm text-gray-900">
                  {report.date ? format(new Date(report.date), 'MMM dd, yyyy') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Location</label>
                <p className="text-sm text-gray-900">{report.location || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Zone</label>
                <p className="text-sm text-gray-900">{report.zone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Ward No</label>
                <p className="text-sm text-gray-900">{report.ward_no || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">PS Limits</label>
                <p className="text-sm text-gray-900">{report.ps_limits || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">JB SL No</label>
                <p className="text-sm text-gray-900">{report.jb_sl_no || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Pole ID</label>
                <p className="text-sm text-gray-900">{report.pole_id || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">RFP No</label>
                <p className="text-sm text-gray-900">{report.rfp_no || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Nature of Complaint</label>
                <p className="text-sm text-gray-900">{report.nature_of_complaint || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Field Team Remarks</label>
                <p className="text-sm text-gray-900">{report.field_team_remarks || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Feedback */}
        {report.customer_feedback && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Feedback</h3>
            <p className="text-gray-700">{report.customer_feedback}</p>
          </div>
        )}

        {/* Rejection Remarks */}
        {report.rejection_remarks && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-red-900 mb-3">Rejection Remarks</h3>
            <p className="text-red-700">{report.rejection_remarks}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Signatures</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technician Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Signature</label>
              {report.tech_signature ? (
                <div className="border border-gray-200 rounded-lg p-3">
                  <img 
                    src={report.tech_signature} 
                    alt="Technician Signature" 
                    className="max-w-full h-20 object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                  No signature provided
                </div>
              )}
            </div>

            {/* Team Leader Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Leader Signature</label>
              {report.tl_signature ? (
                <div className="border border-gray-200 rounded-lg p-3">
                  <img 
                    src={report.tl_signature} 
                    alt="Team Leader Signature" 
                    className="max-w-full h-20 object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                  Not signed yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">Created</label>
              <p className="text-sm text-gray-900">
                {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-sm text-gray-900">
                {format(new Date(report.updated_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            {report.approved_at && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Approved At</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(report.approved_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
