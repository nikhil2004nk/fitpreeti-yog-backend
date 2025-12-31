import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';
export declare class UsersService {
    private ch;
    private configService;
    private readonly database;
    constructor(ch: ClickhouseService, configService: ConfigService);
    findAll(): Promise<{
        id: string;
        phone: string;
        role: string;
        created_at: string;
    }[]>;
    findOne(phone: string): Promise<{
        id: string;
        phone: string;
        role: string;
        created_at: string;
    }>;
    updateRole(phone: string, role: string): Promise<{
        id: string;
        phone: string;
        role: string;
        created_at: string;
    }>;
}
