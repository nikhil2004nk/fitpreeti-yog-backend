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
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    configService;
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    isDevelopment;
    constructor(configService) {
        this.configService = configService;
        this.isDevelopment = process.env.NODE_ENV !== 'production';
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let errorMessage = 'Internal server error';
        let validationErrors = [];
        let errorType = 'Internal Server Error';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const errorResponse = exception.getResponse();
            if (typeof errorResponse === 'string') {
                errorMessage = errorResponse;
                errorType = this.getErrorTypeName(status);
            }
            else if (typeof errorResponse === 'object' && errorResponse !== null) {
                const errorObj = errorResponse;
                errorMessage = errorObj.message || errorResponse;
                errorType = errorObj.error || this.getErrorTypeName(status);
            }
            else {
                errorMessage = String(errorResponse);
                errorType = this.getErrorTypeName(status);
            }
            if (Array.isArray(errorMessage)) {
                validationErrors = errorMessage;
                errorMessage = 'Validation failed';
            }
        }
        else if (exception instanceof Error) {
            errorMessage = exception.message || 'Internal server error';
            errorType = 'Internal Server Error';
            this.logger.error('Unhandled error', exception.stack);
        }
        else {
            errorMessage = 'An unexpected error occurred';
            errorType = 'Internal Server Error';
            this.logger.error('Unknown error type', JSON.stringify(exception));
        }
        const errorResponse = {
            success: false,
            statusCode: status,
            error: errorType,
            message: validationErrors.length > 0 ? validationErrors : errorMessage,
            path: request.url,
            method: request.method,
            timestamp: new Date().toISOString(),
        };
        const logData = {
            ...errorResponse,
            ...(this.isDevelopment && exception instanceof Error ? { stack: exception.stack } : {}),
        };
        if (status >= 500) {
            this.logger.error(`[${status}] ${errorType}: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`, logData);
        }
        else if (status >= 400) {
            this.logger.warn(`[${status}] ${errorType}: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`, logData);
        }
        response.status(status).json(errorResponse);
    }
    getErrorTypeName(status) {
        const statusNames = {
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            405: 'Method Not Allowed',
            406: 'Not Acceptable',
            409: 'Conflict',
            410: 'Gone',
            411: 'Length Required',
            412: 'Precondition Failed',
            413: 'Payload Too Large',
            414: 'URI Too Long',
            415: 'Unsupported Media Type',
            416: 'Range Not Satisfiable',
            417: 'Expectation Failed',
            418: "I'm a teapot",
            422: 'Unprocessable Entity',
            423: 'Locked',
            424: 'Failed Dependency',
            425: 'Too Early',
            426: 'Upgrade Required',
            428: 'Precondition Required',
            429: 'Too Many Requests',
            431: 'Request Header Fields Too Large',
            451: 'Unavailable For Legal Reasons',
            500: 'Internal Server Error',
            501: 'Not Implemented',
            502: 'Bad Gateway',
            503: 'Service Unavailable',
            504: 'Gateway Timeout',
            505: 'HTTP Version Not Supported',
            506: 'Variant Also Negotiates',
            507: 'Insufficient Storage',
            508: 'Loop Detected',
            510: 'Not Extended',
            511: 'Network Authentication Required',
        };
        return statusNames[status] || common_1.HttpStatus[status] || 'Error';
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map