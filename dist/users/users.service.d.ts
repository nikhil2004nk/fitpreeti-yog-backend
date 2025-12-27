import { ClickhouseService } from '../database/clickhouse.service';
export declare class UsersService {
    private ch;
    constructor(ch: ClickhouseService);
    findAll(): Promise<any>;
    findOne(phone: string): Promise<any>;
    updateRole(phone: string, role: string): Promise<any>;
}
