import { useState, useRef, useCallback } from 'react';
import MainLayout from '../layouts/MainLayout';
import FileUpload from '../components/common/FileUpload';
import Button from '../components/common/Button';
import axios from 'axios';

interface UploadedFile {
  file: File;
  id: string;
}

const MergePDF = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setError(null);
    
    // Create UploadedFile objects with unique IDs
    const newFiles = selectedFiles.map(file => ({
      file,
      id: crypto.randomUUID(),
    }));
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const temp = newFiles[index];
      newFiles[index] = newFiles[index - 1];
      newFiles[index - 1] = temp;
      return newFiles;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    if (index === files.length - 1) return;
    
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const temp = newFiles[index];
      newFiles[index] = newFiles[index + 1];
      newFiles[index + 1] = temp;
      return newFiles;
    });
  }, [files.length]);

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please upload at least two PDF files to merge.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      files.forEach(fileObj => {
        formData.append('files', fileObj.file);
      });

      // Send request to backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/v1/pdf/merge`,
        formData,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Create a download link for the merged PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      if (downloadLinkRef.current) {
        downloadLinkRef.current.href = url;
        downloadLinkRef.current.download = 'merged.pdf';
        downloadLinkRef.current.click();
      }
    } catch (err) {
      console.error('Error merging PDFs:', err);
      setError('Failed to merge PDF files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Merge PDF Files</h1>
        <p className="text-gray-600 mb-6">Combine multiple PDF files into a single document.</p>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
          <FileUpload
            onFilesSelected={handleFilesSelected}
            accept=".pdf"
            multiple={true}
            label="Add PDF Files"
          />
        </div>

        {files.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Selected Files</h2>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop to reorder files. The PDFs will be merged in the order shown below.
            </p>

            <div className="space-y-3">
              {files.map((fileObj, index) => (
                <div 
                  key={fileObj.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 truncate max-w-xs">
                      {fileObj.file.name}
                    </span>
                    <span className="ml-2 text-gray-400 text-sm">
                      ({(fileObj.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded ${index === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'}`}
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === files.length - 1}
                      className={`p-1 rounded ${index === files.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'}`}
                      title="Move down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemoveFile(fileObj.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleMerge}
            disabled={files.length < 2 || isLoading}
            isLoading={isLoading}
            size="lg"
          >
            {isLoading ? 'Merging PDFs...' : 'Merge PDFs'}
          </Button>
          <a ref={downloadLinkRef} className="hidden" />
        </div>
      </div>
    </MainLayout>
  );
};

export default MergePDF;
