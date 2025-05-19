import { Module } from '@nestjs/common';
import { MergeModule } from './merge/merge.module';
import { SplitModule } from './split/split.module';
import { CompressModule } from './compress/compress.module';

@Module({
  imports: [MergeModule, SplitModule, CompressModule],
})
export class PdfToolsModule {}
