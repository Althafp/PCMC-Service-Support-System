import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  MapPin, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  Printer,
  Thermometer,
  Camera,
  Settings,
  Battery,
  Wifi,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface ServiceReport {
  id: string;
  complaint_no: string;
  complaint_type: string;
  project_phase: string;
  system_type: string;
  date: string;
  jb_sl_no?: string;
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
  raw_power_supply_images?: string[];
  ups_input_image_url?: string;
  ups_output_image_url?: string;
  thermistor_image_url?: string;
  thermistor_temperature?: number;
  checklist_data?: any;
  nature_of_complaint?: string;
  field_team_remarks?: string;
  customer_feedback?: string;
  rejection_remarks?: string;
  tl_name?: string;
  tl_signature?: string;
  tl_mobile?: string;
  tech_engineer?: string;
  tech_signature?: string;
  tech_mobile?: string;
  technician_id?: string;
  title?: string;
  approval_status?: string;
  team_leader_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  technician: {
    full_name: string;
    employee_id: string;
    email?: string;
    mobile?: string;
    team_leader_id?: string;
    manager_id?: string;
    teamLeaderName?: string;
    managerName?: string;
  };
}

export function UnifiedReportView() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<ServiceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportId && user) {
      fetchReport();
    }
  }, [reportId, user]);

  const fetchReport = async () => {
    if (!reportId) return;

    try {
      const { data, error } = await supabase
        .from('service_reports')
        .select(`
          *,
          technician:users!service_reports_technician_id_fkey(full_name, employee_id, email, mobile, team_leader_id, manager_id)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;

      // Fetch team leader and manager names separately
      let teamLeaderName = 'Unassigned';
      let managerName = 'Unassigned';

      if (data.technician?.team_leader_id) {
        try {
          const { data: tlData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', data.technician.team_leader_id)
            .single();
          if (tlData) teamLeaderName = tlData.full_name;
        } catch (error) {
          console.warn('Could not fetch team leader name:', error);
        }
      }

      if (data.technician?.manager_id) {
        try {
          const { data: mgrData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', data.technician.manager_id)
            .single();
          if (mgrData) managerName = mgrData.full_name;
        } catch (error) {
          console.warn('Could not fetch manager name:', error);
        }
      }

      // Set report with enhanced technician data
      setReport({
        ...data,
        technician: {
          ...data.technician,
          teamLeaderName,
          managerName
        }
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Error loading report. Please try again.');
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

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups to print the report');
      return;
    }

    // Create the print content with professional PDF-like layout
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Report - ${report.title || report.complaint_no || report.id}</title>
        <style>
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.4;
            color: #000;
            background: white;
            margin: 0;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 28pt;
            font-weight: bold;
            margin: 0;
            color: #000;
            text-transform: uppercase;
          }
          
          .header p {
            font-size: 14pt;
            margin: 5px 0 0 0;
            color: #333;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section h2 {
            font-size: 16pt;
            font-weight: bold;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
            margin-bottom: 15px;
            color: #000;
            text-transform: uppercase;
          }
          
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .field {
            margin-bottom: 12px;
          }
          
          .field label {
            font-weight: bold;
            font-size: 11pt;
            color: #000;
            display: block;
            margin-bottom: 3px;
            text-transform: uppercase;
          }
          
          .field p {
            font-size: 11pt;
            margin: 0;
            padding: 8px 0;
            border-bottom: 1px solid #000;
            color: #000;
            min-height: 20px;
          }
          
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 20px;
          }
          
          .signature-box {
            border: 2px solid #000;
            padding: 20px;
            text-align: center;
            min-height: 120px;
          }
          
          .signature-box h4 {
            font-size: 12pt;
            font-weight: bold;
            margin: 0 0 15px 0;
            color: #000;
            text-transform: uppercase;
          }
          
          .signature-box img {
            max-width: 200px;
            max-height: 80px;
            border: 1px solid #000;
          }
          
          .checklist {
            border: 2px solid #000;
            margin-top: 10px;
          }
          
          .checklist-header {
            background: #f0f0f0;
            padding: 10px;
            font-weight: bold;
            border-bottom: 2px solid #000;
            font-size: 11pt;
            text-transform: uppercase;
          }
          
          .checklist-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 10px;
            border-bottom: 1px solid #000;
            font-size: 10pt;
          }
          
          .checklist-item:last-child {
            border-bottom: none;
          }
          
          .status {
            font-weight: bold;
            padding: 3px 8px;
            border: 1px solid #000;
            font-size: 9pt;
            text-transform: uppercase;
          }
          
          .status-ok {
            background: #d4edda;
            color: #155724;
          }
          
          .status-issue {
            background: #f8d7da;
            color: #721c24;
          }
          
          .status-na {
            background: #e2e3e5;
            color: #383d41;
          }
          
          .images {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
          }
          
          .image {
            border: 2px solid #000;
            padding: 15px;
            text-align: center;
          }
          
          .image h4 {
            font-size: 11pt;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #000;
            text-transform: uppercase;
          }
          
          .image img {
            max-width: 100%;
            max-height: 200px;
            border: 1px solid #000;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10pt;
            color: #666;
            border-top: 2px solid #000;
            padding-top: 15px;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .no-break {
            page-break-inside: avoid;
          }
          
          .full-width {
            grid-column: 1 / -1;
          }
        </style>
      </head>
      <body>
        <!-- Professional Header -->
        <div class="header">
          <h1>Service Report</h1>
          <p>Comprehensive Technical Service Documentation</p>
        </div>

        <!-- Basic Information -->
        <div class="section">
          <h2>Basic Information</h2>
          <div class="grid">
            <div class="field">
              <label>Complaint Number</label>
              <p>${report.complaint_no || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Complaint Type</label>
              <p>${report.complaint_type || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Project Phase</label>
              <p>${report.project_phase || 'N/A'}</p>
            </div>
            <div class="field">
              <label>System Type</label>
              <p>${report.system_type || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Zone</label>
              <p>${report.zone || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Location</label>
              <p>${report.location || 'N/A'}</p>
            </div>
          </div>
        </div>

        <!-- Location Details -->
        <div class="section">
          <h2>Location Details</h2>
          <div class="grid">
            <div class="field">
              <label>Ward No</label>
              <p>${report.ward_no || 'N/A'}</p>
            </div>
            <div class="field">
              <label>PS Limits</label>
              <p>${report.ps_limits || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Pole ID</label>
              <p>${report.pole_id || 'N/A'}</p>
            </div>
            <div class="field">
              <label>RFP No</label>
              <p>${report.rfp_no || 'N/A'}</p>
            </div>
            <div class="field">
              <label>JB SL No</label>
              <p>${report.jb_sl_no || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Coordinates</label>
              <p>${report.latitude && report.longitude ? `${report.latitude}, ${report.longitude}` : 'N/A'}</p>
            </div>
          </div>
        </div>

        ${report.nature_of_complaint ? `
        <!-- Complaint Details -->
        <div class="section">
          <h2>Complaint Details</h2>
          <div class="field full-width">
            <label>Nature of Complaint</label>
            <p>${report.nature_of_complaint}</p>
          </div>
          ${report.field_team_remarks ? `
          <div class="field full-width">
            <label>Field Team Remarks</label>
            <p>${report.field_team_remarks}</p>
          </div>
          ` : ''}
          ${report.customer_feedback ? `
          <div class="field full-width">
            <label>Customer Feedback</label>
            <p>${report.customer_feedback}</p>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <!-- Technical Details -->
        <div class="section">
          <h2>Technical Details</h2>
          <div class="grid">
            <div class="field">
              <label>Technician Engineer</label>
              <p>${report.tech_engineer || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Technician Mobile</label>
              <p>${report.tech_mobile || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Team Leader Name</label>
              <p>${report.tl_name || 'N/A'}</p>
            </div>
            <div class="field">
              <label>Team Leader Mobile</label>
              <p>${report.tl_mobile || 'N/A'}</p>
            </div>
          </div>
        </div>

        <!-- Signatures -->
        <div class="section">
          <h2>Signatures</h2>
          <div class="signatures">
            <div class="signature-box">
              <h4>Technician Signature</h4>
              ${report.tech_signature ? `<img src="${report.tech_signature}" alt="Technician Signature" />` : '<p>No signature</p>'}
            </div>
            <div class="signature-box">
              <h4>Team Leader Signature</h4>
              ${report.tl_signature ? `<img src="${report.tl_signature}" alt="Team Leader Signature" />` : '<p>No signature</p>'}
            </div>
          </div>
        </div>

        <!-- Images -->
        <div class="section">
          <h2>Images</h2>
          <div class="images">
            ${report.before_image_url ? `
            <div class="image">
              <h4>Before Image</h4>
              <img src="${report.before_image_url}" alt="Before" />
            </div>
            ` : ''}
            ${report.after_image_url ? `
            <div class="image">
              <h4>After Image</h4>
              <img src="${report.after_image_url}" alt="After" />
            </div>
            ` : ''}
            ${report.ups_input_image_url ? `
            <div class="image">
              <h4>UPS Input</h4>
              <img src="${report.ups_input_image_url}" alt="UPS Input" />
            </div>
            ` : ''}
            ${report.ups_output_image_url ? `
            <div class="image">
              <h4>UPS Output</h4>
              <img src="${report.ups_output_image_url}" alt="UPS Output" />
            </div>
            ` : ''}
            ${report.thermistor_image_url ? `
            <div class="image">
              <h4>Thermistor</h4>
              <img src="${report.thermistor_image_url}" alt="Thermistor" />
            </div>
            ` : ''}
          </div>
        </div>

        ${report.thermistor_temperature ? `
        <!-- Additional Measurements -->
        <div class="section">
          <h2>Additional Measurements</h2>
          <div class="grid">
            <div class="field">
              <label>Thermistor Temperature</label>
              <p>${report.thermistor_temperature}°C</p>
            </div>
            ${report.jb_temperature ? `
            <div class="field">
              <label>Junction Box Temperature</label>
              <p>${report.jb_temperature}°C</p>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        ${report.checklist_data ? `
        <!-- Equipment Checklist -->
        <div class="section">
          <h2>Equipment Checklist</h2>
          ${Object.entries(report.checklist_data).map(([category, items]) => `
            <div class="checklist">
              <div class="checklist-header">${category}</div>
              ${Object.entries(items).map(([item, status]) => `
                <div class="checklist-item">
                  <span>${item}</span>
                  <span class="status ${status === 'ok' ? 'status-ok' : status === 'issue' ? 'status-issue' : 'status-na'}">${status === 'ok' ? 'OK' : status === 'issue' ? 'Issue' : 'N/A'}</span>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${report.approval_status ? `
        <!-- Approval Information -->
        <div class="section">
          <h2>Approval Information</h2>
          <div class="grid">
            <div class="field">
              <label>Approval Status</label>
              <p>${report.approval_status === 'approve' ? 'Approved' : report.approval_status === 'reject' ? 'Rejected' : 'Pending'}</p>
            </div>
            ${report.rejection_remarks ? `
            <div class="field">
              <label>Rejection Remarks</label>
              <p style="color: red;">${report.rejection_remarks}</p>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Timestamps -->
        <div class="section">
          <h2>Timestamps</h2>
          <div class="grid">
            <div class="field">
              <label>Created At</label>
              <p>${report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}</p>
            </div>
            <div class="field">
              <label>Updated At</label>
              <p>${report.updated_at ? new Date(report.updated_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        <!-- Print Footer -->
        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()} | Service Report System</p>
          <p>This is an official document generated by the automated service reporting system.</p>
        </div>
      </body>
      </html>
    `;

    // Write the content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for images to load, then print
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    };
  };

  const renderChecklistItem = (category: string, item: string, status: string, remarks?: string) => {
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'ok':
          return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'issue':
          return <AlertCircle className="w-4 h-4 text-red-600" />;
        case 'na':
          return <XCircle className="w-4 h-4 text-gray-600" />;
        default:
          return <Clock className="w-4 h-4 text-gray-600" />;
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
          return 'Unknown';
      }
    };

    return (
      <div key={item} className="flex items-center justify-between p-2 border-b border-gray-100">
        <div className="flex-1">
          <div className="flex items-center">
            {getStatusIcon(status)}
            <span className="ml-2 text-sm font-medium text-gray-900">{item}</span>
          </div>
          {remarks && (
            <div className="ml-6 mt-1 text-xs text-gray-600">
              <strong>Remarks:</strong> {remarks}
            </div>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded ${
          status === 'ok' ? 'bg-green-100 text-green-800' :
          status === 'issue' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {getStatusText(status)}
        </span>
      </div>
    );
  };

  const renderImageSection = (title: string, imageUrl?: string, altText?: string) => {
    if (!imageUrl) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
        <img
          src={imageUrl}
          alt={altText || title}
          className="w-full h-48 object-contain border border-gray-300 rounded"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Report Not Found</h3>
        <p className="text-gray-600 mb-4">{error || 'The requested report could not be found.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 print:max-w-none print:space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 print:hidden"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Service Report - {report.title || report.complaint_no || report.id}
              </h1>
              <p className="text-gray-600">Comprehensive report details</p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 print:hidden"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </button>
        </div>

        {/* Status and Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Status:</span>
            {getStatusBadge(report.status, report.approval_status)}
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Date:</span>
            <span className="text-sm font-medium">{new Date(report.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Technician:</span>
            <span className="text-sm font-medium">{report.technician?.full_name || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Basic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Complaint Number</label>
            <p className="mt-1 text-sm text-gray-900">{report.complaint_no || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Complaint Type</label>
            <p className="mt-1 text-sm text-gray-900">{report.complaint_type || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Phase</label>
            <p className="mt-1 text-sm text-gray-900">{report.project_phase || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">System Type</label>
            <p className="mt-1 text-sm text-gray-900">{report.system_type || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Zone</label>
            <p className="mt-1 text-sm text-gray-900">{report.zone || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <p className="mt-1 text-sm text-gray-900">{report.location || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Location Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ward No</label>
            <p className="mt-1 text-sm text-gray-900">{report.ward_no || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">PS Limits</label>
            <p className="mt-1 text-sm text-gray-900">{report.ps_limits || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pole ID</label>
            <p className="mt-1 text-sm text-gray-900">{report.pole_id || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">RFP No</label>
            <p className="mt-1 text-sm text-gray-900">{report.rfp_no || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">JB SL No</label>
            <p className="mt-1 text-sm text-gray-900">{report.jb_sl_no || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Coordinates</label>
            <p className="mt-1 text-sm text-gray-900">
              {report.latitude && report.longitude 
                ? `${report.latitude}, ${report.longitude}` 
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Complaint Details */}
      {report.nature_of_complaint && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            Complaint Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nature of Complaint</label>
              <p className="mt-1 text-sm text-gray-900">{report.nature_of_complaint}</p>
            </div>
            {report.field_team_remarks && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Field Team Remarks</label>
                <p className="mt-1 text-sm text-gray-900">{report.field_team_remarks}</p>
              </div>
            )}
            {report.customer_feedback && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Feedback</label>
                <p className="mt-1 text-sm text-gray-900">{report.customer_feedback}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-600" />
          Technical Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Technician Engineer</label>
            <p className="mt-1 text-sm text-gray-900">{report.tech_engineer || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Technician Mobile</label>
            <p className="mt-1 text-sm text-gray-900">{report.tech_mobile || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Leader Name</label>
            <p className="mt-1 text-sm text-gray-900">{report.tl_name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Leader Mobile</label>
            <p className="mt-1 text-sm text-gray-900">{report.tl_mobile || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Signatures
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technician Signature */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Technician Signature</h4>
            {report.tech_signature ? (
              <img
                src={report.tech_signature}
                alt="Technician Signature"
                className="w-full h-32 object-contain border border-gray-300 rounded"
              />
            ) : (
              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                No signature
              </div>
            )}
          </div>

          {/* Team Leader Signature */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Team Leader Signature</h4>
            {report.tl_signature ? (
              <img
                src={report.tl_signature}
                alt="Team Leader Signature"
                className="w-full h-32 object-contain border border-gray-300 rounded"
              />
            ) : (
              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                No signature
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Camera className="w-5 h-5 mr-2 text-blue-600" />
          Images
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderImageSection('Before Image', report.before_image_url, 'Before')}
          {renderImageSection('After Image', report.after_image_url, 'After')}
          {renderImageSection('UPS Input', report.ups_input_image_url, 'UPS Input')}
          {renderImageSection('UPS Output', report.ups_output_image_url, 'UPS Output')}
          {renderImageSection('Thermistor', report.thermistor_image_url, 'Thermistor')}
        </div>
      </div>

      {/* Additional Measurements */}
      {report.thermistor_temperature && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Thermometer className="w-5 h-5 mr-2 text-blue-600" />
            Additional Measurements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Thermistor Temperature</label>
              <p className="mt-1 text-sm text-gray-900">{report.thermistor_temperature}°C</p>
            </div>
            {report.jb_temperature && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Junction Box Temperature</label>
                <p className="mt-1 text-sm text-gray-900">{report.jb_temperature}°C</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Equipment Checklist */}
      {report.checklist_data && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-blue-600" />
            Equipment Checklist
          </h2>
          <div className="space-y-4">
            {Object.entries(report.checklist_data).map(([category, items]) => (
              <div key={category} className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">{category}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {Object.entries(items as any).map(([item, status]) => 
                    renderChecklistItem(category, item, status as string)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval Information */}
      {report.approval_status && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
            Approval Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Approval Status</label>
              <div className="mt-1">{getStatusBadge(report.status, report.approval_status)}</div>
            </div>
            {report.rejection_remarks && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Rejection Remarks</label>
                <p className="mt-1 text-sm text-red-600">{report.rejection_remarks}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hierarchy Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          Team Hierarchy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Technician</label>
            <p className="mt-1 text-sm text-gray-900">{report.technician?.full_name || 'N/A'}</p>
            <p className="text-xs text-gray-500">{report.technician?.employee_id || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Leader</label>
            <p className="mt-1 text-sm text-gray-900">{report.technician?.teamLeaderName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Manager</label>
            <p className="mt-1 text-sm text-gray-900">{report.technician?.managerName || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Timestamps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Created At</label>
            <p className="mt-1 text-sm text-gray-900">
              {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Updated At</label>
            <p className="mt-1 text-sm text-gray-900">
              {report.updated_at ? new Date(report.updated_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:max-w-none {
            max-width: none !important;
          }
          .print\\:space-y-4 > * + * {
            margin-top: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
