import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompressPDF from './CompressPDF';
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
        getPageCount: vi.fn().mockReturnValue(5),
        copyPages: vi.fn().mockResolvedValue([{}]),
      }),
    },
  };
});

// Mock window.URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');

describe('CompressPDF Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component correctly', () => {
    render(<CompressPDF />);
    
    // Check for main elements
    expect(screen.getByText('Compress PDF')).toBeInTheDocument();
    expect(screen.getByText('Reduce the file size of your PDF documents while maintaining quality.')).toBeInTheDocument();
    expect(screen.getByText('Upload PDF')).toBeInTheDocument();
    expect(screen.getByText('Upload PDF File')).toBeInTheDocument();
  });

  it('handles file upload correctly', async () => {
    render(<CompressPDF />);
    
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
      expect(screen.getByText('5')).toBeInTheDocument();
    });
    
    // Check if compression options are displayed
    expect(screen.getByText('Compression Level')).toBeInTheDocument();
    expect(screen.getByText('Basic Compression')).toBeInTheDocument();
    expect(screen.getByText('Strong Compression')).toBeInTheDocument();
  });

  it('handles compression level selection correctly', async () => {
    render(<CompressPDF />);
    
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
    
    // Check if Basic Compression is selected by default
    const basicCompressionRadio = screen.getByLabelText('Basic Compression');
    const strongCompressionRadio = screen.getByLabelText('Strong Compression');
    
    expect(basicCompressionRadio).toBeChecked();
    expect(strongCompressionRadio).not.toBeChecked();
    
    // Select Strong Compression
    fireEvent.click(strongCompressionRadio);
    
    // Check if Strong Compression is now selected
    expect(basicCompressionRadio).not.toBeChecked();
    expect(strongCompressionRadio).toBeChecked();
  });

  it('handles compression correctly', async () => {
    render(<CompressPDF />);
    
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
    
    // Select Strong Compression
    const strongCompressionRadio = screen.getByLabelText('Strong Compression');
    fireEvent.click(strongCompressionRadio);
    
    // Mock axios.post to return a successful response
    (axios.post as any).mockResolvedValue({
      data: new Blob(['compressed pdf content'], { type: 'application/pdf' }),
    });
    
    // Click the compress button
    const compressButton = screen.getByText('Compress PDF');
    fireEvent.click(compressButton);
    
    // Check if axios.post was called with the correct parameters
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/pdf/compress'),
        expect.any(FormData),
        expect.objectContaining({
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
      
      // Check if the FormData contains the level parameter
      const formData = (axios.post as any).mock.calls[0][1];
      expect(formData.get('level')).toBe('strong');
    });
  });
});
