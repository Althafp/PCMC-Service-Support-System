import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin, User, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ServiceReport {
  id: string;
  complaint_no: string;
  complaint_type: string;
  project_phase: string;
  system_type: string;
  date: string;
  location: string;
  zone: string;
  status: string;
  approval_status: string;
  rejection_remarks: string;
  jb_temperature: number;
  equipment_remarks: string;
  approval_notes: string;
  approved_at: string;
  approved_by: string;
  created_at: string;
  updated_at: string;
  nature_of_complaint: string;
  field_team_remarks: string;
  customer_feedback: string;
  tech_engineer: string;
  tech_mobile: string;
  tl_name: string;
  tl_mobile: string;
  tech_signature: string;
  tl_signature: string;
  before_image_url: string;
  after_image_url: string;
  ups_input_image_url: string;
  ups_output_image_url: string;
  thermistor_image_url: string;
  thermistor_temperature: number;
  raw_power_supply_images: string;
  checklist_data: any;
  technician: {
    full_name: string;
    employee_id: string;
    email: string;
    mobile: string;
    team_leader_id?: string;
    manager_id?: string;
    team_leader?: {
      full_name: string;
      employee_id: string;
      email: string;
    };
    manager?: {
      full_name: string;
      employee_id: string;
      email: string;
    };
    teamLeaderName?: string;
    managerName?: string;
  };
}

export function ManagerReportView() {
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
            .select('full_name, employee_id, email')
            .eq('id', data.technician.team_leader_id)
            .single();
          if (tlData) {
            teamLeaderName = tlData.full_name;
            data.technician.team_leader = tlData;
          }
        } catch (error) {
          console.warn('Could not fetch team leader name:', error);
        }
      }

      if (data.technician?.manager_id) {
        try {
          const { data: mgrData } = await supabase
            .from('users')
            .select('full_name, employee_id, email')
            .eq('id', data.technician.manager_id)
            .single();
          if (mgrData) {
            managerName = mgrData.full_name;
            data.technician.manager = mgrData;
          }
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
      setError('Failed to fetch report details');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">Loading report details...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Report not found'}</div>
          <button
            onClick={() => navigate('/manager/reports')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Reports Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/manager/reports')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Reports Overview
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
          <div></div>
        </div>

        {/* Report Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h2 className="text-xl font-semibold">Complaint #{(typeof report.complaint_no === 'string' ? report.complaint_no : 'N/A')}</h2>
                <p className="text-blue-100">{(typeof report.complaint_type === 'string' ? report.complaint_type : 'N/A')} - {(typeof report.system_type === 'string' ? report.system_type : 'N/A')}</p>
              </div>
              <div className="text-right text-white">
                <div className="text-sm text-blue-100">Status</div>
                <div className="text-lg font-semibold">{(typeof report.status === 'string' ? report.status : 'N/A')}</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Report Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project Phase:</span>
                    <span className="font-medium">{(typeof report.project_phase === 'string' ? report.project_phase : 'N/A')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">System Type:</span>
                    <span className="font-medium">{(typeof report.system_type === 'string' ? report.system_type : 'N/A')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Location Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{(typeof report.location === 'string' ? report.location : 'N/A')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zone:</span>
                    <span className="font-medium">{(typeof report.zone === 'string' ? report.zone : 'N/A')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">JB Temperature:</span>
                    <span className="font-medium">{report.jb_temperature ? `${report.jb_temperature}°C` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Hierarchy */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Team Hierarchy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Technician */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Technician</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-600">Name:</span> {(typeof report.technician?.full_name === 'string' ? report.technician.full_name : 'N/A')}</div>
                    <div><span className="text-gray-600">ID:</span> {(typeof report.technician?.employee_id === 'string' ? report.technician.employee_id : 'N/A')}</div>
                    <div><span className="text-gray-600">Email:</span> {(typeof report.technician?.email === 'string' ? report.technician.email : 'N/A')}</div>
                    <div><span className="text-gray-600">Mobile:</span> {(typeof report.technician?.mobile === 'string' ? report.technician.mobile : 'N/A')}</div>
                  </div>
                </div>

                {/* Team Leader */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Team Leader</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-600">Name:</span> {(typeof report.technician?.team_leader?.full_name === 'string' ? report.technician.team_leader.full_name : 'Unassigned')}</div>
                    <div><span className="text-gray-600">ID:</span> {(typeof report.technician?.team_leader?.employee_id === 'string' ? report.technician.team_leader.employee_id : 'N/A')}</div>
                    <div><span className="text-gray-600">Email:</span> {(typeof report.technician?.team_leader?.email === 'string' ? report.technician.team_leader.email : 'N/A')}</div>
                  </div>
                </div>

                {/* Manager */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Manager</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-600">Name:</span> {(typeof report.technician?.manager?.full_name === 'string' ? report.technician.manager.full_name : 'Unassigned')}</div>
                    <div><span className="text-gray-600">ID:</span> {(typeof report.technician?.manager?.employee_id === 'string' ? report.technician.manager.employee_id : 'N/A')}</div>
                    <div><span className="text-gray-600">Email:</span> {(typeof report.technician?.manager?.email === 'string' ? report.technician.manager.email : 'N/A')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                Approval Status
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">Status:</span>
                  {getStatusBadge(report.approval_status || 'pending')}
                </div>
                {report.approval_notes && typeof report.approval_notes === 'string' && (
                  <div className="mb-3">
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-gray-900 mt-1">{report.approval_notes}</p>
                  </div>
                )}
                {report.rejection_remarks && typeof report.rejection_remarks === 'string' && (
                  <div className="mb-3">
                    <span className="text-gray-600">Rejection Remarks:</span>
                    <p className="text-red-700 mt-1">{report.rejection_remarks}</p>
                  </div>
                )}
                {report.approved_at && (
                  <div className="mb-3">
                    <span className="text-gray-600">Approved At:</span>
                    <p className="text-gray-900 mt-1">{report.approved_at ? new Date(report.approved_at).toLocaleString() : 'N/A'}</p>
                  </div>
                )}
                {report.approved_by && typeof report.approved_by === 'string' && (
                  <div>
                    <span className="text-gray-600">Approved By:</span>
                    <p className="text-gray-900 mt-1">{report.approved_by}</p>
                  </div>
                )}
              </div>
            </div>

                         {/* Equipment Remarks */}
             {report.equipment_remarks && typeof report.equipment_remarks === 'string' && (
               <div>
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Remarks</h3>
                 <div className="bg-gray-50 rounded-lg p-4">
                   <p className="text-gray-900">{report.equipment_remarks}</p>
                 </div>
               </div>
             )}

             {/* Complaint Details */}
             <div>
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                 <FileText className="w-5 h-5 mr-2 text-blue-600" />
                 Complaint Details
               </h3>
               <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                 <div className="flex justify-between">
                   <span className="text-gray-600">Nature of Complaint:</span>
                   <span className="font-medium">{(typeof report.nature_of_complaint === 'string' ? report.nature_of_complaint : 'N/A')}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Field Team Remarks:</span>
                   <span className="font-medium">{(typeof report.field_team_remarks === 'string' ? report.field_team_remarks : 'N/A')}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Customer Feedback:</span>
                   <span className="font-medium">{(typeof report.customer_feedback === 'string' ? report.customer_feedback : 'N/A')}</span>
                 </div>
               </div>
             </div>

             {/* Technical Details */}
             <div>
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                 <User className="w-5 h-5 mr-2 text-blue-600" />
                 Technical Details
               </h3>
               <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                 <div className="flex justify-between">
                   <span className="text-gray-600">Tech Engineer:</span>
                   <span className="font-medium">{(typeof report.tech_engineer === 'string' ? report.tech_engineer : 'N/A')}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Tech Mobile:</span>
                   <span className="font-medium">{(typeof report.tech_mobile === 'string' ? report.tech_mobile : 'N/A')}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Team Leader Name:</span>
                   <span className="font-medium">{(typeof report.tl_name === 'string' ? report.tl_name : 'N/A')}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Team Leader Mobile:</span>
                   <span className="font-medium">{(typeof report.tl_mobile === 'string' ? report.tl_mobile : 'N/A')}</span>
                 </div>
               </div>
             </div>

             {/* Signatures */}
             <div>
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                 <FileText className="w-5 h-5 mr-2 text-blue-600" />
                 Signatures
               </h3>
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
             <div>
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                 <FileText className="w-5 h-5 mr-2 text-blue-600" />
                 Images
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {/* Before Image */}
                 {report.before_image_url && (
                   <div className="bg-gray-50 rounded-lg p-4">
                     <h4 className="font-medium text-gray-900 mb-2">Before Image</h4>
                     <img 
                       src={report.before_image_url} 
                       alt="Before" 
                       className="w-full h-32 object-cover rounded border border-gray-300"
                     />
                   </div>
                 )}

                 {/* After Image */}
                 {report.after_image_url && (
                   <div className="bg-gray-50 rounded-lg p-4">
                     <h4 className="font-medium text-gray-900 mb-2">After Image</h4>
                     <img 
                       src={report.after_image_url} 
                       alt="After" 
                       className="w-full h-32 object-cover rounded border border-gray-300"
                     />
                   </div>
                 )}

                 {/* UPS Input Image */}
                 {report.ups_input_image_url && (
                   <div className="bg-gray-50 rounded-lg p-4">
                     <h4 className="font-medium text-gray-900 mb-2">UPS Input</h4>
                     <img 
                       src={report.ups_input_image_url} 
                       alt="UPS Input" 
                       className="w-full h-32 object-cover rounded border border-gray-300"
                     />
                   </div>
                 )}

                 {/* UPS Output Image */}
                 {report.ups_output_image_url && (
                   <div className="bg-gray-50 rounded-lg p-4">
                     <h4 className="font-medium text-gray-900 mb-2">UPS Output</h4>
                     <img 
                       src={report.ups_output_image_url} 
                       alt="UPS Output" 
                       className="w-full h-32 object-cover rounded border border-gray-300"
                     />
                   </div>
                 )}

                 {/* Thermistor Image */}
                 {report.thermistor_image_url && (
                   <div className="bg-gray-50 rounded-lg p-4">
                     <h4 className="font-medium text-gray-900 mb-2">Thermistor</h4>
                     <img 
                       src={report.thermistor_image_url} 
                       alt="Thermistor" 
                       className="w-full h-32 object-cover rounded border border-gray-300"
                     />
                   </div>
                 )}

                 {/* Raw Power Supply Images */}
                 {report.raw_power_supply_images && (
                   <div className="bg-gray-50 rounded-lg p-4">
                     <h4 className="font-medium text-gray-900 mb-2">Raw Power Supply</h4>
                     <img 
                       src={report.raw_power_supply_images} 
                       alt="Raw Power Supply" 
                       className="w-full h-32 object-cover rounded border border-gray-300"
                     />
                   </div>
                 )}
               </div>
             </div>

             {/* Additional Measurements */}
             <div>
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                 <FileText className="w-5 h-5 mr-2 text-blue-600" />
                 Additional Measurements
               </h3>
               <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                 <div className="flex justify-between">
                   <span className="text-gray-600">Thermistor Temperature:</span>
                   <span className="font-medium">{report.thermistor_temperature ? `${report.thermistor_temperature}°C` : 'N/A'}</span>
                 </div>
               </div>
             </div>

             {/* Checklist Data */}
             {report.checklist_data && (
               <div>
                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                   <FileText className="w-5 h-5 mr-2 text-blue-600" />
                   Equipment Checklist
                 </h3>
                 <div className="bg-gray-50 rounded-lg p-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {Object.entries(report.checklist_data).map(([key, value]: [string, any]) => (
                       <div key={key} className="border border-gray-200 rounded-lg p-3">
                         <h4 className="font-medium text-gray-900 mb-2">{key}</h4>
                         <div className="space-y-2">
                           <div className="flex items-center">
                             <span className="text-gray-600 mr-2">Status:</span>
                             <span className={`px-2 py-1 text-xs rounded-full ${
                               value.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                             }`}>
                               {value.status || 'N/A'}
                             </span>
                           </div>
                           {value.remarks && (
                             <div>
                               <span className="text-gray-600 text-sm">Remarks:</span>
                               <p className="text-gray-900 text-sm mt-1">{value.remarks}</p>
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   );
 }
