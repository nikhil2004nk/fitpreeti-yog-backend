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
var ClickhouseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickhouseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@clickhouse/client");
let ClickhouseService = ClickhouseService_1 = class ClickhouseService {
    configService;
    client;
    database;
    logger = new common_1.Logger(ClickhouseService_1.name);
    constructor(configService) {
        this.configService = configService;
        this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
    }
    async onModuleInit() {
        const config = {
            url: this.configService.get('CLICKHOUSE_URL'),
            username: this.configService.get('CLICKHOUSE_USERNAME', 'default'),
            password: this.configService.get('CLICKHOUSE_PASSWORD'),
            database: this.database,
        };
        this.logger.log('Initializing ClickHouse client with config:', {
            ...config,
            password: config.password ? '***' : undefined
        });
        const clickhouseSettings = {
            async_insert: 1,
            wait_for_async_insert: 1,
            output_format_json_quote_64bit_integers: 0,
            connect_timeout: 30
        };
        this.client = (0, client_1.createClient)({
            url: config.url,
            username: config.username,
            password: config.password,
            database: config.database,
            clickhouse_settings: clickhouseSettings,
            application: 'fitpreeti-yog-backend',
        });
        try {
            const result = await this.client.query({
                query: 'SELECT 1 as test',
                format: 'JSONEachRow',
            });
            const data = await result.json();
            this.logger.log('✅ ClickHouse connection test successful:', data);
        }
        catch (error) {
            this.logger.error('❌ Failed to connect to ClickHouse:', error);
            throw new common_1.ServiceUnavailableException('Failed to connect to ClickHouse database');
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.close();
            this.logger.log('🔌 ClickHouse connection closed');
        }
    }
    isSelectQuery(query) {
        const lowerQuery = query.trim().toLowerCase();
        return lowerQuery.startsWith('select');
    }
    async queryParams(query, params = {}) {
        if (!this.client) {
            throw new common_1.ServiceUnavailableException('Database service is not available');
        }
        try {
            const formattedQuery = query.trim();
            const upperQuery = formattedQuery.toUpperCase();
            if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('WITH')) {
                await this.client.exec({
                    query: formattedQuery,
                    query_params: params,
                    clickhouse_settings: { wait_end_of_query: 1 },
                });
                return { success: true };
            }
            let finalQuery = formattedQuery.replace(/;*$/, '').trim();
            finalQuery = finalQuery.replace(/\s+FORMAT\s+\w+/i, '').trim();
            this.logger.debug(`Executing parameterized query: ${finalQuery.substring(0, 100)}${finalQuery.length > 100 ? '...' : ''}`);
            const result = await this.client.query({
                query: finalQuery,
                query_params: params,
                format: 'JSONEachRow',
                clickhouse_settings: {
                    wait_end_of_query: 1,
                    output_format_json_quote_64bit_integers: 0,
                },
            });
            const data = await result.json();
            return (Array.isArray(data) ? data : []);
        }
        catch (error) {
            this.logger.error(`Parameterized query failed: ${query.substring(0, 100)}`, error.message);
            throw error;
        }
    }
    async query(query) {
        if (!this.client) {
            throw new common_1.ServiceUnavailableException('Database service is not available');
        }
        try {
            const formattedQuery = query.trim();
            const upperQuery = formattedQuery.toUpperCase();
            if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('WITH')) {
                if (upperQuery.startsWith('ALTER TABLE') && upperQuery.includes('UPDATE')) {
                    const tableMatch = formattedQuery.match(/ALTER TABLE\s+([^\s]+)/i);
                    const setMatch = formattedQuery.match(/UPDATE\s+(.+?)(?:\s+WHERE|$)/is);
                    const whereMatch = formattedQuery.match(/WHERE\s+(.+?)(?:\s*;?\s*)$/is);
                    if (tableMatch && setMatch) {
                        const table = tableMatch[1];
                        const setClause = setMatch[1].trim();
                        const whereClause = whereMatch ? whereMatch[1].trim() : '1=1';
                        const fieldMatch = setClause.match(/^(\w+)\s*=/);
                        const checkField = fieldMatch ? fieldMatch[1] : undefined;
                        let expectedValue;
                        if (checkField) {
                            const valueMatch = setClause.match(new RegExp(`${checkField}\\s*=\\s*([^,]+)`));
                            if (valueMatch) {
                                expectedValue = valueMatch[1].trim().replace(/^'|'$/g, '');
                            }
                        }
                        return this.updateWithConsistency({
                            table,
                            setClause,
                            whereClause,
                            checkField,
                            expectedValue,
                        });
                    }
                }
                await this.client.exec({
                    query: formattedQuery,
                    clickhouse_settings: { wait_end_of_query: 1 },
                });
                return { success: true };
            }
            let finalQuery = formattedQuery.replace(/;*$/, '').trim();
            finalQuery = finalQuery.replace(/\s+FORMAT\s+\w+/i, '').trim();
            this.logger.debug(`Executing: ${finalQuery.substring(0, 100)}${finalQuery.length > 100 ? '...' : ''}`);
            const result = await this.client.query({
                query: finalQuery,
                format: 'JSONEachRow',
                clickhouse_settings: {
                    wait_end_of_query: 1,
                    output_format_json_quote_64bit_integers: 0,
                },
            });
            const data = await result.json();
            return (Array.isArray(data) ? data : []);
        }
        catch (error) {
            this.logger.error(`Query failed: ${query.substring(0, 100)}`, error.message);
            throw error;
        }
    }
    async insert(table, data) {
        if (!this.client) {
            throw new common_1.ServiceUnavailableException('Database service is not available');
        }
        try {
            const result = await this.client.insert({
                table: `${this.database}.${table}`,
                values: Array.isArray(data) ? data : [data],
                format: 'JSONEachRow',
            });
            return result;
        }
        catch (error) {
            this.logger.error(`Insert failed into ${table}:`, error);
            throw error;
        }
    }
    async checkConnection() {
        try {
            const result = await this.query('SELECT 1 as test');
            return result && result['test'] === 1;
        }
        catch (error) {
            this.logger.error('Connection check failed:', error);
            return false;
        }
    }
    async updateWithConsistency(options) {
        const { table, setClause, whereClause, checkField, expectedValue, maxRetries = 5, retryDelayMs = 100 } = options;
        if (!this.client) {
            throw new common_1.ServiceUnavailableException('Database service is not available');
        }
        const updateQuery = `ALTER TABLE ${table} UPDATE ${setClause} WHERE ${whereClause}`;
        await this.client.exec({
            query: updateQuery,
            clickhouse_settings: { wait_end_of_query: 1 },
        });
        if (!checkField) {
            return { success: true, updated: null };
        }
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        let retries = 0;
        while (retries < maxRetries) {
            try {
                const selectQuery = `SELECT * FROM ${table} FINAL WHERE ${whereClause} LIMIT 1`;
                const result = await this.client.query({
                    query: selectQuery,
                    format: 'JSONEachRow',
                });
                const records = await result.json();
                if (records && records.length > 0) {
                    const updatedRecord = records[0];
                    if (expectedValue !== undefined) {
                        const actualValue = String(updatedRecord[checkField]);
                        if (actualValue !== String(expectedValue)) {
                            throw new common_1.InternalServerErrorException(`Field ${checkField} was not updated to ${expectedValue}, got ${actualValue}`);
                        }
                    }
                    return { success: true, updated: updatedRecord };
                }
            }
            catch (error) {
                this.logger.warn(`Update verification attempt ${retries + 1} failed:`, error.message);
            }
            retries++;
            if (retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
        }
        throw new common_1.InternalServerErrorException(`Failed to verify update after ${maxRetries} attempts`);
    }
};
exports.ClickhouseService = ClickhouseService;
exports.ClickhouseService = ClickhouseService = ClickhouseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClickhouseService);
//# sourceMappingURL=clickhouse.service.js.map