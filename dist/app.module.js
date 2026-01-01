"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const services_module_1 = require("./services/services.module");
const bookings_module_1 = require("./bookings/bookings.module");
const users_module_1 = require("./users/users.module");
const health_module_1 = require("./health/health.module");
const trainers_module_1 = require("./trainers/trainers.module");
const class_schedule_module_1 = require("./class-schedule/class-schedule.module");
const reviews_module_1 = require("./reviews/reviews.module");
const institute_info_module_1 = require("./institute-info/institute-info.module");
const content_sections_module_1 = require("./content-sections/content-sections.module");
const attendance_module_1 = require("./attendance/attendance.module");
const clickhouse_module_1 = require("./database/clickhouse.module");
const env_validation_1 = require("./config/env.validation");
const isDevelopment = process.env.NODE_ENV !== 'production';
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                validate: env_validation_1.validate,
                cache: true,
            }),
            ...(isDevelopment ? [] : [
                throttler_1.ThrottlerModule.forRootAsync({
                    imports: [config_1.ConfigModule],
                    inject: [config_1.ConfigService],
                    useFactory: (configService) => {
                        return [
                            {
                                ttl: 60000,
                                limit: 100,
                            },
                            {
                                name: 'auth',
                                ttl: 900000,
                                limit: 5,
                            },
                        ];
                    },
                }),
            ]),
            clickhouse_module_1.ClickhouseModule,
            auth_module_1.AuthModule,
            services_module_1.ServicesModule,
            bookings_module_1.BookingsModule,
            users_module_1.UsersModule,
            health_module_1.HealthModule,
            trainers_module_1.TrainersModule,
            class_schedule_module_1.ClassScheduleModule,
            reviews_module_1.ReviewsModule,
            institute_info_module_1.InstituteInfoModule,
            content_sections_module_1.ContentSectionsModule,
            attendance_module_1.AttendanceModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            ...(isDevelopment ? [] : [
                {
                    provide: core_1.APP_GUARD,
                    useFactory: (options, storageService, reflector) => {
                        return new throttler_1.ThrottlerGuard(options, storageService, reflector);
                    },
                    inject: ['THROTTLER:MODULE_OPTIONS', throttler_1.ThrottlerStorage, core_1.Reflector],
                },
            ]),
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map