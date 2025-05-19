import { Module } from '@nestjs/common';
import { CompressController } from './compress.controller';
import { CompressService } from './compress.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [CompressController],
  providers: [CompressService],
})
export class CompressModule {}
