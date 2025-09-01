import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

interface EquipmentChecklistProps {
  data: any;
  onUpdate: (data: any) => void;
}

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
    hasTemperature: true,
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

export function EquipmentChecklist({ data, onUpdate }: EquipmentChecklistProps) {
  const [checklist, setChecklist] = useState(data.checklist_data || {});
  const [temperature, setTemperature] = useState(data.jb_temperature || '');
  const [remarks, setRemarks] = useState(data.equipment_remarks || {});

  // Set all items to 'OK' by default on component mount
  useEffect(() => {
    if (!data.checklist_data || Object.keys(data.checklist_data).length === 0) {
      const defaultChecklist: any = {};
      checklistCategories.forEach(category => {
        defaultChecklist[category.name] = {};
        category.items.forEach(item => {
          defaultChecklist[category.name][item] = 'ok';
        });
      });
      setChecklist(defaultChecklist);
      onUpdate({ 
        checklist_data: defaultChecklist,
        equipment_remarks: {}
      });
    }
  }, []);

  const handleChecklistChange = (category: string, item: string, status: 'ok' | 'issue' | 'na') => {
    const newChecklist = {
      ...checklist,
      [category]: {
        ...checklist[category],
        [item]: status,
      },
    };
    setChecklist(newChecklist);
    onUpdate({ checklist_data: newChecklist });
  };

  const handleRemarkChange = (category: string, item: string, remark: string) => {
    const newRemarks = {
      ...remarks,
      [category]: {
        ...remarks[category],
        [item]: remark,
      },
    };
    setRemarks(newRemarks);
    onUpdate({ equipment_remarks: newRemarks });
  };

  const handleTemperatureChange = (value: string) => {
    setTemperature(value);
    onUpdate({ jb_temperature: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Equipment Checklist</h2>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
          <p className="text-sm text-green-700">
            All items are set to 'OK' by default. Change status only if there are issues or items are not applicable.
          </p>
        </div>
      </div>

      {checklistCategories.map((category) => (
        <div key={category.name} className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{category.name}</h3>
          
          <div className="space-y-3">
            {category.items.map((item) => (
              <div key={item} className="bg-white p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                  <div className="flex space-x-2">
                    {['ok', 'issue', 'na'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleChecklistChange(category.name, item, status as any)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          checklist[category.name]?.[item] === status
                            ? status === 'ok'
                              ? 'bg-green-100 text-green-800'
                              : status === 'issue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {status === 'ok' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {status === 'issue' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                        {status.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Show remarks input only for items marked as 'issue' */}
                {checklist[category.name]?.[item] === 'issue' && (
                  <div className="mt-2">
                    <div className="flex items-center mb-1">
                      <MessageSquare className="w-3 h-3 text-gray-400 mr-1" />
                      <label className="text-xs font-medium text-gray-600">Remarks (Optional)</label>
                    </div>
                    <input
                      type="text"
                      value={remarks[category.name]?.[item] || ''}
                      onChange={(e) => handleRemarkChange(category.name, item, e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the issue or action taken..."
                    />
                  </div>
                )}
              </div>
            ))}
            
            {category.hasTemperature && (
              <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Temperature Reading (°C)</span>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => handleTemperatureChange(e.target.value)}
                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="°C"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}