import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
interface UpdateOptions {
    table: string;
    setClause: string;
    whereClause: string;
    checkField?: string;
    expectedValue?: any;
    maxRetries?: number;
    retryDelayMs?: number;
}
export declare class ClickhouseService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private client;
    private database;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private isSelectQuery;
    query<T = any>(query: string): Promise<T>;
    insert(table: string, data: Record<string, any> | Record<string, any>[]): Promise<import("@clickhouse/client").InsertResult>;
    checkConnection(): Promise<boolean>;
    updateWithConsistency(options: UpdateOptions): Promise<{
        success: boolean;
        updated: any;
    }>;
}
export {};
