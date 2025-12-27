import { ClickhouseService } from '../database/clickhouse.service';
export declare class HealthController {
    private ch;
    constructor(ch: ClickhouseService);
    checkHealth(): Promise<{
        status: string;
        timestamp: string;
        database: string;
        uptime: number;
    }>;
}
