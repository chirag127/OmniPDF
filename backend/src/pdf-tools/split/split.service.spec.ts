import { Test, TestingModule } from '@nestjs/testing';
import { SplitService } from './split.service';
import { FileService } from '../../shared/services/file.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as archiver from 'archiver';

jest.mock('fs');
jest.mock('archiver', () => {
  const mockArchiver = {
    pipe: jest.fn().mockReturnThis(),
    file: jest.fn().mockReturnThis(),
    finalize: jest.fn().mockResolvedValue(undefined),
  };
  return jest.fn().mockReturnValue(mockArchiver);
});

jest.mock('pdf-lib', () => {
  return {
    PDFDocument: {
      create: jest.fn().mockResolvedValue({
        copyPages: jest.fn().mockResolvedValue([{}]),
        addPage: jest.fn(),
        save: jest.fn().mockResolvedValue(Buffer.from('test')),
      }),
      load: jest.fn().mockResolvedValue({
        getPageCount: jest.fn().mockReturnValue(10),
        getPageIndices: jest.fn().mockReturnValue([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      }),
    },
  };
});

describe('SplitService', () => {
  let service: SplitService;
  let fileService: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SplitService,
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

    service = module.get<SplitService>(SplitService);
    fileService = module.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parsePageRanges', () => {
    it('should parse a simple page range', () => {
      const parsePageRanges = (service as any).parsePageRanges;
      const result = parsePageRanges('1-3', 10);
      expect(result).toEqual([{ start: 1, end: 3 }]);
    });

    it('should parse multiple page ranges', () => {
      const parsePageRanges = (service as any).parsePageRanges;
      const result = parsePageRanges('1-3,5,7-10', 10);
      expect(result).toEqual([
        { start: 1, end: 3 },
        { start: 5, end: 5 },
        { start: 7, end: 10 },
      ]);
    });

    it('should throw an error for invalid page ranges', () => {
      const parsePageRanges = (service as any).parsePageRanges;
      expect(() => parsePageRanges('1-3,5,7-11', 10)).toThrow(BadRequestException);
      expect(() => parsePageRanges('0-3', 10)).toThrow(BadRequestException);
      expect(() => parsePageRanges('3-1', 10)).toThrow(BadRequestException);
      expect(() => parsePageRanges('a-3', 10)).toThrow(BadRequestException);
    });
  });

  describe('splitPdfByRange', () => {
    it('should split a PDF by range and return the path to the split file', async () => {
      // Mock file system operations
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('test'));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      
      // Call the service method
      const filePath = 'test.pdf';
      const rangeStr = '1-3,5,7-10';
      const result = await service.splitPdfByRange(filePath, rangeStr);
      
      // Assertions
      expect(result).toContain('temp/split-');
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
      const rangeStr = '1-3';
      await expect(service.splitPdfByRange(filePath, rangeStr)).rejects.toThrow('File not found');
    });
  });

  describe('extractAllPages', () => {
    it('should extract all pages from a PDF and return the path to the ZIP file', async () => {
      // Mock file system operations
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('test'));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      (fs.createWriteStream as jest.Mock).mockReturnValue({
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'close') {
            setTimeout(callback, 0);
          }
          return this;
        }),
      });
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
      (fs.rmdirSync as jest.Mock).mockImplementation(() => {});
      
      // Call the service method
      const filePath = 'test.pdf';
      const result = await service.extractAllPages(filePath);
      
      // Assertions
      expect(result).toContain('temp/extracted-pages-');
      expect(result).toContain('.zip');
      expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
      expect(archiver).toHaveBeenCalledWith('zip', { zlib: { level: 9 } });
    });
  });
});
