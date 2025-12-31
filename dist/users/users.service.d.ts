import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';
export declare class UsersService {
    private ch;
    private configService;
    private readonly database;
    constructor(ch: ClickhouseService, configService: ConfigService);
    findAll(): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        profile_image: string | null;
        is_active: boolean;
        last_login: string | null;
        created_at: string;
        updated_at: string;
    }[]>;
    findOne(phone: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        profile_image: string | null;
        is_active: boolean;
        last_login: string | null;
        created_at: string;
        updated_at: string;
    }>;
    updateRole(phone: string, role: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        profile_image: string | null;
        is_active: boolean;
        last_login: string | null;
        created_at: string;
        updated_at: string;
    }>;
}
