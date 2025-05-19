import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly tempDir: string;
  private readonly tempFileExpiry: number;

  constructor(private readonly configService: ConfigService) {
    this.tempDir = this.configService.get<string>('fileUpload.tempDir', 'temp');
    this.tempFileExpiry = this.configService.get<number>('fileUpload.tempFileExpiry', 3600);
    
    // Ensure temp directory exists
    this.ensureTempDirExists();
    
    // Schedule cleanup of expired files
    this.scheduleCleanup();
  }

  /**
   * Ensures the temporary directory exists
   */
  private ensureTempDirExists(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      this.logger.log(`Created temporary directory: ${this.tempDir}`);
    }
  }

  /**
   * Schedules periodic cleanup of expired temporary files
   */
  private scheduleCleanup(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupExpiredFiles();
    }, 60 * 60 * 1000); // 1 hour
    
    // Also run cleanup on startup
    this.cleanupExpiredFiles();
  }

  /**
   * Cleans up expired temporary files
   */
  private cleanupExpiredFiles(): void {
    this.logger.log('Running cleanup of expired temporary files');
    
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        // Check if file is older than expiry time
        const fileAge = now - stats.mtimeMs;
        if (fileAge > this.tempFileExpiry * 1000) {
          fs.unlinkSync(filePath);
          this.logger.debug(`Deleted expired file: ${file}`);
        }
      }
      
      this.logger.log('Cleanup completed');
    } catch (error) {
      this.logger.error('Error during cleanup of expired files', error);
    }
  }

  /**
   * Saves a file to the temporary directory
   * @param file The file to save
   * @returns The path to the saved file
   */
  async saveFile(file: Express.Multer.File): Promise<string> {
    // Generate a unique filename
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const fileExt = path.extname(file.originalname);
    const filename = `${uniqueId}${fileExt}`;
    const filePath = path.join(this.tempDir, filename);
    
    // Write the file
    fs.writeFileSync(filePath, file.buffer);
    
    this.logger.debug(`Saved file: ${file.originalname} as ${filename}`);
    
    return filePath;
  }

  /**
   * Deletes a file from the temporary directory
   * @param filePath The path to the file to delete
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.debug(`Deleted file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Gets a readable stream for a file
   * @param filePath The path to the file
   * @returns A readable stream
   */
  getReadStream(filePath: string): fs.ReadStream {
    return fs.createReadStream(filePath);
  }

  /**
   * Gets a writable stream for a file
   * @param filePath The path to the file
   * @returns A writable stream
   */
  getWriteStream(filePath: string): fs.WriteStream {
    return fs.createWriteStream(filePath);
  }
}
