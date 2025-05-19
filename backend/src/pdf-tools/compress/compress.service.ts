import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { spawn } from 'child_process';
import { FileService } from '../../shared/services/file.service';

export enum CompressionLevel {
  BASIC = 'basic',
  STRONG = 'strong',
}

@Injectable()
export class CompressService {
  private readonly logger = new Logger(CompressService.name);

  constructor(private readonly fileService: FileService) {}

  /**
   * Compresses a PDF file using pdf-lib (basic compression)
   * @param filePath Path to the PDF file
   * @returns Path to the compressed PDF file
   */
  async compressWithPdfLib(filePath: string): Promise<string> {
    this.logger.log(`Compressing PDF with pdf-lib (basic): ${filePath}`);
    
    try {
      // Read the PDF file
      const pdfBytes = fs.readFileSync(filePath);
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes, {
        // Use lower-quality settings for compression
        updateMetadata: false,
      });
      
      // Save with compression options
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        // Use lower-quality settings for compression
        objectsPerTick: 100,
      });
      
      // Generate a unique filename for the compressed PDF
      const uniqueId = crypto.randomBytes(16).toString('hex');
      const outputPath = path.join('temp', `compressed-${uniqueId}.pdf`);
      
      // Write the compressed PDF to disk
      fs.writeFileSync(outputPath, compressedPdfBytes);
      
      this.logger.log(`Successfully compressed PDF to ${outputPath}`);
      this.logger.log(`Original size: ${pdfBytes.length} bytes, Compressed size: ${compressedPdfBytes.length} bytes`);
      
      return outputPath;
    } catch (error) {
      this.logger.error('Error compressing PDF with pdf-lib', error);
      throw error;
    }
  }

  /**
   * Compresses a PDF file using Ghostscript (strong compression)
   * @param filePath Path to the PDF file
   * @returns Path to the compressed PDF file
   */
  async compressWithGhostscript(filePath: string): Promise<string> {
    this.logger.log(`Compressing PDF with Ghostscript (strong): ${filePath}`);
    
    try {
      // Generate a unique filename for the compressed PDF
      const uniqueId = crypto.randomBytes(16).toString('hex');
      const outputPath = path.join('temp', `compressed-${uniqueId}.pdf`);
      
      // Use Ghostscript for stronger compression
      // Note: This requires Ghostscript to be installed on the system
      return new Promise<string>((resolve, reject) => {
        // Check if we're using Ghostscript or a fallback method
        if (this.isGhostscriptAvailable()) {
          this.logger.log('Using Ghostscript for compression');
          
          // Ghostscript command for PDF compression
          const gsProcess = spawn('gs', [
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            '-dPDFSETTINGS=/ebook', // Options: /screen, /ebook, /printer, /prepress, /default
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            `-sOutputFile=${outputPath}`,
            filePath
          ]);
          
          gsProcess.on('close', (code) => {
            if (code === 0) {
              this.logger.log(`Successfully compressed PDF to ${outputPath}`);
              
              // Log compression ratio
              const originalSize = fs.statSync(filePath).size;
              const compressedSize = fs.statSync(outputPath).size;
              this.logger.log(`Original size: ${originalSize} bytes, Compressed size: ${compressedSize} bytes`);
              
              resolve(outputPath);
            } else {
              reject(new Error(`Ghostscript process exited with code ${code}`));
            }
          });
          
          gsProcess.on('error', (error) => {
            this.logger.error('Error executing Ghostscript', error);
            reject(error);
          });
        } else {
          // Fallback to pdf-lib if Ghostscript is not available
          this.logger.log('Ghostscript not available, falling back to pdf-lib');
          this.compressWithPdfLib(filePath)
            .then(resolve)
            .catch(reject);
        }
      });
    } catch (error) {
      this.logger.error('Error compressing PDF with Ghostscript', error);
      throw error;
    }
  }

  /**
   * Checks if Ghostscript is available on the system
   * @returns True if Ghostscript is available, false otherwise
   */
  private isGhostscriptAvailable(): boolean {
    try {
      // Try to execute Ghostscript with version flag
      const result = spawn('gs', ['--version']);
      return true;
    } catch (error) {
      this.logger.warn('Ghostscript not available', error);
      return false;
    }
  }

  /**
   * Compresses a PDF file with the specified compression level
   * @param filePath Path to the PDF file
   * @param level Compression level (basic or strong)
   * @returns Path to the compressed PDF file
   */
  async compressPdf(filePath: string, level: CompressionLevel): Promise<string> {
    this.logger.log(`Compressing PDF with level ${level}: ${filePath}`);
    
    try {
      if (level === CompressionLevel.STRONG) {
        return this.compressWithGhostscript(filePath);
      } else {
        return this.compressWithPdfLib(filePath);
      }
    } catch (error) {
      this.logger.error(`Error compressing PDF with level ${level}`, error);
      throw error;
    }
  }
}
