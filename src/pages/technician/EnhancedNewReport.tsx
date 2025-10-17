import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Save, Send, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BasicInformation } from '../../components/Forms/BasicInformation';
import { LocationDetails } from '../../components/Forms/LocationDetails';
import { ImageUpload } from '../../components/Forms/ImageUpload';
import { EquipmentChecklist } from '../../components/Forms/EquipmentChecklist';
import { ReportContent } from '../../components/Forms/ReportContent';
import { TechnicianSignature } from '../../components/Forms/TechnicianSignature';

const steps = [
  { id: 1, name: 'Basic Information', component: BasicInformation, required: ['complaint_no', 'rfp_no', 'complaint_type', 'system_type', 'date', 'latitude', 'longitude'] },
  { id: 2, name: 'Location Details', component: LocationDetails, required: ['project_phase', 'zone', 'location'] },
  { id: 3, name: 'Image Upload', component: ImageUpload, required: ['before_image_url', 'after_image_url'] },
  { id: 4, name: 'Equipment Checklist', component: EquipmentChecklist, required: ['jb_temperature', 'checklist_data', 'equipment_remarks'] },
  { id: 5, name: 'Report Content', component: ReportContent, required: ['nature_of_complaint', 'field_team_remarks'] },
  { id: 6, name: 'Technician Signature', component: TechnicianSignature, required: ['tech_signature', 'tech_engineer', 'tech_mobile'] },
];

interface ValidationError {
  field: string;
  message: string;
}

export function EnhancedNewReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [existingDraftId, setExistingDraftId] = useState<string | null>(null);
  const [isDraftMode, setIsDraftMode] = useState(false);
  
  // Form access check
  const [formAccessLoading, setFormAccessLoading] = useState(true);
  const [hasFormAccess, setHasFormAccess] = useState(false);
  const [formAccessMessage, setFormAccessMessage] = useState('');

  // Check if user has access to service report form
  useEffect(() => {
    const checkFormAccess = async () => {
      if (!user) {
        setFormAccessLoading(false);
        return;
      }

      try {
        console.log('Checking form access for user:', user.id);
        console.log('User department:', (user as any).department_id);

        // Get user's department
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('department_id, department')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user department:', userError);
          setFormAccessMessage('Error checking form access. Please contact admin.');
          setHasFormAccess(false);
          setFormAccessLoading(false);
          return;
        }

        const departmentId = userData.department_id;
        const departmentName = userData.department;

        console.log('User department ID:', departmentId);
        console.log('User department name:', departmentName);

        if (!departmentId) {
          setFormAccessMessage('You are not assigned to any department. Please contact admin.');
          setHasFormAccess(false);
          setFormAccessLoading(false);
          return;
        }

        // Step 1: Get service_report form ID
        const { data: formData, error: formError } = await supabase
          .from('forms')
          .select('id')
          .eq('name', 'service_report')
          .eq('is_active', true)
          .single();

        if (formError || !formData) {
          console.error('Error fetching form:', formError);
          setFormAccessMessage('Service Report form not found in system. Please contact admin.');
          setHasFormAccess(false);
          setFormAccessLoading(false);
          return;
        }

        const serviceReportFormId = formData.id;
        console.log('Service Report form ID:', serviceReportFormId);

        // Step 2: Check if this form is enabled for technician's department
        const { data: formAccess, error: accessError } = await supabase
          .from('department_forms')
          .select('is_enabled, form_id, department_id')
          .eq('department_id', departmentId)
          .eq('form_id', serviceReportFormId)
          .maybeSingle();

        console.log('Form access data:', formAccess);

        if (accessError) {
          console.error('Error checking form access:', accessError);
          setFormAccessMessage('Error checking form access. Please contact admin.');
          setHasFormAccess(false);
          setFormAccessLoading(false);
          return;
        }

        // If no record found, form not assigned to department
        if (!formAccess) {
          setFormAccessMessage(`Service Report form is not available for ${departmentName || 'your'} department. Please contact admin.`);
          setHasFormAccess(false);
          setFormAccessLoading(false);
          return;
        }

        // If record exists but disabled
        if (!formAccess.is_enabled) {
          setFormAccessMessage(`Service Report form is currently disabled for ${departmentName || 'your'} department. Please contact your manager or admin.`);
          setHasFormAccess(false);
          setFormAccessLoading(false);
          return;
        }

        // Form access granted
        console.log('✅ Form access granted');
        setHasFormAccess(true);
        setFormAccessLoading(false);
      } catch (error) {
        console.error('Unexpected error checking form access:', error);
        setFormAccessMessage('Unexpected error. Please contact admin.');
        setHasFormAccess(false);
        setFormAccessLoading(false);
      }
    };

    checkFormAccess();
  }, [user]);

  // Load draft/clone data on component mount
  useEffect(() => {
    const draftData = location.state?.draftData;
    const cloneData = location.state?.cloneData;
    
    if (draftData) {
      // Continuing an existing draft
      console.log('Loading draft data:', draftData.complaint_no);
      setFormData(draftData);
      setExistingDraftId(draftData.id);
      setIsDraftMode(true);
      setCompletedSteps([1, 2, 3, 4, 5, 6]);
    } else if (cloneData) {
      // Cloning an existing report
      console.log('Loading clone data:', cloneData.complaint_no);
      setFormData(cloneData);
      setCompletedSteps([1, 2, 3, 4, 5, 6]);
    }
    // For new reports, let BasicInformation component generate the complaint number
  }, [location.state]);

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const currentStepConfig = steps.find(step => step.id === currentStep);
    if (!currentStepConfig) return true;

    const errors: ValidationError[] = [];
    
    // Get today's date as fallback
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🔍 Validating required fields:', currentStepConfig.required);
    console.log('📊 Current formData:', formData);
    
    for (const field of currentStepConfig.required) {
      let value = formData[field as keyof typeof formData];
      
      console.log(`  Checking ${field}:`, value);
      
      // Special handling for auto-filled fields
      if (field === 'date' && (!value || value === '')) {
        console.log(`  → Using today's date as fallback`);
        value = today; // Use today's date as fallback
      }
      
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        console.log(`  ❌ ${field} is invalid:`, value);
        errors.push({
          field,
          message: `${field.replace('_', ' ').toUpperCase()} is required`
        });
      } else {
        console.log(`  ✅ ${field} is valid`);
      }
      
      // Special validation for specific fields
      if (field === 'complaint_no' && value) {
        if (typeof value === 'string' && value.length < 3) {
          errors.push({
            field,
            message: 'Complaint number must be at least 3 characters'
          });
        }
      }
      
      if (field === 'latitude' && value) {
        const lat = parseFloat(value as string);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          errors.push({
            field,
            message: 'Invalid latitude value'
          });
        }
      }
      
      if (field === 'longitude' && value) {
        const lng = parseFloat(value as string);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          errors.push({
            field,
            message: 'Invalid longitude value'
          });
        }
      }
      
      if (field === 'tech_mobile' && value) {
        const mobile = value as string;
        if (mobile && !/^\d{10}$/.test(mobile.replace(/\D/g, ''))) {
          errors.push({
            field,
            message: 'Mobile number must be 10 digits'
          });
        }
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Check if step is completed
  const isStepCompleted = (stepId: number): boolean => {
    return completedSteps.includes(stepId);
  };

  // Mark step as completed
  const markStepCompleted = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const handleNext = () => {
    console.log('⏭️ Next button clicked, current formData:', formData);
    
    // Delay to ensure state updates from child components have propagated
    setTimeout(() => {
      console.log('🔍 Validating step', currentStep);
      console.log('📊 FormData at validation time:', formData);
      
      if (validateCurrentStep()) {
        console.log('✅ Validation passed!');
        markStepCompleted(currentStep);
        if (currentStep < steps.length) {
          setCurrentStep(currentStep + 1);
        }
      } else {
        // Show validation errors
        const errorMessages = validationErrors.map(error => error.message).join('\n');
        console.log('❌ Validation failed with errors:', validationErrors);
        alert(`Please fix the following errors:\n\n${errorMessages}`);
      }
    }, 300); // Increased delay to ensure state propagation
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBackToDashboard = () => {
    // Check if there's any data filled
    const hasData = Object.keys(formData).length > 1; // More than just complaint_no
    
    if (hasData) {
      setShowBackConfirmation(true);
    } else {
      navigate('/technician');
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      let draftComplaintNo = formData.complaint_no;
      
      // If this is a new draft (not continuing an existing one), change complaint number to draft format
      if (!isDraftMode) {
        const timestamp = Date.now();
        draftComplaintNo = `DRAFT-${user.id}-${timestamp}`;
      }
      
      // Ensure date is set (default to today if not set)
      const finalDate = formData.date || new Date().toISOString().split('T')[0];
      
      const reportData = {
        ...formData,
        date: finalDate, // Ensure date is always set
        complaint_no: draftComplaintNo,
        technician_id: user.id,
        team_leader_id: user.team_leader_id,
        status: 'draft',
        approval_status: 'pending',
        tl_signature: null,
        tl_name: null,
        tl_mobile: null
      };

      if (existingDraftId) {
        // Update existing draft
        const { error } = await supabase
          .from('service_reports')
          .update(reportData)
          .eq('id', existingDraftId);

        if (error) throw error;
      } else {
        // Insert new draft
        const { data: reportResult, error } = await supabase
          .from('service_reports')
          .insert([reportData])
          .select()
          .single();

        if (error) throw error;
        
        setExistingDraftId(reportResult.id);
        setIsDraftMode(true);
        
        // Log audit trail
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'CREATE',
          table_name: 'service_reports',
          record_id: reportResult.id,
          new_data: reportData,
          ip_address: 'N/A',
          user_agent: navigator.userAgent
        });
      }
      
      alert('Report saved as draft successfully!');
      navigate('/technician/drafts');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    // Validate all steps before submission
    let allValid = true;
    for (let i = 1; i <= steps.length; i++) {
      const stepConfig = steps.find(step => step.id === i);
      if (!stepConfig) continue;
      
      for (const field of stepConfig.required) {
        const value = formData[field as keyof typeof formData];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          allValid = false;
          break;
        }
      }
      if (!allValid) break;
    }
    
    if (!allValid) {
      alert('Please complete all required fields in all steps before submitting.');
      return;
    }
    
    setSubmitting(true);
    try {
      // Ensure date is set (default to today if not set)
      const finalDate = formData.date || new Date().toISOString().split('T')[0];
      
      // If continuing a draft, change complaint number from DRAFT- to COMP- format
      let finalComplaintNo = formData.complaint_no;
      if (isDraftMode && finalComplaintNo && finalComplaintNo.startsWith('DRAFT-')) {
        // Replace DRAFT- with COMP- and use new timestamp
        const timestamp = Date.now();
        finalComplaintNo = `COMP-${timestamp}`;
        console.log('📝 Converting draft complaint number to submission format:', finalComplaintNo);
      }
      
      const reportData = {
        ...formData,
        complaint_no: finalComplaintNo, // Use converted complaint number
        date: finalDate, // Ensure date is always set
        technician_id: user.id,
        team_leader_id: user.team_leader_id,
        status: 'submitted',
        approval_status: 'pending',
        tl_signature: null,
        tl_name: null,
        tl_mobile: null,
        tech_engineer: user.full_name,
        tech_mobile: user.mobile || ''
      };

      if (existingDraftId) {
        // Update existing draft to submitted
        const { error } = await supabase
          .from('service_reports')
          .update(reportData)
          .eq('id', existingDraftId);

        if (error) throw error;
        
        // Log audit trail
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'UPDATE',
          table_name: 'service_reports',
          record_id: existingDraftId,
          new_data: reportData,
          ip_address: 'N/A',
          user_agent: navigator.userAgent
        });
      } else {
        // Insert new report
        const { data: reportResult, error } = await supabase
          .from('service_reports')
          .insert([reportData])
          .select()
          .single();

        if (error) throw error;
        
        // Log audit trail
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'CREATE',
          table_name: 'service_reports',
          record_id: reportResult.id,
          new_data: reportData,
          ip_address: 'N/A',
          user_agent: navigator.userAgent
        });
      }
      
      alert('Report submitted successfully! It has been sent to your team leader for approval.');
      navigate('/technician');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const CurrentStepComponent = steps.find(step => step.id === currentStep)?.component || BasicInformation;

  // Show loading while checking form access
  if (formAccessLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking form access...</p>
        </div>
      </div>
    );
  }

  // Show access denied message if user doesn't have access
  if (!hasFormAccess) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-500 p-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-700 mb-4">{formAccessMessage}</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">Why am I seeing this?</h3>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• The Service Report form may be temporarily disabled for your department</li>
                  <li>• Your department may not have been assigned this form yet</li>
                  <li>• There may be maintenance or updates in progress</li>
                </ul>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleBackToDashboard}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has access - show the form
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isDraftMode ? 'Continue Draft Report' : 'New Service Report'}
        </h1>
        <div></div>
      </div>

      {/* Enhanced Progress Indicator */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Step {currentStep} of {steps.length}</h2>
          <div className="text-sm text-gray-500">
            {Math.round((completedSteps.length / steps.length) * 100)}% Complete
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1">
              <div className="flex items-center">
                <div
                  className={`h-2 rounded-full flex-1 ${
                    isStepCompleted(step.id) ? 'bg-green-600' : 
                    index + 1 === currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
                {isStepCompleted(step.id) && (
                  <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                )}
              </div>
              <p
                className={`mt-2 text-xs font-medium ${
                  isStepCompleted(step.id) ? 'text-green-600' :
                  index + 1 === currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {step.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
          </div>
          <ul className="mt-2 text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <CurrentStepComponent
          data={formData}
          onUpdate={(data: any) => {
            console.log('📥 Parent received update from child:', data);
            console.log('📊 Current formData before merge:', formData);
            setFormData((prevFormData: any) => {
              const updatedData = { ...prevFormData, ...data };
              console.log('📊 Updated formData after merge:', updatedData);
              return updatedData;
            });
            // Clear validation errors when user updates data
            setValidationErrors([]);
          }}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Previous
        </button>

        <div className="flex space-x-3">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          {currentStep === steps.length ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>

      {/* Signature Workflow Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Workflow Information</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Complaint Number: {formData.complaint_no || 'Auto-generated'}</li>
          <li>• Your signature will be added in Step 6</li>
          <li>• After submission, report goes to Team Leader for approval</li>
          <li>• Team Leader will assign sequential number on approval (COMP-00XXX)</li>
          {isDraftMode && <li>• ℹ️ You are continuing a saved draft</li>}
        </ul>
      </div>

      {/* Back Confirmation Modal */}
      {showBackConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Are you sure to go back?</h3>
              <button
                onClick={() => setShowBackConfirmation(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              You have unsaved changes. What would you like to do?
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  setShowBackConfirmation(false);
                  navigate('/technician');
                }}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Discard and Go Back
              </button>
              <button
                onClick={async () => {
                  setShowBackConfirmation(false);
                  await handleSaveDraft();
                }}
                disabled={saving}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save as Draft and Go Back'}
              </button>
              <button
                onClick={() => setShowBackConfirmation(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
