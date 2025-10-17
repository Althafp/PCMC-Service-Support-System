import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface EquipmentChecklistProps {
  data: any;
  onUpdate: (data: any) => void;
}

// Define all checklist sections and items
const CHECKLIST_SECTIONS = {
  'Junction Box': [
      'Junction Box Condition',
      'Lock and Key Available',
      'Door Opening/Closing',
      'Earthing Connection',
      'Water Seepage',
      'Ventilation',
      'Internal Wiring',
      'Label/Marking',
    'Overall Cleanliness'
  ],
  'Raw Power Supply': [
      'Voltage Level (R-N)',
    'Voltage Level (L-N)',
    'Voltage Level (N-E)',
    'Neutral Connection'
  ],
  'UPS System': [
    'UPS Input Voltage',
    'UPS Output Voltage'
  ],
  'Battery': [
    'Battery Condition',
    'Battery Voltage'
  ],
  'Network Switch': [
    'Switch Power Status',
    'Port Status',
    'LED Indicators',
    'Configuration',
    'Fibre Condition'
  ],
  'Cameras': [
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
    'Overall Performance'
  ]
};

// Sections that require value input
const SECTIONS_WITH_VALUES = ['UPS System', 'Battery'];

export function EquipmentChecklist({ data, onUpdate }: EquipmentChecklistProps) {
  const [checklistData, setChecklistData] = useState<any>(data.checklist_data || {});
  const [equipmentRemarks, setEquipmentRemarks] = useState<any>(data.equipment_remarks || {});
  const [jbTemperature, setJbTemperature] = useState(data.jb_temperature || '');
  const [cameraCount, setCameraCount] = useState(equipmentRemarks.camera_count || '');
  const [cameraRemarks, setCameraRemarks] = useState(equipmentRemarks.camera_remarks || '');

  // Initialize checklist data with default values
  useEffect(() => {
    const initialChecklist: any = {};
    Object.keys(CHECKLIST_SECTIONS).forEach(section => {
      initialChecklist[section] = {};
      CHECKLIST_SECTIONS[section as keyof typeof CHECKLIST_SECTIONS].forEach(item => {
        if (!checklistData[section]?.[item]) {
          initialChecklist[section][item] = 'ok';
        } else {
          initialChecklist[section][item] = checklistData[section][item];
        }
      });
    });
    setChecklistData({ ...initialChecklist, ...checklistData });
  }, []);

  // Update parent whenever data changes
  useEffect(() => {
    const updatedRemarks = {
      ...equipmentRemarks,
      camera_count: cameraCount,
      camera_remarks: cameraRemarks
    };
    
      onUpdate({ 
      checklist_data: checklistData,
      equipment_remarks: updatedRemarks,
      jb_temperature: jbTemperature
    });
  }, [checklistData, equipmentRemarks, jbTemperature, cameraCount, cameraRemarks]);

  // Handle status change
  const handleStatusChange = (section: string, item: string, status: string) => {
    setChecklistData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [item]: status
      }
    }));

    // Remove remark if status is not 'issue'
    if (status !== 'issue') {
      const remarkKey = `${section}-${item}`;
      setEquipmentRemarks((prev: any) => {
        const updated = { ...prev };
        delete updated[remarkKey];
        return updated;
      });
    }
  };

  // Handle remark change
  const handleRemarkChange = (section: string, item: string, remark: string) => {
    const remarkKey = `${section}-${item}`;
    setEquipmentRemarks((prev: any) => ({
      ...prev,
      [remarkKey]: remark
    }));
  };

  // Handle value change (for UPS/Battery)
  const handleValueChange = (section: string, item: string, value: string) => {
    const valueKey = `${section}-${item}-value`;
    setEquipmentRemarks((prev: any) => ({
      ...prev,
      [valueKey]: value
    }));
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800 border-green-300';
      case 'issue': return 'bg-red-100 text-red-800 border-red-300';
      case 'na': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-4 h-4" />;
      case 'issue': return <AlertCircle className="w-4 h-4" />;
      case 'na': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  // Render single checklist item
  const renderChecklistItem = (section: string, item: string, requiresValue: boolean = false) => {
    const status = checklistData[section]?.[item] || 'ok';
    const remarkKey = `${section}-${item}`;
    const valueKey = `${section}-${item}-value`;
    const remark = equipmentRemarks[remarkKey] || '';
    const value = equipmentRemarks[valueKey] || '';

    return (
      <div key={item} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">{item}</label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(section, item, e.target.value)}
            className={`px-3 py-1 rounded-lg border-2 text-sm font-medium ${getStatusColor(status)}`}
          >
            <option value="ok">OK</option>
            <option value="issue">ISSUE</option>
            <option value="na">N/A</option>
          </select>
        </div>

        {/* Value field (always show for UPS/Battery) */}
        {requiresValue && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Value *</label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleValueChange(section, item, e.target.value)}
              placeholder="Enter value (e.g., 220V, Good)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        )}

        {/* Remark field (only show if status is 'issue') */}
        {status === 'issue' && (
          <div>
            <label className="block text-xs text-red-600 mb-1">Remark (Issue) *</label>
            <textarea
              value={remark}
              onChange={(e) => handleRemarkChange(section, item, e.target.value)}
              placeholder="Describe the issue..."
              className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              rows={2}
              required
            />
          </div>
        )}
      </div>
    );
  };

  // Render section
  const renderSection = (sectionName: string) => {
    const items = CHECKLIST_SECTIONS[sectionName as keyof typeof CHECKLIST_SECTIONS];
    const requiresValue = SECTIONS_WITH_VALUES.includes(sectionName);
    const itemCount = items.length;
    const okCount = items.filter(item => checklistData[sectionName]?.[item] === 'ok').length;
    const issueCount = items.filter(item => checklistData[sectionName]?.[item] === 'issue').length;

    return (
      <div key={sectionName} className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{sectionName}</h3>
          <div className="flex items-center space-x-2 text-sm">
            <span className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              {okCount}
            </span>
            <span className="flex items-center text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {issueCount}
            </span>
            <span className="text-gray-500">/ {itemCount}</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {items.map(item => renderChecklistItem(sectionName, item, requiresValue))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Step 4: Equipment Checklist</h2>

      {/* JB Temperature */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🌡️ Junction Box Temperature (°C) *
        </label>
        <input
          type="number"
          step="0.01"
          value={jbTemperature}
          onChange={(e) => setJbTemperature(e.target.value)}
          placeholder="Enter temperature (e.g., 35.5)"
          className="w-full md:w-1/3 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">ℹ️ Checklist Instructions:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>OK:</strong> Item is functioning properly</li>
          <li>• <strong>ISSUE:</strong> Item has a problem (must provide remark)</li>
          <li>• <strong>N/A:</strong> Item is not applicable</li>
          <li>• UPS & Battery items: Always enter value (voltage, condition, etc.)</li>
          <li>• Camera section: Enter total camera count and overall remarks</li>
        </ul>
      </div>

      {/* All Sections */}
      <div className="space-y-4">
        {/* Junction Box */}
        {renderSection('Junction Box')}

        {/* Raw Power Supply */}
        {renderSection('Raw Power Supply')}

        {/* UPS System */}
        {renderSection('UPS System')}

        {/* Battery */}
        {renderSection('Battery')}

        {/* Network Switch */}
        {renderSection('Network Switch')}

        {/* Cameras */}
        {renderSection('Cameras')}

        {/* Camera Specific Fields */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📹 Camera Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Cameras *
              </label>
              <input
                type="number"
                value={cameraCount}
                onChange={(e) => setCameraCount(e.target.value)}
                placeholder="Enter total number of cameras (e.g., 8)"
                className="w-full md:w-1/3 px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Camera Section Remarks
              </label>
              <textarea
                value={cameraRemarks}
                onChange={(e) => setCameraRemarks(e.target.value)}
                placeholder="Enter overall remarks for all cameras (e.g., Camera 5 needs cleaning, Camera 3 has condensation)"
                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                This is a combined remark field for all cameras. Use it for general observations.
              </p>
            </div>
          </div>
                  </div>
                </div>
                
      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-900 mb-2">📊 Checklist Summary:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {Object.keys(CHECKLIST_SECTIONS).map(section => {
            const items = CHECKLIST_SECTIONS[section as keyof typeof CHECKLIST_SECTIONS];
            const okCount = items.filter(item => checklistData[section]?.[item] === 'ok').length;
            const issueCount = items.filter(item => checklistData[section]?.[item] === 'issue').length;
            const naCount = items.filter(item => checklistData[section]?.[item] === 'na').length;
            
            return (
              <div key={section} className="bg-white p-2 rounded border border-green-300">
                <div className="font-medium text-gray-900 mb-1">{section}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600">✓ {okCount}</span>
                  <span className="text-red-600">⚠ {issueCount}</span>
                  <span className="text-gray-500">○ {naCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Database Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💾 Database Storage:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>checklist_data:</strong> JSONB containing all 33 item statuses (ok/issue/na)</li>
          <li>• <strong>equipment_remarks:</strong> JSONB containing remarks for issues, values for UPS/Battery, camera data</li>
          <li>• <strong>jb_temperature:</strong> NUMERIC field for temperature reading</li>
          <li>• Format: {`{Section: {Item: "status"}}`}</li>
        </ul>
      </div>
    </div>
  );
}
