import { Injectable, OnModuleInit } from '@nestjs/common';
import { SeedService } from './seed.service';

@Injectable()
export class BootstrapService implements OnModuleInit {
  constructor(private readonly seed: SeedService) {}

  async onModuleInit() {
    await this.seed.run();
  }
}
