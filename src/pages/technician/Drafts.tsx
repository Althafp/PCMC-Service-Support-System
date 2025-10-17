import React, { useState, useEffect } from 'react';
import { FileText, Edit, Trash2, Clock, ArrowLeft } from 'lucide-react';
import { supabase, ServiceReport } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function Drafts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('service_reports')
        .select('*')
        .eq('technician_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueDraft = (draft: ServiceReport) => {
    navigate('/technician/new-report', {
      state: {
        draftData: draft
      }
    });
  };

  const handleDeleteDraft = async (draftId: string, complaintNo: string) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete this draft?\n\nComplaint #: ${complaintNo}\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeleting(draftId);
    try {
      const { error } = await supabase
        .from('service_reports')
        .delete()
        .eq('id', draftId);

      if (error) throw error;

      // Log audit trail
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'DELETE',
          table_name: 'service_reports',
          record_id: draftId,
          old_data: { complaint_no: complaintNo, status: 'draft' },
          ip_address: 'N/A',
          user_agent: navigator.userAgent
        });
      }

      alert('Draft deleted successfully!');
      fetchDrafts();
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Error deleting draft. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading drafts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/technician')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">My Drafts</h1>
        <div></div>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <Clock className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-900">About Drafts</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Drafts are incomplete reports saved for later. Only you can see your drafts. 
              Click "Continue" to complete and submit a draft, or "Delete" to remove it.
            </p>
          </div>
        </div>
      </div>

      {/* Drafts List */}
      {drafts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Drafts Found</h3>
          <p className="text-gray-500 mb-6">
            You don't have any draft reports. Start creating a new report to save it as a draft.
          </p>
          <button
            onClick={() => navigate('/technician/new-report')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FileText className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Draft
                      </span>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-2 truncate">
                  {draft.complaint_no}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {draft.zone && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Zone:</span>
                      <span>{draft.zone}</span>
                    </div>
                  )}
                  {draft.project_phase && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Phase:</span>
                      <span>{draft.project_phase}</span>
                    </div>
                  )}
                  {draft.location && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Location:</span>
                      <span className="truncate">{draft.location}</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>
                      Last saved: {format(new Date(draft.updated_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleContinueDraft(draft)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Continue
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(draft.id, draft.complaint_no)}
                    disabled={deleting === draft.id}
                    className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {drafts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Draft Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">{drafts.length}</p>
              <p className="text-sm text-gray-600">Total Drafts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {drafts.filter(d => {
                  const daysDiff = Math.floor((Date.now() - new Date(d.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                  return daysDiff === 0;
                }).length}
              </p>
              <p className="text-sm text-gray-600">Saved Today</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {drafts.filter(d => {
                  const daysDiff = Math.floor((Date.now() - new Date(d.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                  return daysDiff > 7;
                }).length}
              </p>
              <p className="text-sm text-gray-600">Older than 7 days</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

