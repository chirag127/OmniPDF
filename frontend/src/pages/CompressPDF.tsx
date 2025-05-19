import { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import MainLayout from '../layouts/MainLayout';
import FileUpload from '../components/common/FileUpload';
import Button from '../components/common/Button';
import axios from 'axios';

enum CompressionLevel {
  BASIC = 'basic',
  STRONG = 'strong',
}

interface CompressionOption {
  value: CompressionLevel;
  label: string;
  description: string;
}

const compressionOptions: CompressionOption[] = [
  {
    value: CompressionLevel.BASIC,
    label: 'Basic Compression',
    description: 'Moderate file size reduction with good quality. Best for most documents.',
  },
  {
    value: CompressionLevel.STRONG,
    label: 'Strong Compression',
    description: 'Maximum file size reduction with lower quality. Best for documents with many images.',
  },
];

const CompressPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [fileSize, setFileSize] = useState<number>(0);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>(CompressionLevel.BASIC);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setFileSize(selectedFile.size);
    setError(null);
    
    try {
      // Read the file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Get the page count
      const count = pdfDoc.getPageCount();
      setPageCount(count);
      
      // Generate a preview of the first page
      const previewDoc = await PDFDocument.create();
      const [firstPage] = await previewDoc.copyPages(pdfDoc, [0]);
      previewDoc.addPage(firstPage);
      
      // Save the preview as base64 data URL
      const pdfBytes = await previewDoc.saveAsBase64({ dataUri: true });
      setPreviewUrl(pdfBytes);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF file. Please make sure it is a valid PDF.');
      setFile(null);
      setPageCount(0);
      setPreviewUrl(null);
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCompress = async () => {
    if (!file) {
      setError('Please upload a PDF file');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('level', compressionLevel);
      
      // Send request to backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/v1/pdf/compress`,
        formData,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // Create a download link for the compressed PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      if (downloadLinkRef.current) {
        downloadLinkRef.current.href = url;
        downloadLinkRef.current.download = 'compressed.pdf';
        downloadLinkRef.current.click();
      }
    } catch (err) {
      console.error('Error compressing PDF:', err);
      setError('Failed to compress PDF file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compress PDF</h1>
        <p className="text-gray-600 mb-6">Reduce the file size of your PDF documents while maintaining quality.</p>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload PDF</h2>
          <FileUpload
            onFilesSelected={handleFileSelected}
            accept=".pdf"
            multiple={false}
            label="Upload PDF File"
          />
        </div>
        
        {file && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">PDF Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-700 mb-2"><span className="font-medium">Filename:</span> {file.name}</p>
                  <p className="text-gray-700 mb-2"><span className="font-medium">Size:</span> {formatFileSize(fileSize)}</p>
                  <p className="text-gray-700 mb-2"><span className="font-medium">Pages:</span> {pageCount}</p>
                  
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-700 mb-3">Compression Level</h3>
                    <div className="space-y-4">
                      {compressionOptions.map((option) => (
                        <label key={option.value} className="flex items-start">
                          <input
                            type="radio"
                            name="compressionLevel"
                            value={option.value}
                            checked={compressionLevel === option.value}
                            onChange={() => setCompressionLevel(option.value)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="ml-3">
                            <span className="block font-medium text-gray-700">{option.label}</span>
                            <span className="block text-sm text-gray-500">{option.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                {previewUrl && (
                  <div className="flex flex-col items-center">
                    <h3 className="font-medium text-gray-700 mb-2 self-start">Preview:</h3>
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <iframe
                        src={previewUrl}
                        title="PDF Preview"
                        className="w-full h-80"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            <div className="flex justify-center">
              <Button
                onClick={handleCompress}
                disabled={isLoading}
                isLoading={isLoading}
                size="lg"
              >
                {isLoading ? 'Compressing...' : 'Compress PDF'}
              </Button>
              <a ref={downloadLinkRef} className="hidden" />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default CompressPDF;
