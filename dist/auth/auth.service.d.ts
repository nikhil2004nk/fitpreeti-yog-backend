import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClickhouseService } from '../database/clickhouse.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { User, UserLite } from '../common/interfaces/user.interface';
export declare class AuthService {
    private readonly ch;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private readonly saltRounds;
    constructor(ch: ClickhouseService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        data?: Partial<User>;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: Partial<User>;
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(phone: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findUserByPhonePublic(phone: string): Promise<UserLite | null>;
    validateRefreshToken(token: string): Promise<string | null>;
    private findUserByPhone;
    private findUserByEmail;
    private validateUserCredentials;
    private createRefreshToken;
    private revokeUserTokens;
}
