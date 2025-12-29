import { ClickhouseService } from '../database/clickhouse.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './interfaces/service.interface';
export declare class ServicesService {
    private ch;
    constructor(ch: ClickhouseService);
    create(createServiceDto: CreateServiceDto): Promise<Service>;
    findAll(type?: string): Promise<Service[]>;
    findOne(id: string): Promise<Service>;
    update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service>;
    remove(id: string): Promise<void>;
    getServicesByType(type: string): Promise<Service[]>;
    getPopularServices(): Promise<Service[]>;
}
