import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import Button from './Button';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  className?: string;
  label?: string;
}

const FileUpload = ({
  onFilesSelected,
  accept = '.pdf',
  multiple = false,
  maxSize = 52428800, // 50MB default
  className = '',
  label = 'Upload Files'
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFiles(Array.from(files));
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFiles(Array.from(files));
    }
  };

  const validateAndProcessFiles = (files: File[]) => {
    setError(null);
    
    // Check file types
    const invalidTypeFiles = files.filter(file => {
      if (!accept) return false;
      const acceptedTypes = accept.split(',').map(type => type.trim());
      
      // Handle file extensions (e.g., .pdf)
      if (acceptedTypes.some(type => type.startsWith('.'))) {
        return !acceptedTypes.some(type => 
          file.name.toLowerCase().endsWith(type.toLowerCase())
        );
      }
      
      // Handle MIME types (e.g., application/pdf)
      return !acceptedTypes.some(type => 
        file.type === type || type === '*/*'
      );
    });

    if (invalidTypeFiles.length > 0) {
      setError(`Invalid file type(s). Accepted: ${accept}`);
      return;
    }

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(`File(s) too large. Maximum size: ${formatBytes(maxSize)}`);
      return;
    }

    // If all validations pass, call the callback
    onFilesSelected(files);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
        />
        
        <div className="flex flex-col items-center justify-center">
          <svg 
            className="w-12 h-12 text-gray-400 mb-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <p className="mb-2 text-sm text-gray-700">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {multiple ? 'Files' : 'File'} should be {accept.replace(/\./g, '').toUpperCase()} (Max: {formatBytes(maxSize)})
          </p>
          
          <Button 
            variant="primary" 
            size="sm" 
            className="mt-4"
            type="button"
          >
            {label}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
