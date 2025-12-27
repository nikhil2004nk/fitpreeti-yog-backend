"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = exports.HttpExceptionResponse = void 0;
const common_1 = require("@nestjs/common");
class HttpExceptionResponse {
    statusCode;
    error;
    message;
    path;
    method;
    timestamp;
}
exports.HttpExceptionResponse = HttpExceptionResponse;
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let errorMessage = 'Internal server error';
        let validationErrors = [];
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const errorResponse = exception.getResponse();
            errorMessage = errorResponse.message || errorResponse;
            if (Array.isArray(errorMessage)) {
                validationErrors = errorMessage;
                errorMessage = 'Validation failed';
            }
        }
        const errorResponse = {
            statusCode: status,
            error: common_1.HttpStatus[status],
            message: validationErrors.length > 0 ? validationErrors : errorMessage,
            path: request.url,
            method: request.method,
            timestamp: new Date().toISOString(),
        };
        console.error({
            ...errorResponse,
            stack: exception instanceof Error ? exception.stack : undefined,
        });
        response.status(status).json(errorResponse);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map