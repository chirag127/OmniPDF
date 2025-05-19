import { Test, TestingModule } from '@nestjs/testing';
import { MergeService } from './merge.service';
import { FileService } from '../../shared/services/file.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('pdf-lib', () => {
  return {
    PDFDocument: {
      create: jest.fn().mockResolvedValue({
        copyPages: jest.fn().mockResolvedValue([{}, {}]),
        addPage: jest.fn(),
        save: jest.fn().mockResolvedValue(Buffer.from('test')),
      }),
      load: jest.fn().mockResolvedValue({
        getPageIndices: jest.fn().mockReturnValue([0, 1]),
      }),
    },
  };
});

describe('MergeService', () => {
  let service: MergeService;
  let fileService: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MergeService,
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

    service = module.get<MergeService>(MergeService);
    fileService = module.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mergePdfs', () => {
    it('should merge PDF files and return the path to the merged file', async () => {
      // Mock file system operations
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('test'));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      
      // Call the service method
      const filePaths = ['file1.pdf', 'file2.pdf'];
      const result = await service.mergePdfs(filePaths);
      
      // Assertions
      expect(result).toContain('temp/merged-');
      expect(result).toContain('.pdf');
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if reading a file fails', async () => {
      // Mock file system operations to throw an error
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });
      
      // Call the service method and expect it to throw
      const filePaths = ['file1.pdf', 'file2.pdf'];
      await expect(service.mergePdfs(filePaths)).rejects.toThrow('File not found');
    });
  });
});
