import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Save, Eye, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ReportData {
  id: string;
  title: string;
  status: string;
  complaint_no: string;
  complaint_type: string;
  location: string;
  nature_of_complaint: string;
  technician_signature: string;
  team_leader_signature: string;
  approval_status: string;
  rejection_remarks: string;
  approval_notes: string;
  created_at: string;
  technician: {
    full_name: string;
    employee_id: string;
  };
}

export function ReportApproval() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  const action = location.state?.action || 'review';

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

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!report || !user) return;

    if (action === 'reject' && !report.rejection_remarks?.trim()) {
      alert('Please provide rejection remarks before rejecting the report.');
      return;
    }

    if (!report.team_leader_signature) {
      alert('Please sign the report before approving or rejecting.');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        approval_status: action,
        team_leader_signature: report.team_leader_signature,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      };

      if (action === 'reject') {
        updateData.rejection_remarks = report.rejection_remarks;
      } else {
        updateData.approval_notes = report.approval_notes;
      }

      const { error } = await supabase
        .from('service_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      // Create audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: action.toUpperCase(),
        table_name: 'service_reports',
        record_id: reportId,
        old_data: { approval_status: report.approval_status },
        new_data: updateData,
      });

      // Send notification to technician
      await supabase.from('notifications').insert({
        user_id: report.technician?.id || '',
        title: `Report ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `Your report "${report.title || report.complaint_no}" has been ${action === 'approve' ? 'approved' : 'rejected'} by your team leader.`,
        type: action === 'approve' ? 'success' : 'warning',
        priority: 'medium',
      });

      alert(`Report ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      navigate('/team-leader');
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Error updating report. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openSignatureModal = () => {
    setShowSignatureModal(true);
  };

  const closeSignatureModal = () => {
    setShowSignatureModal(false);
  };

  const saveSignature = (signatureDataUrl: string) => {
    setReport(prev => prev ? { ...prev, team_leader_signature: signatureDataUrl } : null);
    closeSignatureModal();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h2>
        <p className="text-gray-600 mb-6">The report you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/team-leader')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/team-leader')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Report Approval</h1>
        <div></div>
      </div>

      {/* Report Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Report Details</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Complaint Number</label>
              <p className="text-gray-900 font-medium">{report.complaint_no || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Complaint Type</label>
              <p className="text-gray-900">{report.complaint_type || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <p className="text-gray-900">{report.location || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                report.approval_status === 'approve' 
                  ? 'bg-green-100 text-green-800'
                  : report.approval_status === 'reject'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {report.approval_status === 'approve' ? 'Approved' :
                 report.approval_status === 'reject' ? 'Rejected' : 'Pending Approval'}
              </span>
            </div>
          </div>

          {/* Nature of Complaint */}
          {report.nature_of_complaint && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nature of Complaint</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{report.nature_of_complaint}</p>
            </div>
          )}

          {/* Technician Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-3">Technician Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Name</label>
                <p className="text-blue-900">{report.technician?.full_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Employee ID</label>
                <p className="text-blue-900">{report.technician?.employee_id || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technician Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Technician Signature</label>
              {report.technician_signature ? (
                <div className="border border-gray-200 rounded-lg p-3">
                  <img 
                    src={report.technician_signature} 
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Signature *</label>
              {report.team_leader_signature ? (
                <div className="border border-gray-200 rounded-lg p-3">
                  <img 
                    src={report.team_leader_signature} 
                    alt="Team Leader Signature" 
                    className="max-w-full h-20 object-contain mx-auto"
                  />
                  <button
                    onClick={openSignatureModal}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Re-sign
                  </button>
                </div>
              ) : (
                <button
                  onClick={openSignatureModal}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 hover:border-gray-400 hover:text-gray-700"
                >
                  Click to sign
                </button>
              )}
            </div>
          </div>

          {/* Approval Decision */}
          {report.team_leader_signature && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Approval Decision</h3>
              
              {/* Rejection Remarks */}
              {action === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Remarks *
                  </label>
                  <textarea
                    value={report.rejection_remarks || ''}
                    onChange={(e) => setReport(prev => prev ? { ...prev, rejection_remarks: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="Please provide detailed reasons for rejection..."
                    rows={3}
                    required
                  />
                </div>
              )}

              {/* Approval Notes */}
              {action === 'approve' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={report.approval_notes || ''}
                    onChange={(e) => setReport(prev => prev ? { ...prev, approval_notes: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Any additional notes or comments..."
                    rows={2}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleApproval('approve')}
                  disabled={saving || action === 'reject'}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {saving ? 'Approving...' : 'Approve Report'}
                </button>
                
                <button
                  onClick={() => handleApproval('reject')}
                  disabled={saving || action === 'approve'}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {saving ? 'Rejecting...' : 'Reject Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Leader Signature</h3>
            
            <div className="border-2 border-gray-300 rounded-lg mb-4">
              <canvas
                id="signatureCanvas"
                width={400}
                height={200}
                className="w-full h-48 cursor-crosshair"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  const canvas = document.getElementById('signatureCanvas') as HTMLCanvasElement;
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                  }
                }}
                className="px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Clear
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={closeSignatureModal}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const canvas = document.getElementById('signatureCanvas') as HTMLCanvasElement;
                    if (canvas) {
                      const dataURL = canvas.toDataURL('image/png');
                      saveSignature(dataURL);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
