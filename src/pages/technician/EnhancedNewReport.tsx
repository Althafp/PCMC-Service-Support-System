import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Save, Send, AlertCircle, CheckCircle } from 'lucide-react';
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
  { id: 1, name: 'Basic Information', component: BasicInformation, required: ['complaint_no', 'complaint_type', 'project_phase', 'system_type', 'date', 'zone'] },
  { id: 2, name: 'Location Details', component: LocationDetails, required: ['location', 'latitude', 'longitude'] },
  { id: 3, name: 'Image Upload', component: ImageUpload, required: ['before_image_url', 'after_image_url'] },
  { id: 4, name: 'Equipment Checklist', component: EquipmentChecklist, required: ['checklist_data'] },
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
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Handle clone data from navigation state
  useEffect(() => {
    const cloneData = location.state?.cloneData;
    if (cloneData) {
      setFormData(cloneData);
      // Mark all steps as completed since we have data
      setCompletedSteps([1, 2, 3, 4, 5, 6]);
    }
  }, [location.state]);

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const currentStepConfig = steps.find(step => step.id === currentStep);
    if (!currentStepConfig) return true;

    const errors: ValidationError[] = [];
    
    for (const field of currentStepConfig.required) {
      const value = formData[field as keyof typeof formData];
      
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push({
          field,
          message: `${field.replace('_', ' ').toUpperCase()} is required`
        });
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
    if (validateCurrentStep()) {
      markStepCompleted(currentStep);
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Show validation errors
      const errorMessages = validationErrors.map(error => error.message).join('\n');
      alert(`Please fix the following errors:\n\n${errorMessages}`);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const reportData = {
        ...formData,
        technician_id: user.id,
        team_leader_id: user.team_leader_id, // Set team leader for approval workflow
        status: 'draft',
        approval_status: 'pending',
        // Ensure team leader signature is empty for new reports
        tl_signature: null,
        tl_name: null,
        tl_mobile: null
      };

      const { data: reportResult, error } = await supabase
        .from('service_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) throw error;
      
      // Log audit trail
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'create',
        table_name: 'service_reports',
        record_id: reportResult.id,
        new_data: reportData,
        ip_address: 'N/A',
        user_agent: navigator.userAgent
      });
      
      alert('Report saved as draft successfully!');
      navigate('/technician');
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
      const reportData = {
        ...formData,
        technician_id: user.id,
        team_leader_id: user.team_leader_id, // Set team leader for approval workflow
        status: 'submitted',
        approval_status: 'pending',
        // Ensure team leader signature is empty for new reports
        tl_signature: null,
        tl_name: null,
        tl_mobile: null,
        // Set technician details
        tech_engineer: user.full_name,
        tech_mobile: user.mobile || ''
      };

      const { data: reportResult, error } = await supabase
        .from('service_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) throw error;
      
      // Log audit trail
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'create',
        table_name: 'service_reports',
        record_id: reportResult.id,
        new_data: reportData,
        ip_address: 'N/A',
        user_agent: navigator.userAgent
      });
      
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/technician')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">New Service Report</h1>
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
            setFormData({ ...formData, ...data });
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
        <h4 className="text-sm font-medium text-blue-900 mb-2">Signature Workflow</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Step 1: You (Technician) sign the report before submission</li>
          <li>• Step 2: Report is sent to your Team Leader for approval</li>
          <li>• Step 3: Team Leader reviews, signs, and approves/rejects the report</li>
          <li>• Note: Team Leader signature will be added during the approval process</li>
        </ul>
      </div>
    </div>
  );
}
