import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Save, Eye, Download, Pen, RotateCcw, User, Phone, MapPin, Calendar, FileText, Image as ImageIcon, Thermometer, CheckSquare, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ReportData {
  id: string;
  title?: string;
  status: string;
  complaint_no: string;
  complaint_type: string;
  project_phase: string;
  system_type: string;
  date: string;
  zone: string;
  location: string;
  ward_no?: string;
  ps_limits?: string;
  pole_id?: string;
  rfp_no?: string;
  latitude?: number;
  longitude?: number;
  before_image_url?: string;
  after_image_url?: string;
  nature_of_complaint?: string;
  field_team_remarks?: string;
  customer_feedback?: string;
  rejection_remarks?: string;
  tech_signature?: string;
  tech_engineer?: string;
  tech_mobile?: string;
  tl_signature?: string;
  tl_name?: string;
  tl_mobile?: string;
  approval_status?: string;
  created_at: string;
  jb_temperature?: number;
  checklist_data?: any;
  equipment_remarks?: any;
  technician?: {
    full_name: string;
    employee_id: string;
    mobile?: string;
  };
}

export function EnhancedReportApproval() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
          technician:users!service_reports_technician_id_fkey(full_name, employee_id, mobile)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      
      setReport(data);
      setRejectionRemarks(data.rejection_remarks || '');
      setApprovalNotes(data.approval_notes || '');
      setHasSignature(!!data.tl_signature);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Error loading report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL();
    setHasSignature(true);
  };

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!report || !user) return;

    if (action === 'reject' && !rejectionRemarks.trim()) {
      alert('Please provide rejection remarks before rejecting the report.');
      return;
    }

    if (!hasSignature) {
      alert('Please sign the report before approving or rejecting.');
      return;
    }

    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const signatureData = canvas?.toDataURL();

      const updateData: any = {
        approval_status: action,
        tl_signature: signatureData,
        tl_name: user.full_name,
        tl_mobile: user.mobile,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      };

      if (action === 'reject') {
        updateData.rejection_remarks = rejectionRemarks;
      } else {
        updateData.approval_notes = approvalNotes;
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
        ip_address: 'N/A',
        user_agent: navigator.userAgent
      });

      alert(`Report ${action}d successfully!`);
      navigate('/team-leader/approvals');
    } catch (error) {
      console.error(`Error ${action} report:`, error);
      alert(`Error ${action} report. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 200;

    // Set drawing properties
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if available
    if (report?.tl_signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = report.tl_signature;
    }
  }, [report?.tl_signature]);

  // Helper function to render equipment checklist
  const renderEquipmentChecklist = () => {
    if (!report?.checklist_data) return null;

    const checklistCategories = [
      {
        name: 'Junction Box',
        items: [
          'Junction Box Condition',
          'Lock and Key Available',
          'Door Opening/Closing',
          'Earthing Connection',
          'Water Seepage',
          'Ventilation',
          'Internal Wiring',
          'Label/Marking',
          'Overall Cleanliness',
        ],
      },
      {
        name: 'Raw Power Supply',
        items: [
          'Voltage Level (R-N)',
          'Voltage Level (Y-N)',
          'Voltage Level (B-N)',
          'Neutral Connection',
          'Phase Balance',
        ],
      },
      {
        name: 'UPS System',
        items: ['UPS Input Voltage', 'UPS Output Voltage'],
      },
      {
        name: 'Battery',
        items: ['Battery Condition', 'Battery Voltage'],
      },
      {
        name: 'Network Switch',
        items: ['Switch Power Status', 'Port Status', 'LED Indicators', 'Configuration'],
      },
      {
        name: 'Cameras',
        items: [
          'Camera Power Status',
          'Image Quality',
          'Pan/Tilt Operation',
          'Zoom Function',
          'Night Vision',
          'Housing Condition',
          'Lens Cleanliness',
          'Cable Connection',
          'Mounting Stability',
          'IR LED Status',
          'Overall Performance',
        ],
      },
    ];

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'ok':
          return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'issue':
          return <AlertTriangle className="w-4 h-4 text-red-600" />;
        case 'na':
          return <span className="w-4 h-4 text-gray-400">-</span>;
        default:
          return <span className="w-4 h-4 text-gray-400">-</span>;
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'ok':
          return 'OK';
        case 'issue':
          return 'Issue';
        case 'na':
          return 'N/A';
        default:
          return 'Not Checked';
      }
    };

    return (
      <div className="space-y-6">
        {checklistCategories.map((category) => (
          <div key={category.name} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">{category.name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {category.items.map((item) => {
                const status = report.checklist_data[category.name]?.[item] || 'not_checked';
                const remark = report.equipment_remarks?.[category.name]?.[item] || '';
                
                return (
                  <div key={item} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{item}</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      <span className={`text-xs font-medium ${
                        status === 'ok' ? 'text-green-700' :
                        status === 'issue' ? 'text-red-700' :
                        status === 'na' ? 'text-gray-500' :
                        'text-gray-400'
                      }`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Show remarks for items with issues */}
            {category.items.some(item => {
              const status = report.checklist_data[category.name]?.[item];
              const remark = report.equipment_remarks?.[category.name]?.[item];
              return status === 'issue' && remark;
            }) && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <h5 className="text-sm font-medium text-red-800 mb-2">Remarks for Issues:</h5>
                {category.items.map((item) => {
                  const status = report.checklist_data[category.name]?.[item];
                  const remark = report.equipment_remarks?.[category.name]?.[item];
                  if (status === 'issue' && remark) {
                    return (
                      <div key={item} className="text-sm text-red-700 mb-1">
                        <strong>{item}:</strong> {remark}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
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
      <div className="text-center">
        <p className="text-gray-500">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/team-leader/approvals')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Approvals
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Report Approval</h1>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              report.approval_status === 'approve' ? 'bg-green-100 text-green-800' :
              report.approval_status === 'reject' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {report.approval_status || 'Pending Review'}
            </span>
          </div>
        </div>

        {/* Report Overview Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {report.title || `Report #${report.complaint_no}`}
              </h2>
              <p className="text-gray-600">Submitted by {report.technician?.full_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Complaint No</p>
              <p className="text-lg font-semibold">{report.complaint_no}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{report.location}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{new Date(report.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{report.complaint_type}</p>
              </div>
            </div>
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Technician</p>
                <p className="font-medium">{report.technician?.full_name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Report Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Report Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Project Phase</p>
                      <p className="font-medium">{report.project_phase}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">System Type</p>
                      <p className="font-medium">{report.system_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Zone</p>
                      <p className="font-medium">{report.zone}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Location Details</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Ward No</p>
                      <p className="font-medium">{report.ward_no || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">PS Limits</p>
                      <p className="font-medium">{report.ps_limits || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pole ID</p>
                      <p className="font-medium">{report.pole_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">RFP No</p>
                      <p className="font-medium">{report.rfp_no || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {report.nature_of_complaint && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Nature of Complaint</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{report.nature_of_complaint}</p>
                </div>
              )}

              {report.field_team_remarks && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Field Team Remarks</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{report.field_team_remarks}</p>
                </div>
              )}

              {report.customer_feedback && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Customer Feedback</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{report.customer_feedback}</p>
                </div>
              )}
            </div>

                         {/* Images Section */}
             {(report.before_image_url || report.after_image_url) && (
               <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                 <h3 className="text-xl font-semibold mb-4 flex items-center">
                   <ImageIcon className="w-5 h-5 mr-2" />
                   Work Images
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {report.before_image_url && (
                     <div>
                       <h4 className="font-medium mb-3 text-gray-900">Before Work</h4>
                       <div 
                         className="relative cursor-pointer group"
                         onClick={() => setSelectedImage(report.before_image_url || null)}
                       >
                         <img 
                           src={report.before_image_url} 
                           alt="Before Work" 
                           className="w-full h-80 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow" 
                         />
                         <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                           <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                         </div>
                       </div>
                     </div>
                   )}
                   {report.after_image_url && (
                     <div>
                       <h4 className="font-medium mb-3 text-gray-900">After Work</h4>
                       <div 
                         className="relative cursor-pointer group"
                         onClick={() => setSelectedImage(report.after_image_url || null)}
                       >
                         <img 
                           src={report.after_image_url} 
                           alt="After Work" 
                           className="w-full h-80 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow" 
                         />
                         <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                           <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             )}

             {/* Equipment Checklist Section */}
             {report.checklist_data && (
               <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                 <h3 className="text-xl font-semibold mb-4 flex items-center">
                   <CheckSquare className="w-5 h-5 mr-2" />
                   Equipment Checklist
                 </h3>
                 
                 {/* JB Temperature */}
                 {report.jb_temperature && (
                   <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                     <div className="flex items-center">
                       <Thermometer className="w-5 h-5 text-blue-600 mr-2" />
                       <span className="font-medium text-blue-900">Junction Box Temperature:</span>
                       <span className="ml-2 text-blue-700">{report.jb_temperature}°C</span>
                     </div>
                   </div>
                 )}
                 
                 {renderEquipmentChecklist()}
               </div>
             )}
          </div>

          {/* Sidebar - Signatures and Approval */}
          <div className="space-y-6">
            {/* Signatures Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Signatures</h3>
              
              {/* Technician Signature (Read-only) */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Technician Signature</h4>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="text-gray-500">Name: {report.tech_engineer}</p>
                    <p className="text-gray-500">Mobile: {report.tech_mobile}</p>
                  </div>
                  
                  {report.tech_signature ? (
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <img src={report.tech_signature} alt="Technician Signature" className="w-full h-24 object-contain" />
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500 bg-gray-50">
                      No signature available
                    </div>
                  )}
                </div>
              </div>

              {/* Team Leader Signature (Interactive) */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Your Signature</h4>
                
                {/* Team Leader Details */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <input
                        type="text"
                        value={user?.full_name || ''}
                        disabled
                        className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <input
                        type="text"
                        value={user?.mobile || ''}
                        disabled
                        className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Signature Canvas */}
                <div className="border border-gray-300 rounded-lg p-3 bg-white">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-32 border border-gray-200 rounded cursor-crosshair"
                    style={{ touchAction: 'none' }}
                  />
                </div>

                <div className="flex justify-between mt-3">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="flex items-center px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={saveSignature}
                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </button>
                </div>

                {hasSignature && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    ✓ Signature saved
                  </div>
                )}
              </div>
            </div>

            {/* Approval Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Approval Decision</h3>
              
              <div className="space-y-4">
                {/* Approval Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any additional notes for approval..."
                  />
                </div>

                {/* Rejection Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Remarks (Required if rejecting)
                  </label>
                  <textarea
                    value={rejectionRemarks}
                    onChange={(e) => setRejectionRemarks(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Explain why the report is being rejected..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                                     <button
                     onClick={() => handleApproval('reject')}
                     disabled={saving || !hasSignature}
                     className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     <XCircle className="w-5 h-5 mr-2" />
                     {saving ? 'Processing...' : 'Reject Report'}
                   </button>

                   <button
                     onClick={() => handleApproval('approve')}
                     disabled={saving || !hasSignature}
                     className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     <CheckCircle className="w-5 h-5 mr-2" />
                     {saving ? 'Processing...' : 'Approve Report'}
                   </button>
                </div>

                {!hasSignature && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-700">
                      ⚠️ Please sign the report above before approving or rejecting.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <img 
                src={selectedImage} 
                alt="Full size" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
