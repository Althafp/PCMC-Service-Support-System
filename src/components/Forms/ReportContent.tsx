import React, { useEffect } from 'react';

interface ReportContentProps {
  data: any;
  onUpdate: (data: any) => void;
}

const defaultComplaints = [
  'Network connectivity issues',
  'Power supply malfunction', 
  'CCTV camera not working',
  'Equipment installation required',
  'Maintenance and cleaning',
  'System configuration update',
  'Hardware replacement needed',
  'Software troubleshooting'
];

const defaultRemarks = [
  'Equipment inspected and found to be functioning properly',
  'Issue resolved after cleaning and maintenance',
  'Replacement parts installed successfully',
  'Configuration updated as per requirements',
  'System tested and working within normal parameters',
  'Customer trained on proper usage and maintenance'
];

export function ReportContent({ data, onUpdate }: ReportContentProps) {
  const handleChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
  };

  // Set default values when component mounts
  useEffect(() => {
    if (!data.nature_of_complaint && !data.field_team_remarks) {
      onUpdate({
        nature_of_complaint: data.nature_of_complaint || '',
        field_team_remarks: data.field_team_remarks || 'Service completed successfully. All systems tested and functioning normally.',
        customer_feedback: data.customer_feedback || ''
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Report Content</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nature of Complaint *
          </label>
          
          {/* Quick Select Options */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-2">Quick Select (Optional)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {defaultComplaints.map((complaint, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleChange('nature_of_complaint', complaint)}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-left"
                >
                  {complaint}
                </button>
              ))}
            </div>
          </div>
          
          <textarea
            value={data.nature_of_complaint || ''}
            onChange={(e) => handleChange('nature_of_complaint', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe the nature of the complaint in detail..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Field Team Remarks *
          </label>
          
          {/* Quick Select Options */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-2">Quick Select (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {defaultRemarks.map((remark, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleChange('field_team_remarks', remark)}
                  className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 text-left"
                >
                  {remark}
                </button>
              ))}
            </div>
          </div>
          
          <textarea
            value={data.field_team_remarks || 'Service completed successfully. All systems tested and functioning normally.'}
            onChange={(e) => handleChange('field_team_remarks', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add field team remarks, observations, or additional notes..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Feedback
          </label>
          <textarea
            value={data.customer_feedback || ''}
            onChange={(e) => handleChange('customer_feedback', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Record any feedback provided by the customer..."
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Guidelines for Report Content</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Be specific and detailed in describing the complaint</li>
            <li>• Include any error codes, symptoms, or issues observed</li>
            <li>• Mention any temporary fixes or workarounds applied</li>
            <li>• Record customer concerns or special requests</li>
            <li>• Note any environmental factors that may affect the equipment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}