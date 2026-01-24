import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { ServiceCategory } from '../service-categories/entities/service-category.entity';
import { Service } from '../services/entities/service.entity';
import { AppSetting } from '../app-settings/entities/app-setting.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { ServiceType, ServiceClassType } from '../common/enums/service.enums';
import { YogaStyle } from '../common/enums/yoga-style.enum';
import { AppSettingType } from '../common/enums/app-settings.enums';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);
  private readonly saltRounds = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ServiceCategory)
    private readonly categoryRepo: Repository<ServiceCategory>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(AppSetting)
    private readonly settingRepo: Repository<AppSetting>,
  ) {}

  async run() {
    if (process.env.NODE_ENV === 'production') return;
    await this.seedAdmin();
    await this.seedCategoriesAndServices();
    await this.seedAppSettings();
  }

  private async seedAdmin() {
    const count = await this.userRepo.count();
    if (count > 0) return;
    const hash = await bcrypt.hash('Admin@1234', this.saltRounds);
    await this.userRepo.save(
      this.userRepo.create({
        email: 'admin@yogaplatform.com',
        password_hash: hash,
        role: UserRole.ADMIN,
      }),
    );
    this.logger.log('Seeded default admin: admin@yogaplatform.com / Admin@1234');
  }

  private async seedCategoriesAndServices() {
    const count = await this.categoryRepo.count();
    if (count > 0) return;
    const online = await this.categoryRepo.save(
      this.categoryRepo.create({ name: 'Online Yoga', slug: 'online-yoga', parent_id: null, display_order: 1 }),
    );
    const offline = await this.categoryRepo.save(
      this.categoryRepo.create({ name: 'Offline Yoga', slug: 'offline-yoga', parent_id: null, display_order: 2 }),
    );
    const corp = await this.categoryRepo.save(
      this.categoryRepo.create({ name: 'Corporate Wellness', slug: 'corporate-wellness', parent_id: null, display_order: 3 }),
    );
    const hatha = await this.categoryRepo.save(
      this.categoryRepo.create({ name: 'Hatha Yoga', slug: 'hatha-yoga', parent_id: online.id, display_order: 1 }),
    );
    const vinyasa = await this.categoryRepo.save(
      this.categoryRepo.create({ name: 'Vinyasa Yoga', slug: 'vinyasa-yoga', parent_id: online.id, display_order: 2 }),
    );
    const power = await this.categoryRepo.save(
      this.categoryRepo.create({ name: 'Power Yoga', slug: 'power-yoga', parent_id: offline.id, display_order: 1 }),
    );
    const therapeutic = await this.categoryRepo.save(
      this.categoryRepo.create({ name: 'Therapeutic Yoga', slug: 'therapeutic-yoga', parent_id: offline.id, display_order: 2 }),
    );

    await this.serviceRepo.save([
      this.serviceRepo.create({
        category_id: hatha.id,
        name: 'Online Hatha Yoga - Private Session',
        slug: 'online-hatha-private',
        type: ServiceType.ONLINE,
        class_type: ServiceClassType.PRIVATE,
        yoga_style: YogaStyle.HATHA,
        duration_minutes: 60,
        price: 1500,
        max_capacity: 1,
      }),
      this.serviceRepo.create({
        category_id: hatha.id,
        name: 'Online Hatha Yoga - Group Class',
        slug: 'online-hatha-group',
        type: ServiceType.ONLINE,
        class_type: ServiceClassType.GROUP,
        yoga_style: YogaStyle.HATHA,
        duration_minutes: 60,
        price: 500,
        max_capacity: 20,
      }),
      this.serviceRepo.create({
        category_id: vinyasa.id,
        name: 'Online Vinyasa Flow - Private',
        slug: 'online-vinyasa-private',
        type: ServiceType.ONLINE,
        class_type: ServiceClassType.PRIVATE,
        yoga_style: YogaStyle.VINYASA,
        duration_minutes: 75,
        price: 1800,
        max_capacity: 1,
      }),
      this.serviceRepo.create({
        category_id: power.id,
        name: 'Offline Power Yoga - Group',
        slug: 'offline-power-group',
        type: ServiceType.OFFLINE,
        class_type: ServiceClassType.GROUP,
        yoga_style: YogaStyle.POWER,
        duration_minutes: 90,
        price: 800,
        max_capacity: 15,
      }),
    ]);
    this.logger.log('Seeded categories and sample services');
  }

  private async seedAppSettings() {
    const existing = await this.settingRepo.findOne({ where: { setting_key: 'site_name' } });
    if (existing) return;
    await this.settingRepo.save([
      this.settingRepo.create({
        setting_key: 'site_name',
        setting_value: 'Yoga Platform',
        setting_type: AppSettingType.STRING,
        description: 'Website name',
        is_public: true,
      }),
      this.settingRepo.create({
        setting_key: 'max_leads_per_day',
        setting_value: '100',
        setting_type: AppSettingType.NUMBER,
        description: 'Maximum leads allowed per day',
        is_public: false,
      }),
      this.settingRepo.create({
        setting_key: 'enable_online_payment',
        setting_value: 'true',
        setting_type: AppSettingType.BOOLEAN,
        description: 'Enable online payment gateway',
        is_public: false,
      }),
      this.settingRepo.create({
        setting_key: 'working_hours',
        setting_value: '{"start": "06:00", "end": "21:00"}',
        setting_type: AppSettingType.JSON,
        description: 'Platform working hours',
        is_public: true,
      }),
    ]);
    this.logger.log('Seeded app settings');
  }
}
