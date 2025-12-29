import { ClickhouseService } from '../database/clickhouse.service';
export declare class UsersService {
    private ch;
    constructor(ch: ClickhouseService);
    private normalizePhone;
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
