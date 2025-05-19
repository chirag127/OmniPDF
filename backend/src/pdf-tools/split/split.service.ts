import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as archiver from 'archiver';
import { FileService } from '../../shared/services/file.service';

interface PageRange {
  start: number;
  end: number;
}

@Injectable()
export class SplitService {
  private readonly logger = new Logger(SplitService.name);

  constructor(private readonly fileService: FileService) {}

  /**
   * Parses a page range string into an array of page ranges
   * @param rangeStr Page range string (e.g., "1-3,5,7-10")
   * @param pageCount Total number of pages in the PDF
   * @returns Array of page ranges
   */
  private parsePageRanges(rangeStr: string, pageCount: number): PageRange[] {
    if (!rangeStr || rangeStr.trim() === '') {
      throw new BadRequestException('Page range cannot be empty');
    }

    const ranges: PageRange[] = [];
    const parts = rangeStr.split(',');

    for (const part of parts) {
      const trimmedPart = part.trim();
      
      if (trimmedPart.includes('-')) {
        // Range (e.g., "1-3")
        const [startStr, endStr] = trimmedPart.split('-');
        const start = parseInt(startStr.trim(), 10);
        const end = parseInt(endStr.trim(), 10);
        
        if (isNaN(start) || isNaN(end)) {
          throw new BadRequestException(`Invalid page range: ${trimmedPart}`);
        }
        
        if (start < 1 || end > pageCount || start > end) {
          throw new BadRequestException(`Invalid page range: ${trimmedPart}. Pages must be between 1 and ${pageCount}, and start must be less than or equal to end.`);
        }
        
        ranges.push({ start, end });
      } else {
        // Single page (e.g., "5")
        const page = parseInt(trimmedPart, 10);
        
        if (isNaN(page)) {
          throw new BadRequestException(`Invalid page number: ${trimmedPart}`);
        }
        
        if (page < 1 || page > pageCount) {
          throw new BadRequestException(`Invalid page number: ${trimmedPart}. Pages must be between 1 and ${pageCount}.`);
        }
        
        ranges.push({ start: page, end: page });
      }
    }
    
    return ranges;
  }

  /**
   * Splits a PDF file based on page ranges
   * @param filePath Path to the PDF file
   * @param rangeStr Page range string (e.g., "1-3,5,7-10")
   * @returns Path to the split PDF file
   */
  async splitPdfByRange(filePath: string, rangeStr: string): Promise<string> {
    this.logger.log(`Splitting PDF by range: ${rangeStr}`);
    
    try {
      // Read the PDF file
      const pdfBytes = fs.readFileSync(filePath);
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Get the total number of pages
      const pageCount = pdfDoc.getPageCount();
      
      // Parse the page ranges
      const ranges = this.parsePageRanges(rangeStr, pageCount);
      
      // Create a new PDF document for the split PDF
      const splitPdf = await PDFDocument.create();
      
      // Copy pages from the original PDF to the split PDF
      for (const range of ranges) {
        for (let i = range.start - 1; i < range.end; i++) {
          const [copiedPage] = await splitPdf.copyPages(pdfDoc, [i]);
          splitPdf.addPage(copiedPage);
        }
      }
      
      // Save the split PDF
      const splitPdfBytes = await splitPdf.save();
      
      // Generate a unique filename for the split PDF
      const uniqueId = crypto.randomBytes(16).toString('hex');
      const outputPath = path.join('temp', `split-${uniqueId}.pdf`);
      
      // Write the split PDF to disk
      fs.writeFileSync(outputPath, splitPdfBytes);
      
      this.logger.log(`Successfully split PDF to ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      this.logger.error('Error splitting PDF', error);
      throw error;
    }
  }

  /**
   * Extracts all pages from a PDF into individual PDF files
   * @param filePath Path to the PDF file
   * @returns Path to the ZIP file containing all extracted pages
   */
  async extractAllPages(filePath: string): Promise<string> {
    this.logger.log('Extracting all pages from PDF');
    
    try {
      // Read the PDF file
      const pdfBytes = fs.readFileSync(filePath);
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Get the total number of pages
      const pageCount = pdfDoc.getPageCount();
      
      // Generate a unique ID for this extraction
      const uniqueId = crypto.randomBytes(16).toString('hex');
      
      // Create a directory for the extracted pages
      const extractDir = path.join('temp', `extract-${uniqueId}`);
      if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
      }
      
      // Extract each page to a separate PDF
      const extractedFilePaths: string[] = [];
      
      for (let i = 0; i < pageCount; i++) {
        // Create a new PDF document for the page
        const pagePdf = await PDFDocument.create();
        
        // Copy the page from the original PDF
        const [copiedPage] = await pagePdf.copyPages(pdfDoc, [i]);
        pagePdf.addPage(copiedPage);
        
        // Save the page PDF
        const pagePdfBytes = await pagePdf.save();
        
        // Generate a filename for the page PDF
        const pageFilename = `page-${i + 1}.pdf`;
        const pageFilePath = path.join(extractDir, pageFilename);
        
        // Write the page PDF to disk
        fs.writeFileSync(pageFilePath, pagePdfBytes);
        
        extractedFilePaths.push(pageFilePath);
      }
      
      // Create a ZIP file containing all extracted pages
      const zipFilePath = path.join('temp', `extracted-pages-${uniqueId}.zip`);
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });
      
      // Pipe the archive to the output file
      archive.pipe(output);
      
      // Add each extracted page to the archive
      for (let i = 0; i < extractedFilePaths.length; i++) {
        const pageFilePath = extractedFilePaths[i];
        const pageFilename = path.basename(pageFilePath);
        archive.file(pageFilePath, { name: pageFilename });
      }
      
      // Finalize the archive
      await archive.finalize();
      
      // Wait for the output stream to finish
      await new Promise<void>((resolve, reject) => {
        output.on('close', () => {
          // Clean up the extracted files
          for (const pageFilePath of extractedFilePaths) {
            fs.unlinkSync(pageFilePath);
          }
          fs.rmdirSync(extractDir);
          
          resolve();
        });
        output.on('error', (err) => {
          reject(err);
        });
      });
      
      this.logger.log(`Successfully extracted all pages to ${zipFilePath}`);
      
      return zipFilePath;
    } catch (error) {
      this.logger.error('Error extracting pages from PDF', error);
      throw error;
    }
  }
}
