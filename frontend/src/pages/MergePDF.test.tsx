import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MergePDF from './MergePDF';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock crypto.randomUUID
Object.defineProperty(global.crypto, 'randomUUID', {
  value: vi.fn().mockReturnValue('test-uuid'),
});

// Mock window.URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');

describe('MergePDF Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component correctly', () => {
    render(<MergePDF />);
    
    // Check for main elements
    expect(screen.getByText('Merge PDF Files')).toBeInTheDocument();
    expect(screen.getByText('Combine multiple PDF files into a single document.')).toBeInTheDocument();
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByText('Add PDF Files')).toBeInTheDocument();
  });

  it('shows error when trying to merge with less than 2 files', async () => {
    render(<MergePDF />);
    
    // Try to merge without files
    fireEvent.click(screen.getByText('Merge PDFs'));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Please upload at least two PDF files to merge.')).toBeInTheDocument();
    });
  });

  it('handles file upload correctly', async () => {
    render(<MergePDF />);
    
    // Create a file input element (it's hidden in the component)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    
    // Create mock files
    const file1 = new File(['file1 content'], 'file1.pdf', { type: 'application/pdf' });
    const file2 = new File(['file2 content'], 'file2.pdf', { type: 'application/pdf' });
    
    // Simulate file selection
    const fileList = {
      0: file1,
      1: file2,
      length: 2,
      item: (index: number) => fileList[index as keyof typeof fileList],
    };
    
    // Find the FileUpload component and simulate file selection
    const uploadArea = screen.getByText('Click to upload');
    fireEvent.click(uploadArea);
    
    // Since the file input is hidden, we need to manually trigger the onChange handler
    // This is a workaround for testing
    const fileUploadComponent = document.querySelector('input[type="file"]');
    if (fileUploadComponent) {
      Object.defineProperty(fileUploadComponent, 'files', {
        value: fileList,
      });
      fireEvent.change(fileUploadComponent);
    }
    
    // Check if files are displayed
    await waitFor(() => {
      expect(screen.getByText('file1.pdf')).toBeInTheDocument();
      expect(screen.getByText('file2.pdf')).toBeInTheDocument();
    });
  });

  it('handles merge operation correctly', async () => {
    // Mock axios.post to return a successful response
    (axios.post as any).mockResolvedValue({
      data: new Blob(['merged pdf content'], { type: 'application/pdf' }),
    });
    
    render(<MergePDF />);
    
    // Manually add files to the component state
    // This is a workaround since we can't easily simulate file uploads in tests
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    
    // Create mock files
    const file1 = new File(['file1 content'], 'file1.pdf', { type: 'application/pdf' });
    const file2 = new File(['file2 content'], 'file2.pdf', { type: 'application/pdf' });
    
    // Simulate file selection
    const fileList = {
      0: file1,
      1: file2,
      length: 2,
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
    
    // Wait for files to be displayed
    await waitFor(() => {
      expect(screen.getByText('file1.pdf')).toBeInTheDocument();
      expect(screen.getByText('file2.pdf')).toBeInTheDocument();
    });
    
    // Click merge button
    fireEvent.click(screen.getByText('Merge PDFs'));
    
    // Check if axios.post was called with the correct parameters
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/pdf/merge'),
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
});
