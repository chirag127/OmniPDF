import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors, 
  BadRequestException, 
  Logger,
  Res,
  HttpStatus,
  Body,
  ParseBoolPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { SplitService } from './split.service';
import { FileService } from '../../shared/services/file.service';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';

@Controller('api/v1/pdf/split')
export class SplitController {
  private readonly logger = new Logger(SplitController.name);

  constructor(
    private readonly splitService: SplitService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, callback) => {
      if (file.mimetype !== 'application/pdf') {
        return callback(new BadRequestException('Only PDF files are allowed'), false);
      }
      callback(null, true);
    },
  }))
  async splitPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body('ranges') ranges: string,
    @Body('extractAll', new DefaultValuePipe(false), ParseBoolPipe) extractAll: boolean,
    @Res() res: Response,
  ) {
    try {
      // Validate input
      if (!file) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ApiResponseDto.error('No PDF file provided'),
        );
      }

      this.logger.log(`Received file for splitting: ${file.originalname}`);

      // Save uploaded file to temp directory
      const filePath = await this.fileService.saveFile(file);

      let outputPath: string;
      let contentType: string;
      let filename: string;

      if (extractAll) {
        // Extract all pages
        outputPath = await this.splitService.extractAllPages(filePath);
        contentType = 'application/zip';
        filename = 'extracted-pages.zip';
      } else {
        // Validate ranges
        if (!ranges || ranges.trim() === '') {
          return res.status(HttpStatus.BAD_REQUEST).json(
            ApiResponseDto.error('Page ranges are required when not extracting all pages'),
          );
        }

        // Split PDF by ranges
        outputPath = await this.splitService.splitPdfByRange(filePath, ranges);
        contentType = 'application/pdf';
        filename = 'split.pdf';
      }

      // Set response headers for file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Stream the file to the response
      const fileStream = this.fileService.getReadStream(outputPath);
      fileStream.pipe(res);

      // Clean up temporary files after response is sent
      fileStream.on('end', async () => {
        try {
          // Delete all temporary files
          await Promise.all([
            this.fileService.deleteFile(filePath),
            this.fileService.deleteFile(outputPath),
          ]);
          this.logger.log('Temporary files cleaned up');
        } catch (error) {
          this.logger.error('Error cleaning up temporary files', error);
        }
      });
    } catch (error) {
      this.logger.error('Error processing split request', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        ApiResponseDto.error('Failed to split PDF file', error.message),
      );
    }
  }
}
