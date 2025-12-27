import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    create(createServiceDto: CreateServiceDto): Promise<import("./interfaces/service.interface").Service>;
    findAll(type?: string): Promise<import("./interfaces/service.interface").Service[]>;
    getPopularServices(): Promise<import("./interfaces/service.interface").Service[]>;
    findOne(id: string): Promise<import("./interfaces/service.interface").Service>;
    update(id: string, updateServiceDto: UpdateServiceDto): Promise<import("./interfaces/service.interface").Service>;
    remove(id: string): Promise<void>;
    getServicesByType(type: string): Promise<import("./interfaces/service.interface").Service[]>;
}
