import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync, Min, Max } from 'class-validator';
import { InternalServerErrorException } from '@nestjs/common';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string = '1h';

  @IsString()
  ACCESS_TOKEN_EXPIRES_IN: string = '15m';

  @IsString()
  DB_HOST: string = 'localhost';

  @IsNumber()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 3306;

  @IsString()
  DB_USERNAME: string = 'root';

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string = 'fitpreeti_dev';

  @IsString()
  FRONTEND_URL: string = 'http://localhost:3001';

  @IsNumber()
  @Min(1)
  @Max(20)
  BCRYPT_SALT_ROUNDS: number = 12;

  @IsString()
  API_PREFIX: string = '/api/v1';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const missingVars = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');
    throw new InternalServerErrorException(`Environment validation failed: ${missingVars}`);
  }

  return validatedConfig;
}

