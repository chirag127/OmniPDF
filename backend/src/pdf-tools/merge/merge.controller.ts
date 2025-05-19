import { 
  Controller, 
  Post, 
  UploadedFiles, 
  UseInterceptors, 
  BadRequestException, 
  Logger,
  Res,
  HttpStatus
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MergeService } from './merge.service';
import { FileService } from '../../shared/services/file.service';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';

@Controller('api/v1/pdf/merge')
export class MergeController {
  private readonly logger = new Logger(MergeController.name);

  constructor(
    private readonly mergeService: MergeService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 20, {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, callback) => {
      if (file.mimetype !== 'application/pdf') {
        return callback(new BadRequestException('Only PDF files are allowed'), false);
      }
      callback(null, true);
    },
  }))
  async mergePdfs(
    @UploadedFiles() files: Express.Multer.File[],
    @Res() res: Response,
  ) {
    try {
      // Validate input
      if (!files || files.length < 2) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ApiResponseDto.error('At least two PDF files are required for merging'),
        );
      }

      this.logger.log(`Received ${files.length} files for merging`);

      // Save uploaded files to temp directory
      const filePaths = await Promise.all(
        files.map(file => this.fileService.saveFile(file)),
      );

      // Merge PDFs
      const mergedPdfPath = await this.mergeService.mergePdfs(filePaths);

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');

      // Stream the file to the response
      const fileStream = this.fileService.getReadStream(mergedPdfPath);
      fileStream.pipe(res);

      // Clean up temporary files after response is sent
      fileStream.on('end', async () => {
        try {
          // Delete all temporary files
          await Promise.all([
            ...filePaths.map(filePath => this.fileService.deleteFile(filePath)),
            this.fileService.deleteFile(mergedPdfPath),
          ]);
          this.logger.log('Temporary files cleaned up');
        } catch (error) {
          this.logger.error('Error cleaning up temporary files', error);
        }
      });
    } catch (error) {
      this.logger.error('Error processing merge request', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        ApiResponseDto.error('Failed to merge PDF files', error.message),
      );
    }
  }
}
