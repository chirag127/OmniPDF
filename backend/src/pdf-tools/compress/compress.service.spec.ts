import { Test, TestingModule } from '@nestjs/testing';
import { CompressService, CompressionLevel } from './compress.service';
import { FileService } from '../../shared/services/file.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as childProcess from 'child_process';

jest.mock('fs');
jest.mock('child_process');

jest.mock('pdf-lib', () => {
  return {
    PDFDocument: {
      create: jest.fn().mockResolvedValue({
        copyPages: jest.fn().mockResolvedValue([{}]),
        addPage: jest.fn(),
        save: jest.fn().mockResolvedValue(Buffer.from('compressed')),
      }),
      load: jest.fn().mockResolvedValue({
        save: jest.fn().mockResolvedValue(Buffer.from('compressed')),
      }),
    },
  };
});

describe('CompressService', () => {
  let service: CompressService;
  let fileService: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompressService,
        FileService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key, defaultValue) => {
              if (key === 'fileUpload.tempDir') return 'temp';
              if (key === 'fileUpload.tempFileExpiry') return 3600;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CompressService>(CompressService);
    fileService = module.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('compressWithPdfLib', () => {
    it('should compress a PDF file using pdf-lib and return the path to the compressed file', async () => {
      // Mock file system operations
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('original'));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      
      // Call the service method
      const filePath = 'test.pdf';
      const result = await service.compressWithPdfLib(filePath);
      
      // Assertions
      expect(result).toContain('temp/compressed-');
      expect(result).toContain('.pdf');
      expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if reading a file fails', async () => {
      // Mock file system operations to throw an error
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });
      
      // Call the service method and expect it to throw
      const filePath = 'test.pdf';
      await expect(service.compressWithPdfLib(filePath)).rejects.toThrow('File not found');
    });
  });

  describe('compressWithGhostscript', () => {
    it('should compress a PDF file using Ghostscript when available', async () => {
      // Mock file system operations
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (fs.statSync as jest.Mock).mockReturnValue({ size: 100 });
      
      // Mock child_process.spawn
      const mockSpawn = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'close') {
            callback(0); // Simulate successful process exit
          }
          return mockSpawn;
        }),
      };
      (childProcess.spawn as jest.Mock).mockReturnValue(mockSpawn);
      
      // Mock isGhostscriptAvailable to return true
      jest.spyOn(service as any, 'isGhostscriptAvailable').mockReturnValue(true);
      
      // Call the service method
      const filePath = 'test.pdf';
      const result = await service.compressWithGhostscript(filePath);
      
      // Assertions
      expect(result).toContain('temp/compressed-');
      expect(result).toContain('.pdf');
      expect(childProcess.spawn).toHaveBeenCalledWith('gs', expect.arrayContaining([
        '-sDEVICE=pdfwrite',
        '-dPDFSETTINGS=/ebook',
        expect.stringContaining('-sOutputFile='),
        filePath
      ]));
    });

    it('should fall back to pdf-lib if Ghostscript is not available', async () => {
      // Mock isGhostscriptAvailable to return false
      jest.spyOn(service as any, 'isGhostscriptAvailable').mockReturnValue(false);
      
      // Mock compressWithPdfLib
      const mockCompressWithPdfLib = jest.spyOn(service, 'compressWithPdfLib')
        .mockResolvedValue('temp/compressed-fallback.pdf');
      
      // Call the service method
      const filePath = 'test.pdf';
      const result = await service.compressWithGhostscript(filePath);
      
      // Assertions
      expect(result).toBe('temp/compressed-fallback.pdf');
      expect(mockCompressWithPdfLib).toHaveBeenCalledWith(filePath);
    });
  });

  describe('compressPdf', () => {
    it('should call compressWithPdfLib for basic compression level', async () => {
      // Mock compressWithPdfLib
      const mockCompressWithPdfLib = jest.spyOn(service, 'compressWithPdfLib')
        .mockResolvedValue('temp/compressed-basic.pdf');
      
      // Call the service method
      const filePath = 'test.pdf';
      const result = await service.compressPdf(filePath, CompressionLevel.BASIC);
      
      // Assertions
      expect(result).toBe('temp/compressed-basic.pdf');
      expect(mockCompressWithPdfLib).toHaveBeenCalledWith(filePath);
    });

    it('should call compressWithGhostscript for strong compression level', async () => {
      // Mock compressWithGhostscript
      const mockCompressWithGhostscript = jest.spyOn(service, 'compressWithGhostscript')
        .mockResolvedValue('temp/compressed-strong.pdf');
      
      // Call the service method
      const filePath = 'test.pdf';
      const result = await service.compressPdf(filePath, CompressionLevel.STRONG);
      
      // Assertions
      expect(result).toBe('temp/compressed-strong.pdf');
      expect(mockCompressWithGhostscript).toHaveBeenCalledWith(filePath);
    });
  });
});
