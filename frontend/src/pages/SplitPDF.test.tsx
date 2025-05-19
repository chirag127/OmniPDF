import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SplitPDF from './SplitPDF';
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';

// Mock axios
vi.mock('axios');

// Mock pdf-lib
vi.mock('pdf-lib', () => {
  return {
    PDFDocument: {
      create: vi.fn().mockResolvedValue({
        copyPages: vi.fn().mockResolvedValue([{}]),
        addPage: vi.fn(),
        saveAsBase64: vi.fn().mockResolvedValue('data:application/pdf;base64,test'),
      }),
      load: vi.fn().mockResolvedValue({
        getPageCount: vi.fn().mockReturnValue(10),
        copyPages: vi.fn().mockResolvedValue([{}]),
      }),
    },
  };
});

// Mock crypto.randomUUID
Object.defineProperty(global.crypto, 'randomUUID', {
  value: vi.fn().mockReturnValue('test-uuid'),
});

// Mock window.URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');

describe('SplitPDF Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component correctly', () => {
    render(<SplitPDF />);
    
    // Check for main elements
    expect(screen.getByText('Split PDF')).toBeInTheDocument();
    expect(screen.getByText('Extract specific pages or split a PDF into multiple files.')).toBeInTheDocument();
    expect(screen.getByText('Upload PDF')).toBeInTheDocument();
    expect(screen.getByText('Upload PDF File')).toBeInTheDocument();
  });

  it('handles file upload correctly', async () => {
    render(<SplitPDF />);
    
    // Create a file input element (it's hidden in the component)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    // Create mock file
    const file = new File(['file content'], 'test.pdf', { type: 'application/pdf' });
    
    // Simulate file selection
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => fileList[index as keyof typeof fileList],
    };
    
    // Find the FileUpload component and simulate file selection
    const uploadArea = screen.getByText('Click to upload');
    fireEvent.click(uploadArea);
    
    // Since the file input is hidden, we need to manually trigger the onChange handler
    const fileUploadComponent = document.querySelector('input[type="file"]');
    if (fileUploadComponent) {
      Object.defineProperty(fileUploadComponent, 'files', {
        value: fileList,
      });
      fireEvent.change(fileUploadComponent);
    }
    
    // Check if PDF information is displayed
    await waitFor(() => {
      expect(screen.getByText('PDF Information')).toBeInTheDocument();
      expect(screen.getByText('Filename:')).toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('Pages:')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('validates page ranges correctly', async () => {
    render(<SplitPDF />);
    
    // Upload a file first
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    const file = new File(['file content'], 'test.pdf', { type: 'application/pdf' });
    
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => fileList[index as keyof typeof fileList],
    };
    
    const uploadArea = screen.getByText('Click to upload');
    fireEvent.click(uploadArea);
    
    const fileUploadComponent = document.querySelector('input[type="file"]');
    if (fileUploadComponent) {
      Object.defineProperty(fileUploadComponent, 'files', {
        value: fileList,
      });
      fireEvent.change(fileUploadComponent);
    }
    
    // Wait for PDF information to be displayed
    await waitFor(() => {
      expect(screen.getByText('PDF Information')).toBeInTheDocument();
    });
    
    // Try to split without entering page ranges
    const splitButton = screen.getByText('Split PDF');
    fireEvent.click(splitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Please enter page ranges')).toBeInTheDocument();
    });
    
    // Enter invalid page range format
    const rangeInput = screen.getByPlaceholderText('e.g., 1-3,5,7-10');
    fireEvent.change(rangeInput, { target: { value: '1-3-5' } });
    
    // Try to split with invalid range format
    fireEvent.click(splitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid range format. Use format like "1-3,5,7-10"')).toBeInTheDocument();
    });
    
    // Enter out-of-bounds page range
    fireEvent.change(rangeInput, { target: { value: '1-15' } });
    
    // Try to split with out-of-bounds range
    fireEvent.click(splitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid range: 1-15. Pages must be between 1 and 10, and start must be less than or equal to end.')).toBeInTheDocument();
    });
    
    // Enter valid page range
    fireEvent.change(rangeInput, { target: { value: '1-3,5,7-10' } });
    
    // Mock axios.post to return a successful response
    (axios.post as any).mockResolvedValue({
      data: new Blob(['split pdf content'], { type: 'application/pdf' }),
    });
    
    // Try to split with valid range
    fireEvent.click(splitButton);
    
    // Check if axios.post was called with the correct parameters
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/pdf/split'),
        expect.any(FormData),
        expect.objectContaining({
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
    });
  });

  it('handles extract all pages option correctly', async () => {
    render(<SplitPDF />);
    
    // Upload a file first
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    const file = new File(['file content'], 'test.pdf', { type: 'application/pdf' });
    
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => fileList[index as keyof typeof fileList],
    };
    
    const uploadArea = screen.getByText('Click to upload');
    fireEvent.click(uploadArea);
    
    const fileUploadComponent = document.querySelector('input[type="file"]');
    if (fileUploadComponent) {
      Object.defineProperty(fileUploadComponent, 'files', {
        value: fileList,
      });
      fireEvent.change(fileUploadComponent);
    }
    
    // Wait for PDF information to be displayed
    await waitFor(() => {
      expect(screen.getByText('PDF Information')).toBeInTheDocument();
    });
    
    // Check the "Extract all pages" checkbox
    const extractAllCheckbox = screen.getByText('Extract all pages as separate PDF files (will be downloaded as a ZIP file)');
    fireEvent.click(extractAllCheckbox);
    
    // Mock axios.post to return a successful response
    (axios.post as any).mockResolvedValue({
      data: new Blob(['zip content'], { type: 'application/zip' }),
    });
    
    // Click the extract button
    const extractButton = screen.getByText('Extract All Pages');
    fireEvent.click(extractButton);
    
    // Check if axios.post was called with the correct parameters
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/pdf/split'),
        expect.any(FormData),
        expect.objectContaining({
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
      
      // Check if the FormData contains the extractAll parameter
      const formData = (axios.post as any).mock.calls[0][1];
      expect(formData.get('extractAll')).toBe('true');
    });
  });
});
