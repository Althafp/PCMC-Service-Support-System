import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Clock,
  MapPin,
  ThermometerSun,
  Camera
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { generateReportPDF } from '../utils/pdfGenerator';

export function UnifiedReportView() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('service_reports')
        .select(`
          *,
          technician:users!service_reports_technician_id_fkey(full_name, employee_id, mobile),
          team_leader:users!service_reports_team_leader_id_fkey(full_name, mobile)
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

  const handleDownloadPDF = async () => {
    if (!report) return;
    
    try {
      console.log('📄 Generating PDF for report:', report.complaint_no);
      
      // Fetch project logo if project_id exists
      let projectLogoBase64 = undefined;
      if (report.project_id) {
        try {
          const { data: projectData } = await supabase
            .from('projects')
            .select('logo_url')
            .eq('id', report.project_id)
            .single();

          if (projectData?.logo_url) {
            console.log('Fetching project logo:', projectData.logo_url);
            
            // Convert image URL to base64
            const response = await fetch(projectData.logo_url);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            
            projectLogoBase64 = base64;
            console.log('✅ Logo loaded successfully');
          }
        } catch (logoError) {
          console.warn('Could not load project logo:', logoError);
          // Continue without logo
        }
      }
      
      await generateReportPDF(report, projectLogoBase64);
      console.log('✅ PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const getStatusBadge = () => {
    if (!report) return null;

    if (report.approval_status === 'approve') {
      return (
        <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
          <CheckCircle className="w-5 h-5 mr-2" />
          Approved
        </div>
      );
    } else if (report.approval_status === 'reject') {
      return (
        <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full">
          <XCircle className="w-5 h-5 mr-2" />
          Rejected
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
          <Clock className="w-5 h-5 mr-2" />
          Pending Review
        </div>
      );
    }
  };

  const renderEquipmentChecklist = () => {
    if (!report?.checklist_data) return null;

    const sections = Object.keys(report.checklist_data);
    const remarks = report.equipment_remarks || {};

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'ok':
          return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">OK</span>;
        case 'issue':
          return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">ISSUE</span>;
        case 'na':
          return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">N/A</span>;
        default:
          return null;
      }
    };

    return (
      <div className="space-y-4">
        {sections.map((section) => {
          const items = report.checklist_data[section];
          const itemKeys = Object.keys(items);

          return (
            <div key={section} className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                📁 {section}
              </h3>
              <div className="border-t border-gray-300 pt-3 space-y-3">
                {itemKeys.map((item) => {
                  const status = items[item];
                  const remarkKey = `${section}-${item}`;
                  const valueKey = `${section}-${item}-value`;
                  const remark = remarks[remarkKey];
                  const value = remarks[valueKey];
                  const icon = status === 'ok' ? '✓' : status === 'issue' ? '⚠' : '⊖';

                  return (
                    <div key={item} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 flex items-center">
                          <span className="mr-2">{icon}</span>
                          {item}
                        </span>
                        {getStatusBadge(status)}
                      </div>

                      {/* Show value if exists (UPS/Battery) */}
                      {value && (
                        <div className="ml-6 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <span className="font-medium text-blue-900">ℹ️ Value:</span>
                          <span className="text-blue-700 ml-2">{value}</span>
                        </div>
                      )}

                      {/* Show remark if issue */}
                      {status === 'issue' && remark && (
                        <div className="ml-6 px-3 py-2 bg-orange-50 border border-orange-200 rounded text-sm">
                          <span className="font-medium text-orange-900">💬 Remark:</span>
                          <span className="text-orange-700 ml-2">{remark}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Camera Special Info */}
        {(remarks.camera_count || remarks.camera_remarks) && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">📹 Camera Information</h3>
            <div className="space-y-2 text-sm">
              {remarks.camera_count && (
                <div className="flex items-center">
                  <span className="font-medium text-purple-900">• Number of Cameras:</span>
                  <span className="text-purple-700 ml-2">{remarks.camera_count}</span>
                </div>
              )}
              {remarks.camera_remarks && (
                <div className="flex items-start">
                  <span className="font-medium text-purple-900">• Camera Remarks:</span>
                  <span className="text-purple-700 ml-2">{remarks.camera_remarks}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Equipment Values Summary */}
        {Object.keys(remarks).some(key => key.endsWith('-value')) && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 Equipment Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.keys(remarks)
                .filter(key => key.endsWith('-value'))
                .map(key => {
                  const label = key.replace('-value', '').split('-').pop();
                  return (
                    <div key={key} className="flex items-center justify-between px-3 py-2 bg-white rounded border border-blue-300">
                      <span className="font-medium text-blue-900">• {label}:</span>
                      <span className="text-blue-700">{remarks[key]}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Equipment Remarks Summary */}
        {Object.keys(remarks).some(key => !key.endsWith('-value') && key !== 'camera_count' && key !== 'camera_remarks') && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">⚠️ Equipment Remarks</h3>
            <div className="space-y-2 text-sm">
              {Object.keys(remarks)
                .filter(key => !key.endsWith('-value') && key !== 'camera_count' && key !== 'camera_remarks')
                .map(key => {
                  const label = key.split('-').pop();
                  return (
                    <div key={key} className="flex items-start px-3 py-2 bg-white rounded border border-orange-300">
                      <span className="font-medium text-orange-900">• {label}:</span>
                      <span className="text-orange-700 ml-2">{remarks[key]}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h2>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Report - {report.complaint_no}
        </h1>
        <div className="flex space-x-2">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Download PDF"
          >
            <Download className="w-5 h-5 mr-1" />
            <span className="text-sm">Download</span>
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg" title="Share">
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => window.print()}
            className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
            title="Print"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          <div className="text-right">
            <p className="text-sm text-gray-600">Report</p>
            <p className="text-xl font-bold text-gray-900">{report.complaint_no}</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Basic Information */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">BASIC INFORMATION</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Complaint Number" value={report.complaint_no} />
          <InfoRow label="Complaint Type" value={report.complaint_type} />
          <InfoRow label="Project Phase" value={report.project_phase} />
          <InfoRow label="System Type" value={report.system_type} />
          <InfoRow label="Date" value={report.date ? format(new Date(report.date), 'dd/MM/yyyy') : 'N/A'} />
          <InfoRow label="Zone" value={report.zone} />
          <InfoRow label="Location" value={report.location} />
          <InfoRow label="JB SL Number" value={report.jb_sl_no} />
          <InfoRow label="Ward Number" value={report.ward_no} />
          <InfoRow label="PS Limits" value={report.ps_limits} />
          <InfoRow label="Pole ID" value={report.pole_id} />
          <InfoRow label="RFP Number" value={report.rfp_no} />
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Location Coordinates (Database):</h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Latitude" value={report.location_latitude || 'N/A'} icon={<MapPin className="w-4 h-4" />} />
            <InfoRow label="Longitude" value={report.location_longitude || 'N/A'} icon={<MapPin className="w-4 h-4" />} />
          </div>
        </div>
      </div>

      {/* SECTION 2: Device Location (GPS) */}
      <div className="bg-blue-50 rounded-lg shadow-sm p-6 border-2 border-blue-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
          <MapPin className="w-6 h-6 mr-2" />
          DEVICE LOCATION (GPS)
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Device Latitude (GPS)" value={report.latitude || 'N/A'} highlight />
          <InfoRow label="Device Longitude (GPS)" value={report.longitude || 'N/A'} highlight />
        </div>
        <p className="text-xs text-blue-700 mt-2">
          ℹ️ These GPS coordinates are watermarked on all images
        </p>
      </div>

      {/* SECTION 3: Technical Details */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">TECHNICAL DETAILS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Technician" value={report.technician?.full_name || report.tech_engineer || 'N/A'} />
          <InfoRow label="Mobile" value={report.technician?.mobile || report.tech_mobile || 'N/A'} />
          <InfoRow 
            label="JB Temperature" 
            value={report.jb_temperature ? `${report.jb_temperature}°C` : 'N/A'} 
            icon={<ThermometerSun className="w-4 h-4" />}
          />
          <InfoRow 
            label="Thermistor Temperature" 
            value={report.thermistor_temperature ? `${report.thermistor_temperature}°C` : 'N/A'}
            icon={<ThermometerSun className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* SECTION 4: Images */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center">
          <Camera className="w-6 h-6 mr-2" />
          IMAGES
        </h2>
        
        <div className="space-y-6">
          {/* Before/After Images */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Before & After</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.before_image_url && (
                <ImageCard 
                  url={report.before_image_url} 
                  label="Before Image"
                  hasGPS={true}
                />
              )}
              {report.after_image_url && (
                <ImageCard 
                  url={report.after_image_url} 
                  label="After Image"
                  hasGPS={true}
                />
              )}
            </div>
          </div>

          {/* UPS Images */}
          {(report.ups_input_image_url || report.ups_output_image_url) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">UPS Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.ups_input_image_url && (
                  <ImageCard url={report.ups_input_image_url} label="UPS Input" hasGPS={true} />
                )}
                {report.ups_output_image_url && (
                  <ImageCard url={report.ups_output_image_url} label="UPS Output" hasGPS={true} />
                )}
              </div>
            </div>
          )}

          {/* Thermistor Image */}
          {report.thermistor_image_url && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Thermistor</h3>
              <div className="md:w-1/2">
                <ImageCard url={report.thermistor_image_url} label="Thermistor Image" hasGPS={true} />
              </div>
            </div>
          )}

          {/* Raw Power Supply Images */}
          {report.raw_power_supply_images && report.raw_power_supply_images.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Raw Power Supply Images ({report.raw_power_supply_images.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {report.raw_power_supply_images.map((url: string, index: number) => (
                  <ImageCard 
                    key={index} 
                    url={url} 
                    label={`Raw Power ${index + 1}`}
                    hasGPS={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: Equipment Checklist */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">EQUIPMENT CHECKLIST</h2>
        {renderEquipmentChecklist()}
      </div>

      {/* SECTION 6: Complaints & Remarks */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">COMPLAINTS & REMARKS</h2>
        <div className="space-y-4">
          {report.nature_of_complaint && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nature of Complaint:</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">{report.nature_of_complaint}</p>
            </div>
          )}
          {report.field_team_remarks && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Field Team Remarks:</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">{report.field_team_remarks}</p>
            </div>
          )}
          {report.customer_feedback && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Feedback:</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">{report.customer_feedback}</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 7: Signatures */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">SIGNATURES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technician Signature */}
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Technician</h3>
            {report.tech_signature ? (
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                <img 
                  src={report.tech_signature} 
                  alt="Technician Signature" 
                  className="w-full h-32 object-contain"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 h-32 flex items-center justify-center">
                <p className="text-gray-400">No signature</p>
              </div>
            )}
            <p className="font-bold text-gray-900 mt-3">{report.tech_engineer || 'N/A'}</p>
            <p className="text-sm text-gray-600">{report.tech_mobile || 'N/A'}</p>
          </div>

          {/* Team Leader Signature */}
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Team Leader</h3>
            {report.tl_signature ? (
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                <img 
                  src={report.tl_signature} 
                  alt="Team Leader Signature" 
                  className="w-full h-32 object-contain"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 h-32 flex items-center justify-center">
                <p className="text-gray-400">Pending approval</p>
              </div>
            )}
            <p className="font-bold text-gray-900 mt-3">{report.tl_name || 'Pending'}</p>
            <p className="text-sm text-gray-600">{report.tl_mobile || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* SECTION 8: Approval Details */}
      {(report.approval_status === 'approve' || report.approval_status === 'reject') && (
        <div className={`rounded-lg shadow-sm p-6 border-2 ${
          report.approval_status === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center">
            {report.approval_status === 'approve' ? (
              <><CheckCircle className="w-6 h-6 mr-2 text-green-600" /> APPROVAL DETAILS</>
            ) : (
              <><XCircle className="w-6 h-6 mr-2 text-red-600" /> REJECTION DETAILS</>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Approval Status" value={report.approval_status === 'approve' ? 'Approved' : 'Rejected'} />
            {report.approval_notes && (
              <InfoRow label="Approval Notes" value={report.approval_notes} />
            )}
            {report.rejection_remarks && (
              <InfoRow label="Rejection Remarks" value={report.rejection_remarks} />
            )}
            {report.approved_at && (
              <InfoRow 
                label="Approved At" 
                value={format(new Date(report.approved_at), 'dd/MM/yyyy HH:mm')} 
              />
            )}
            {report.team_leader?.full_name && (
              <InfoRow label="Approved By" value={report.team_leader.full_name} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
const InfoRow = ({ label, value, icon, highlight }: { 
  label: string; 
  value: string | number; 
  icon?: React.ReactNode;
  highlight?: boolean;
}) => (
  <div className={`flex items-start justify-between ${highlight ? 'bg-blue-50 p-3 rounded' : ''}`}>
    <span className="text-sm font-medium text-gray-700 flex items-center">
      {icon && <span className="mr-2">{icon}</span>}
      {label}:
    </span>
    <span className={`text-sm ${highlight ? 'font-semibold text-blue-900' : 'text-gray-900'} text-right ml-4`}>
      {value || 'N/A'}
    </span>
  </div>
);

const ImageCard = ({ url, label, hasGPS }: { url: string; label: string; hasGPS?: boolean }) => (
  <div className="relative group">
    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
      <img 
        src={url} 
        alt={label}
        className="w-full h-48 object-cover hover:scale-105 transition-transform cursor-pointer"
        onClick={() => window.open(url, '_blank')}
      />
    </div>
    <p className="text-center text-sm font-medium text-gray-700 mt-2">{label}</p>
    {hasGPS && (
      <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center">
        <MapPin className="w-3 h-3 mr-1" />
        GPS
      </div>
    )}
  </div>
);
