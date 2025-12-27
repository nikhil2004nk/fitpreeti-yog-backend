import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickhouseService } from './clickhouse.service';
export declare class SchemaService implements OnModuleInit {
    private readonly ch;
    private readonly configService;
    private readonly logger;
    private readonly database;
    constructor(ch: ClickhouseService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    private initDatabase;
    private dropExistingTables;
    private initTables;
}
