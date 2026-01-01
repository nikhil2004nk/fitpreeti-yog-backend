import { Module } from '@nestjs/common';
import { ContentSectionsController } from './content-sections.controller';
import { ContentSectionsService } from './content-sections.service';
import { ClickhouseModule } from '../database/clickhouse.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClickhouseModule,
    AuthModule,
  ],
  controllers: [ContentSectionsController],
  providers: [ContentSectionsService],
  exports: [ContentSectionsService],
})
export class ContentSectionsModule {}

