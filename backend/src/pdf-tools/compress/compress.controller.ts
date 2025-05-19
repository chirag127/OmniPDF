import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors, 
  BadRequestException, 
  Logger,
  Res,
  HttpStatus,
  Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CompressService, CompressionLevel } from './compress.service';
import { FileService } from '../../shared/services/file.service';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';

@Controller('api/v1/pdf/compress')
export class CompressController {
  private readonly logger = new Logger(CompressController.name);

  constructor(
    private readonly compressService: CompressService,
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
  async compressPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body('level') level: string = CompressionLevel.BASIC,
    @Res() res: Response,
  ) {
    try {
      // Validate input
      if (!file) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ApiResponseDto.error('No PDF file provided'),
        );
      }

      // Validate compression level
      if (!Object.values(CompressionLevel).includes(level as CompressionLevel)) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ApiResponseDto.error(`Invalid compression level. Valid values are: ${Object.values(CompressionLevel).join(', ')}`),
        );
      }

      this.logger.log(`Received file for compression: ${file.originalname}, Level: ${level}`);

      // Save uploaded file to temp directory
      const filePath = await this.fileService.saveFile(file);

      // Compress the PDF
      const compressedFilePath = await this.compressService.compressPdf(
        filePath, 
        level as CompressionLevel
      );

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="compressed.pdf"');

      // Stream the file to the response
      const fileStream = this.fileService.getReadStream(compressedFilePath);
      fileStream.pipe(res);

      // Clean up temporary files after response is sent
      fileStream.on('end', async () => {
        try {
          // Delete all temporary files
          await Promise.all([
            this.fileService.deleteFile(filePath),
            this.fileService.deleteFile(compressedFilePath),
          ]);
          this.logger.log('Temporary files cleaned up');
        } catch (error) {
          this.logger.error('Error cleaning up temporary files', error);
        }
      });
    } catch (error) {
      this.logger.error('Error processing compression request', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        ApiResponseDto.error('Failed to compress PDF file', error.message),
      );
    }
  }
}
