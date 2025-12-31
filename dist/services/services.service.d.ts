import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './interfaces/service.interface';
export declare class ServicesService {
    private ch;
    private configService;
    private readonly database;
    private readonly logger;
    constructor(ch: ClickhouseService, configService: ConfigService);
    create(createServiceDto: CreateServiceDto): Promise<Service>;
    findAll(type?: string): Promise<Service[]>;
    findOne(id: string): Promise<Service>;
    update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service>;
    remove(id: string): Promise<void>;
    getPopularServices(limit?: number): Promise<Service[]>;
    getServicesByType(type: string): Promise<Service[]>;
}
