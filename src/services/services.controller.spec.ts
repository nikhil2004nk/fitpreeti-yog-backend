import { Test, TestingModule } from '@nestjs/testing';
import { ServicesAdminController } from './services-admin.controller';
import { ServicesService } from './services.service';

describe('ServicesAdminController', () => {
  let controller: ServicesAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesAdminController],
      providers: [
        {
          provide: ServicesService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ServicesAdminController>(ServicesAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
