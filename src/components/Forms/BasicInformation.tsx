import React from 'react';

interface BasicInformationProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function BasicInformation({ data, onUpdate }: BasicInformationProps) {
  const handleChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complaint Number *
          </label>
          <input
            type="text"
            value={data.complaint_no || ''}
            onChange={(e) => handleChange('complaint_no', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter complaint number"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complaint Type *
          </label>
          <select
            value={data.complaint_type || ''}
            onChange={(e) => handleChange('complaint_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select complaint type</option>
            <option value="maintenance">Maintenance</option>
            <option value="repair">Repair</option>
            <option value="installation">Installation</option>
            <option value="inspection">Inspection</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Phase *
          </label>
          <select
            value={data.project_phase || ''}
            onChange={(e) => handleChange('project_phase', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select project phase</option>
            <option value="phase1">Phase 1</option>
            <option value="phase2">Phase 2</option>
            <option value="phase3">Phase 3</option>
            <option value="phase4">Phase 4</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System Type *
          </label>
          <select
            value={data.system_type || ''}
            onChange={(e) => handleChange('system_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select system type</option>
            <option value="cctv">CCTV</option>
            <option value="network">Network</option>
            <option value="power">Power Supply</option>
            <option value="infrastructure">Infrastructure</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={data.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zone *
          </label>
          <input
            type="text"
            value={data.zone || ''}
            onChange={(e) => handleChange('zone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter zone"
            required
          />
        </div>
      </div>
    </div>
  );
}