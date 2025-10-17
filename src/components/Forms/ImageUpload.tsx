import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageUploadProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function ImageUpload({ data, onUpdate }: ImageUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Add GPS watermark to image
  const addGPSWatermark = async (file: File, latitude: any, longitude: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Add GPS watermark (bottom-left, green text)
        ctx.font = '48px Arial';
        ctx.fillStyle = 'rgb(0, 255, 0)'; // Bright green
        ctx.strokeStyle = 'rgb(0, 0, 0)'; // Black outline for visibility
        ctx.lineWidth = 2;
        
        const text1 = `Lat: ${parseFloat(latitude).toFixed(6)}`;
        const text2 = `Long: ${parseFloat(longitude).toFixed(6)}`;
        const padding = 15;
        const lineHeight = 55;
        
        // Draw text with outline for better visibility
        ctx.strokeText(text1, padding, canvas.height - lineHeight - padding);
        ctx.fillText(text1, padding, canvas.height - lineHeight - padding);
        
        ctx.strokeText(text2, padding, canvas.height - padding);
        ctx.fillText(text2, padding, canvas.height - padding);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not create blob'));
          }
        }, 'image/jpeg', 0.95);
      };
      
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file: File, type: string, index?: number): Promise<string> => {
    try {
      const timestamp = Date.now();
      const fileName = index !== undefined 
        ? `${type}_${index}_${timestamp}.jpg`
        : `${type}_${timestamp}.jpg`;
      
      const filePath = `service_reports/${fileName}`;
      
      // Add GPS watermark if coordinates available
      let fileToUpload: File | Blob = file;
      if (data.latitude && data.longitude) {
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          const watermarkedBlob = await addGPSWatermark(file, lat, lng);
          fileToUpload = new File([watermarkedBlob], fileName, { type: 'image/jpeg' });
        }
      }

      // Upload to Supabase Storage
      const { data: uploadData, error } = await supabase.storage
        .from('images')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Handle single image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!data.latitude || !data.longitude) {
      alert('Please enable GPS location in Step 1 before uploading images.');
      return;
    }

    setUploading(fieldName);
    try {
      const url = await uploadImage(file, fieldName);
      onUpdate({ [fieldName]: url });
      console.log(`✅ Image uploaded successfully: ${fieldName}`);
      // Removed alert notification
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  // Handle multiple images upload (Raw Power Supply)
  const handleMultipleImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    if (files.length > 10) {
      alert('Maximum 10 images allowed for Raw Power Supply');
      return;
    }

    if (!data.latitude || !data.longitude) {
      alert('Please enable GPS location in Step 1 before uploading images.');
      return;
    }

    setUploading('raw_power_supply_images');
    try {
      const uploadPromises = files.map((file, index) => 
        uploadImage(file, 'raw_power', index)
      );
      
      const urls = await Promise.all(uploadPromises);
      const existingUrls = data.raw_power_supply_images || [];
      onUpdate({ raw_power_supply_images: [...existingUrls, ...urls] });
      console.log(`✅ ${urls.length} images uploaded successfully with GPS watermarks`);
      // Removed alert notification
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  // Remove image
  const removeImage = (fieldName: string, index?: number) => {
    if (fieldName === 'raw_power_supply_images' && index !== undefined) {
      const images = [...(data.raw_power_supply_images || [])];
      images.splice(index, 1);
      onUpdate({ raw_power_supply_images: images });
    } else {
      onUpdate({ [fieldName]: null });
    }
  };

  // Image preview component
  const ImagePreview = ({ url, onRemove, label }: { url: string; onRemove: () => void; label: string }) => (
    <div className="relative group">
      <img 
        src={url} 
        alt={label}
        className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
      />
      <div className="absolute top-2 right-2">
        <button
          type="button"
          onClick={onRemove}
          className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
        <MapPin className="w-3 h-3 inline mr-1" />
        GPS Watermarked
      </div>
    </div>
  );

  // File input component
  const FileInput = ({ fieldName, label, multiple = false, onChange }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} *
      </label>
      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 ${
        uploading === fieldName ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {uploading === fieldName ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          ) : (
            <>
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Click to select {multiple ? 'images' : 'image'}</p>
              <p className="text-xs text-gray-500 mt-1">Camera or Gallery</p>
            </>
                )}
              </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
          multiple={multiple}
          onChange={onChange}
          disabled={uploading !== null}
                    />
                  </label>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Step 3: Image Upload</h2>

      {/* GPS Check Warning */}
      {(!data.latitude || !data.longitude) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-800">
            ⚠️ GPS coordinates not available! Please enable location in Step 1 before uploading images.
            Images will be watermarked with GPS coordinates.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Image */}
        <div>
          {data.before_image_url ? (
            <ImagePreview 
              url={data.before_image_url}
              onRemove={() => removeImage('before_image_url')}
              label="Before Image"
            />
          ) : (
            <FileInput
              fieldName="before_image_url"
              label="Before Image"
              onChange={(e: any) => handleImageUpload(e, 'before_image_url')}
            />
          )}
          </div>

        {/* After Image */}
        <div>
          {data.after_image_url ? (
            <ImagePreview 
              url={data.after_image_url}
              onRemove={() => removeImage('after_image_url')}
              label="After Image"
            />
          ) : (
            <FileInput
              fieldName="after_image_url"
              label="After Image"
              onChange={(e: any) => handleImageUpload(e, 'after_image_url')}
            />
          )}
      </div>

        {/* UPS Input Image */}
          <div>
          {data.ups_input_image_url ? (
            <ImagePreview 
              url={data.ups_input_image_url}
              onRemove={() => removeImage('ups_input_image_url')}
              label="UPS Input"
            />
          ) : (
            <FileInput
              fieldName="ups_input_image_url"
              label="UPS Input Image"
              onChange={(e: any) => handleImageUpload(e, 'ups_input_image_url')}
            />
          )}
        </div>

        {/* UPS Output Image */}
        <div>
          {data.ups_output_image_url ? (
            <ImagePreview 
              url={data.ups_output_image_url}
              onRemove={() => removeImage('ups_output_image_url')}
              label="UPS Output"
            />
          ) : (
            <FileInput
              fieldName="ups_output_image_url"
              label="UPS Output Image"
              onChange={(e: any) => handleImageUpload(e, 'ups_output_image_url')}
            />
          )}
        </div>

        {/* Thermistor Image */}
        <div>
          {data.thermistor_image_url ? (
            <ImagePreview 
              url={data.thermistor_image_url}
              onRemove={() => removeImage('thermistor_image_url')}
              label="Thermistor"
            />
          ) : (
            <FileInput
              fieldName="thermistor_image_url"
              label="Thermistor Image"
              onChange={(e: any) => handleImageUpload(e, 'thermistor_image_url')}
            />
          )}
        </div>
      </div>

      {/* Raw Power Supply Images (Multiple) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Raw Power Supply Images (Multiple) * <span className="text-gray-500 text-xs">(Up to 10 images)</span>
        </label>
        
        {/* Existing images */}
        {data.raw_power_supply_images && data.raw_power_supply_images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {data.raw_power_supply_images.map((url: string, index: number) => (
              <ImagePreview
                key={index}
                url={url}
                onRemove={() => removeImage('raw_power_supply_images', index)}
                label={`Raw Power ${index + 1}`}
              />
            ))}
          </div>
        )}
        
        {/* Upload more */}
        {(!data.raw_power_supply_images || data.raw_power_supply_images.length < 10) && (
          <FileInput
            fieldName="raw_power_supply_images"
            label=""
            multiple={true}
            onChange={handleMultipleImagesUpload}
          />
        )}
        
        {data.raw_power_supply_images && data.raw_power_supply_images.length >= 10 && (
          <p className="text-sm text-orange-600 mt-2">
            Maximum 10 images reached
          </p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-900 mb-2 flex items-center">
          <Check className="w-4 h-4 mr-2" />
          GPS Watermarking Active
        </h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• All images are automatically watermarked with GPS coordinates</li>
          <li>• Watermark format: "Lat: {data.latitude || 'X.XXXX'}, Long: {data.longitude || 'X.XXXX'}"</li>
          <li>• Watermark appears in bottom-left corner (bright green text)</li>
          <li>• Images uploaded to Supabase Storage bucket: 'images'</li>
          <li>• Raw Power Supply: Upload multiple images (max 10)</li>
        </ul>
      </div>

      {/* Image Count Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Images Uploaded:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Before:</span>
            <span className={data.before_image_url ? 'text-green-600 font-medium' : 'text-gray-500'}>
              {data.before_image_url ? '✓' : '○'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>After:</span>
            <span className={data.after_image_url ? 'text-green-600 font-medium' : 'text-gray-500'}>
              {data.after_image_url ? '✓' : '○'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>UPS Input:</span>
            <span className={data.ups_input_image_url ? 'text-green-600 font-medium' : 'text-gray-500'}>
              {data.ups_input_image_url ? '✓' : '○'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>UPS Output:</span>
            <span className={data.ups_output_image_url ? 'text-green-600 font-medium' : 'text-gray-500'}>
              {data.ups_output_image_url ? '✓' : '○'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Thermistor:</span>
            <span className={data.thermistor_image_url ? 'text-green-600 font-medium' : 'text-gray-500'}>
              {data.thermistor_image_url ? '✓' : '○'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Raw Power:</span>
            <span className={data.raw_power_supply_images?.length > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}>
              {data.raw_power_supply_images?.length || 0}/10
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
