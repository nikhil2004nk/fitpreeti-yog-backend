import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClickhouseService } from '../database/clickhouse.service';
import type { Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { User, UserLite } from '../common/interfaces/user.interface';
import { SessionService } from './session.service';
export declare class AuthService {
    private readonly ch;
    private readonly jwtService;
    private readonly configService;
    private readonly sessionService;
    private readonly request;
    private readonly logger;
    private readonly saltRounds;
    private readonly database;
    constructor(ch: ClickhouseService, jwtService: JwtService, configService: ConfigService, sessionService: SessionService, request: Request);
    private checkPhoneExists;
    private checkEmailExists;
    register(dto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        data?: Partial<User>;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: UserLite;
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(refreshToken: string, accessToken?: string): Promise<{
        success: boolean;
    }>;
    findUserById(id: string): Promise<UserLite | null>;
    private findUserByPhone;
    findUserByPhonePublic(phone: string): Promise<UserLite | null>;
    private validateUserCredentials;
    validateRefreshToken(token: string): Promise<string | null>;
    private updateUserRefreshToken;
    private clearUserRefreshToken;
}
