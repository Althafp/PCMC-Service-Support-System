import React, { useState } from 'react';
import { Upload, Camera, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageUploadProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function ImageUpload({ data, onUpdate }: ImageUploadProps) {
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const imageCategories = [
    { key: 'before_image_url', label: 'Before Work Image', required: true },
    { key: 'after_image_url', label: 'After Work Image', required: true },
    { key: 'ups_input_image_url', label: 'UPS Input Image', required: false },
    { key: 'ups_output_image_url', label: 'UPS Output Image', required: false },
    { key: 'thermistor_image_url', label: 'Thermistor Image', required: false },
  ];

  const uploadImageToSupabase = async (file: File, key: string): Promise<string | null> => {
    try {
      setUploading(prev => ({ ...prev, [key]: true }));
      setUploadProgress(prev => ({ ...prev, [key]: 0 }));

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${key}_${Date.now()}.${fileExt}`;
      const filePath = `service_reports/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images') // You'll need to create this bucket
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setUploadProgress(prev => ({ ...prev, [key]: 100 }));
      return publicUrl;

    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Error uploading image: ${error.message}`);
      return null;
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
      setUploadProgress(prev => ({ ...prev, [key]: 0 }));
    }
  };

  const handleFileUpload = async (key: string, file: File | null) => {
    if (!file) {
      onUpdate({ [key]: null });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const imageUrl = await uploadImageToSupabase(file, key);
    if (imageUrl) {
      onUpdate({ [key]: imageUrl });
    }
  };

  const removeImage = (key: string) => {
    onUpdate({ [key]: null });
  };

  const renderImagePreview = (imageUrl: string, key: string) => (
    <div className="space-y-3">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt="Uploaded" 
          className="w-full h-32 object-cover rounded-lg"
        />
        <button
          onClick={() => removeImage(key)}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-green-600">Image uploaded successfully</p>
    </div>
  );

  const renderUploadArea = (key: string, label: string, required: boolean) => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        {data[key] ? (
          renderImagePreview(data[key], key)
        ) : (
          <div className="space-y-3">
            {uploading[key] ? (
              <div className="space-y-3">
                <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin" />
                <p className="text-sm text-blue-600">Uploading...</p>
                {uploadProgress[key] > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress[key]}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <div>
                  <label className="cursor-pointer">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      Click to upload
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(key, e.target.files?.[0] || null)}
                      disabled={uploading[key]}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Image Upload</h2>
      <p className="text-gray-600">Upload images for different categories. Required images are marked with *</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {imageCategories.map((category) => (
          <div key={category.key}>
            {renderUploadArea(category.key, category.label, category.required)}
          </div>
        ))}
      </div>

      {/* Raw Power Supply Images (Multiple) */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Raw Power Supply Images (Multiple)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-3" />
          <div>
            <label className="cursor-pointer">
              <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Click to upload multiple images
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  const uploadedUrls: string[] = [];
                  
                  for (const file of files) {
                    if (file.size > 10 * 1024 * 1024) {
                      alert(`File ${file.name} is too large. Must be less than 10MB.`);
                      continue;
                    }
                    
                    if (!file.type.startsWith('image/')) {
                      alert(`File ${file.name} is not an image.`);
                      continue;
                    }
                    
                    const imageUrl = await uploadImageToSupabase(file, 'raw_power_supply');
                    if (imageUrl) {
                      uploadedUrls.push(imageUrl);
                    }
                  }
                  
                  if (uploadedUrls.length > 0) {
                    onUpdate({ raw_power_supply_images: uploadedUrls });
                  }
                }}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">Select multiple PNG, JPG, GIF files</p>
          </div>
          {data.raw_power_supply_images && data.raw_power_supply_images.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-green-600 mb-2">
                {data.raw_power_supply_images.length} images uploaded
              </p>
              <div className="grid grid-cols-2 gap-2">
                {data.raw_power_supply_images.map((url: string, index: number) => (
                  <div key={index} className="relative">
                    <img 
                      src={url} 
                      alt={`Power supply ${index + 1}`} 
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      onClick={() => {
                        const newUrls = data.raw_power_supply_images.filter((_: string, i: number) => i !== index);
                        onUpdate({ raw_power_supply_images: newUrls });
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thermistor Temperature */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thermistor Temperature (°C)
        </label>
        <input
          type="number"
          step="0.1"
          value={data.thermistor_temperature || ''}
          onChange={(e) => onUpdate({ thermistor_temperature: parseFloat(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter temperature reading"
        />
      </div>
    </div>
  );
}