import { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import MainLayout from '../layouts/MainLayout';
import FileUpload from '../components/common/FileUpload';
import Button from '../components/common/Button';
import axios from 'axios';

const SplitPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [ranges, setRanges] = useState<string>('');
  const [extractAll, setExtractAll] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setError(null);
    
    try {
      // Read the file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Get the page count
      const count = pdfDoc.getPageCount();
      setPageCount(count);
      
      // Generate preview for the first few pages (up to 5)
      const previewCount = Math.min(count, 5);
      const previews: string[] = [];
      
      for (let i = 0; i < previewCount; i++) {
        // Create a new document with just this page
        const previewDoc = await PDFDocument.create();
        const [page] = await previewDoc.copyPages(pdfDoc, [i]);
        previewDoc.addPage(page);
        
        // Save the preview as base64 data URL
        const pdfBytes = await previewDoc.saveAsBase64({ dataUri: true });
        previews.push(pdfBytes);
      }
      
      setPreviewPages(previews);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF file. Please make sure it is a valid PDF.');
      setFile(null);
      setPageCount(0);
      setPreviewPages([]);
    }
  }, []);

  const validateRanges = useCallback(() => {
    if (extractAll) return true;
    if (!ranges.trim()) {
      setError('Please enter page ranges');
      return false;
    }
    
    // Validate the range format
    const rangePattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;
    if (!rangePattern.test(ranges)) {
      setError('Invalid range format. Use format like "1-3,5,7-10"');
      return false;
    }
    
    // Validate that ranges are within page count
    const parts = ranges.split(',');
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start < 1 || end > pageCount || start > end) {
          setError(`Invalid range: ${part}. Pages must be between 1 and ${pageCount}, and start must be less than or equal to end.`);
          return false;
        }
      } else {
        const page = Number(part);
        if (page < 1 || page > pageCount) {
          setError(`Invalid page: ${part}. Pages must be between 1 and ${pageCount}.`);
          return false;
        }
      }
    }
    
    return true;
  }, [ranges, pageCount, extractAll]);

  const handleSplit = async () => {
    if (!file) {
      setError('Please upload a PDF file');
      return;
    }
    
    if (!validateRanges()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      if (extractAll) {
        formData.append('extractAll', 'true');
      } else {
        formData.append('ranges', ranges);
      }
      
      // Send request to backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/v1/pdf/split`,
        formData,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // Create a download link for the split PDF or ZIP file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      if (downloadLinkRef.current) {
        downloadLinkRef.current.href = url;
        downloadLinkRef.current.download = extractAll ? 'extracted-pages.zip' : 'split.pdf';
        downloadLinkRef.current.click();
      }
    } catch (err) {
      console.error('Error splitting PDF:', err);
      setError('Failed to split PDF file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Split PDF</h1>
        <p className="text-gray-600 mb-6">Extract specific pages or split a PDF into multiple files.</p>
        
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
              <div className="mb-4">
                <p className="text-gray-700"><span className="font-medium">Filename:</span> {file.name}</p>
                <p className="text-gray-700"><span className="font-medium">Size:</span> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="text-gray-700"><span className="font-medium">Pages:</span> {pageCount}</p>
              </div>
              
              {previewPages.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Preview:</h3>
                  <div className="flex flex-wrap gap-4">
                    {previewPages.map((preview, index) => (
                      <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="bg-gray-100 px-2 py-1 text-xs text-gray-600">Page {index + 1}</div>
                        <iframe
                          src={preview}
                          title={`Page ${index + 1}`}
                          className="w-32 h-40"
                        />
                      </div>
                    ))}
                    {pageCount > previewPages.length && (
                      <div className="flex items-center justify-center w-32 h-40 border border-gray-200 rounded-md bg-gray-50">
                        <span className="text-gray-500 text-sm">+{pageCount - previewPages.length} more pages</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Split Options</h2>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={extractAll}
                    onChange={(e) => setExtractAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Extract all pages as separate PDF files (will be downloaded as a ZIP file)</span>
                </label>
              </div>
              
              {!extractAll && (
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Page Ranges
                  </label>
                  <input
                    type="text"
                    value={ranges}
                    onChange={(e) => setRanges(e.target.value)}
                    placeholder="e.g., 1-3,5,7-10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Specify page ranges separated by commas. For example, "1-3,5,7-10" will extract pages 1, 2, 3, 5, 7, 8, 9, and 10.
                  </p>
                </div>
              )}
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            <div className="flex justify-center">
              <Button
                onClick={handleSplit}
                disabled={isLoading}
                isLoading={isLoading}
                size="lg"
              >
                {isLoading ? 'Processing...' : extractAll ? 'Extract All Pages' : 'Split PDF'}
              </Button>
              <a ref={downloadLinkRef} className="hidden" />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default SplitPDF;
