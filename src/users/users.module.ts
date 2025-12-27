import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ClickhouseModule } from '../database/clickhouse.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClickhouseModule,
    AuthModule, // This provides JwtModule and CookieJwtGuard
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
