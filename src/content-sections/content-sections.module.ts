import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentSection } from './entities/content-section.entity';
import { ContentSectionsController } from './content-sections.controller';
import { ContentSectionsService } from './content-sections.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentSection]),
    AuthModule,
  ],
  controllers: [ContentSectionsController],
  providers: [ContentSectionsService],
  exports: [ContentSectionsService],
})
export class ContentSectionsModule {}

