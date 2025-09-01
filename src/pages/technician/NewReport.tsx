import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Save, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BasicInformation } from '../../components/Forms/BasicInformation';
import { LocationDetails } from '../../components/Forms/LocationDetails';
import { ImageUpload } from '../../components/Forms/ImageUpload';
import { EquipmentChecklist } from '../../components/Forms/EquipmentChecklist';
import { ReportContent } from '../../components/Forms/ReportContent';
import { DigitalSignatures } from '../../components/Forms/DigitalSignatures';

const steps = [
  { id: 1, name: 'Basic Information', component: BasicInformation },
  { id: 2, name: 'Location Details', component: LocationDetails },
  { id: 3, name: 'Image Upload', component: ImageUpload },
  { id: 4, name: 'Equipment Checklist', component: EquipmentChecklist },
  { id: 5, name: 'Report Content', component: ReportContent },
  { id: 6, name: 'Digital Signatures', component: DigitalSignatures },
];

export function NewReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
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
        status: 'draft'
      };

      const { error } = await supabase
        .from('service_reports')
        .insert([reportData]);

      if (error) throw error;
      
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
    
    setSubmitting(true);
    try {
      const reportData = {
        ...formData,
        technician_id: user.id,
        status: 'submitted'
      };

      const { error } = await supabase
        .from('service_reports')
        .insert([reportData]);

      if (error) throw error;
      
      alert('Report submitted successfully!');
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

      {/* Progress Indicator */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Step {currentStep} of {steps.length}</h2>
          <div className="text-sm text-gray-500">
            {Math.round((currentStep / steps.length) * 100)}% Complete
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1">
              <div
                className={`h-2 rounded-full ${
                  index + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
              <p
                className={`mt-2 text-xs font-medium ${
                  index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {step.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <CurrentStepComponent
          data={formData}
          onUpdate={(data: any) => setFormData({ ...formData, ...data })}
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
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
    </div>
  );
}