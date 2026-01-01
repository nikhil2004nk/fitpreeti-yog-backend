"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const services_service_1 = require("./services.service");
const create_service_dto_1 = require("./dto/create-service.dto");
const update_service_dto_1 = require("./dto/update-service.dto");
const cookie_jwt_guard_1 = require("../auth/guards/cookie-jwt.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let ServicesController = class ServicesController {
    servicesService;
    constructor(servicesService) {
        this.servicesService = servicesService;
    }
    create(createServiceDto) {
        return this.servicesService.create(createServiceDto);
    }
    findAll(type) {
        return this.servicesService.findAll(type);
    }
    getPopularServices() {
        return this.servicesService.getPopularServices();
    }
    findOne(id) {
        return this.servicesService.findOne(id);
    }
    update(id, updateServiceDto) {
        return this.servicesService.update(id, updateServiceDto);
    }
    remove(id) {
        return this.servicesService.remove(id);
    }
    getServicesByType(type) {
        return this.servicesService.getServicesByType(type);
    }
};
exports.ServicesController = ServicesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(cookie_jwt_guard_1.CookieJwtGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiCookieAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new service (Admin only)' }),
    (0, swagger_1.ApiBody)({ type: create_service_dto_1.CreateServiceDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Service created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_service_dto_1.CreateServiceDto]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all services (Public)' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String, description: 'Filter by service type' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns all services' }),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('popular'),
    (0, swagger_1.ApiOperation)({ summary: 'Get popular services' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns popular services' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "getPopularServices", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a service by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Service UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns the service' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(cookie_jwt_guard_1.CookieJwtGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiCookieAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a service (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Service UUID' }),
    (0, swagger_1.ApiBody)({ type: update_service_dto_1.UpdateServiceDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_service_dto_1.UpdateServiceDto]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(cookie_jwt_guard_1.CookieJwtGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiCookieAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a service (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Service UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Service deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('type/:type'),
    (0, swagger_1.ApiOperation)({ summary: 'Get services by type' }),
    (0, swagger_1.ApiParam)({ name: 'type', type: String, description: 'Service type' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns services of the specified type' }),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "getServicesByType", null);
exports.ServicesController = ServicesController = __decorate([
    (0, swagger_1.ApiTags)('Services'),
    (0, common_1.Controller)('services'),
    __metadata("design:paramtypes", [services_service_1.ServicesService])
], ServicesController);
//# sourceMappingURL=services.controller.js.map