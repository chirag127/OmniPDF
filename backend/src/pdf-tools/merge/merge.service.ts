import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FileService } from '../../shared/services/file.service';

@Injectable()
export class MergeService {
  private readonly logger = new Logger(MergeService.name);

  constructor(private readonly fileService: FileService) {}

  /**
   * Merges multiple PDF files into a single PDF
   * @param filePaths Array of paths to the PDF files to merge
   * @returns Path to the merged PDF file
   */
  async mergePdfs(filePaths: string[]): Promise<string> {
    this.logger.log(`Merging ${filePaths.length} PDF files`);
    
    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Process each PDF file
      for (const filePath of filePaths) {
        // Read the PDF file
        const pdfBytes = fs.readFileSync(filePath);
        
        // Load the PDF document
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        // Copy all pages from the PDF document to the merged PDF
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      
      // Generate a unique filename for the merged PDF
      const uniqueId = crypto.randomBytes(16).toString('hex');
      const outputPath = path.join('temp', `merged-${uniqueId}.pdf`);
      
      // Write the merged PDF to disk
      fs.writeFileSync(outputPath, mergedPdfBytes);
      
      this.logger.log(`Successfully merged PDFs to ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      this.logger.error('Error merging PDFs', error);
      throw error;
    }
  }
}
