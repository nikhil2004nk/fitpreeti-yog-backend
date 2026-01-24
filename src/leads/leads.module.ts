import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { LeadActivity } from './entities/lead-activity.entity';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadsAdminController } from './leads-admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, LeadActivity]),
    AuthModule,
  ],
  providers: [LeadsService],
  controllers: [LeadsController, LeadsAdminController],
  exports: [LeadsService],
})
export class LeadsModule {}
