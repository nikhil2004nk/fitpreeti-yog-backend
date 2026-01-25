import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { ServiceOption } from '../services/entities/service-option.entity';
import { AppSetting } from '../app-settings/entities/app-setting.entity';
import { InstituteInfo as InstituteInfoEntity } from '../institute-info/entities/institute-info.entity';
import { Review } from '../reviews/entities/review.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { ServiceMode, ServiceFrequency, ServiceAudience } from '../common/enums/service.enums';
import { AppSettingType } from '../common/enums/app-settings.enums';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);
  private readonly saltRounds = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(ServiceOption)
    private readonly optionRepo: Repository<ServiceOption>,
    @InjectRepository(AppSetting)
    private readonly settingRepo: Repository<AppSetting>,
    @InjectRepository(InstituteInfoEntity)
    private readonly instituteInfoRepo: Repository<InstituteInfoEntity>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  async run() {
    if (process.env.NODE_ENV === 'production') return;
    await this.seedAdmin();
    await this.seedServiceOptions();
    await this.seedServices();
    await this.seedAppSettings();
    await this.seedInstituteInfo();
    await this.seedApprovedReviews();
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

  private async seedServiceOptions() {
    const count = await this.optionRepo.count();
    if (count > 0) return;

    const categories = [
      { value: 'online', display_order: 1 },
      { value: 'offline', display_order: 2 },
      { value: 'corporate', display_order: 3 },
    ];
    for (const c of categories) {
      await this.optionRepo.save(this.optionRepo.create({ kind: 'category', value: c.value, parent: '', display_order: c.display_order }));
    }

    // 1️⃣ ONLINE · 2️⃣ OFFLINE · 3️⃣ CORPORATE — exact labels from spec; admin can add more via CRUD
    const formats: { parent: string; value: string; order: number }[] = [
      { parent: 'online', value: 'Private 1-to-1', order: 1 },
      { parent: 'online', value: 'Group Live Batch', order: 2 },
      { parent: 'online', value: 'Pre-recorded Program', order: 3 },
      { parent: 'online', value: 'Hybrid (Live + Recordings)', order: 4 },
      { parent: 'offline', value: 'Private at Studio', order: 1 },
      { parent: 'offline', value: 'Private at Home', order: 2 },
      { parent: 'offline', value: 'Group Studio Batch', order: 3 },
      { parent: 'offline', value: 'Workshop / Retreat', order: 4 },
      { parent: 'corporate', value: 'On-site Group Session', order: 1 },
      { parent: 'corporate', value: 'Online Corporate Session', order: 2 },
      { parent: 'corporate', value: 'Corporate Wellness Program (Monthly/Quarterly)', order: 3 },
      { parent: 'corporate', value: 'Corporate Workshop / Event', order: 4 },
    ];
    for (const f of formats) {
      await this.optionRepo.save(this.optionRepo.create({ kind: 'service_format', value: f.value, parent: f.parent, display_order: f.order }));
    }

    const yogaOnline = ['General Yoga', 'Hatha Yoga', 'Vinyasa Flow', 'Power Yoga', 'Ashtanga Yoga', 'Meditation & Pranayama', 'Prenatal Yoga', 'Postnatal Yoga', 'Weight Loss Yoga', 'Therapeutic / Healing Yoga', 'Beginner Yoga', 'Senior Yoga'];
    const yogaOffline = ['Traditional Hatha Yoga', 'Power Yoga', 'Ashtanga Yoga', 'Iyengar Yoga', 'Weight Loss Yoga', 'Spine & Back Care', 'Knee / Joint Therapy', 'Prenatal / Postnatal Yoga', 'Kids Yoga', 'Senior Citizen Yoga', 'Meditation & Breathwork'];
    const yogaCorporate = ['Stress Management Yoga', 'Desk Yoga', 'Posture Correction Yoga', 'Mental Wellness & Meditation', 'Breathwork for Productivity', 'Leadership Mindfulness Program', 'Burnout Recovery Program'];
    let order = 0;
    for (const v of yogaOnline) {
      await this.optionRepo.save(this.optionRepo.create({ kind: 'yoga_type', value: v, parent: 'online', display_order: ++order }));
    }
    order = 0;
    for (const v of yogaOffline) {
      await this.optionRepo.save(this.optionRepo.create({ kind: 'yoga_type', value: v, parent: 'offline', display_order: ++order }));
    }
    order = 0;
    for (const v of yogaCorporate) {
      await this.optionRepo.save(this.optionRepo.create({ kind: 'yoga_type', value: v, parent: 'corporate', display_order: ++order }));
    }
    this.logger.log('Seeded service options (categories, formats, yoga types)');
  }

  private async seedServices() {
    const count = await this.serviceRepo.count();
    if (count > 0) return;

    await this.serviceRepo.save([
      this.serviceRepo.create({
        name: 'Online Hatha Yoga - Private Session',
        slug: 'online-hatha-private',
        type: 'online',
        service_format: 'Private 1-to-1',
        mode: ServiceMode.LIVE,
        frequency: ServiceFrequency.SINGLE,
        audience: ServiceAudience.INDIVIDUAL,
        yoga_type: 'Hatha Yoga',
        duration_minutes: 60,
        price: 1500,
        max_capacity: 1,
      }),
      this.serviceRepo.create({
        name: 'Online Hatha Yoga - Group Class',
        slug: 'online-hatha-group',
        type: 'online',
        service_format: 'Group Live Batch',
        mode: ServiceMode.LIVE,
        frequency: ServiceFrequency.SINGLE,
        audience: ServiceAudience.GROUP,
        yoga_type: 'Hatha Yoga',
        duration_minutes: 60,
        price: 500,
        max_capacity: 20,
      }),
      this.serviceRepo.create({
        name: 'Online Vinyasa Flow - Private',
        slug: 'online-vinyasa-private',
        type: 'online',
        service_format: 'Private 1-to-1',
        mode: ServiceMode.LIVE,
        frequency: ServiceFrequency.SINGLE,
        audience: ServiceAudience.INDIVIDUAL,
        yoga_type: 'Vinyasa Flow',
        duration_minutes: 75,
        price: 1800,
        max_capacity: 1,
      }),
      this.serviceRepo.create({
        name: 'Offline Power Yoga - Group',
        slug: 'offline-power-group',
        type: 'offline',
        service_format: 'Group Studio Batch',
        mode: ServiceMode.ONSITE,
        frequency: ServiceFrequency.SINGLE,
        audience: ServiceAudience.GROUP,
        yoga_type: 'Power Yoga',
        duration_minutes: 90,
        price: 800,
        max_capacity: 15,
      }),
    ]);
    this.logger.log('Seeded sample services');
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

  private async seedInstituteInfo() {
    const count = await this.instituteInfoRepo.count();
    if (count > 0) return;

    await this.instituteInfoRepo.save(
      this.instituteInfoRepo.create({
        location: '123 Yoga Street, Wellness City, YC 12345',
        phone_numbers: ['+1-555-YOGA-123', '+1-555-YOGA-456'],
        email: 'info@fitpreeti-yog.institute',
        social_media: {
          facebook: 'https://facebook.com/fitpreeti-yoga',
          instagram: 'https://instagram.com/fitpreeti_yoga',
          youtube: 'https://youtube.com/@fitpreeti-yoga'
        },
      }),
    );
    this.logger.log('Seeded institute contact information');
  }

  private async seedApprovedReviews() {
    const count = await this.reviewRepo.count();
    if (count > 0) return;

    // Get the admin user for reviews (since reviews require a user_id)
    const adminUser = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
    if (!adminUser) {
      this.logger.warn('No admin user found for seeding reviews, skipping review seeding');
      return;
    }

    await this.reviewRepo.save([
      this.reviewRepo.create({
        user_id: adminUser.id,
        rating: 5,
        comment: 'Excellent yoga classes! The instructors are very knowledgeable and the environment is peaceful. Highly recommend for anyone looking to improve their yoga practice.',
        reviewer_type: 'customer',
        is_approved: true,
      }),
      this.reviewRepo.create({
        user_id: adminUser.id,
        rating: 5,
        comment: 'Amazing experience! The personalized attention and variety of classes make this the perfect place for both beginners and advanced practitioners.',
        reviewer_type: 'customer',
        is_approved: true,
      }),
      this.reviewRepo.create({
        user_id: adminUser.id,
        rating: 4,
        comment: 'Great studio with wonderful teachers. The online classes are also very convenient. Would love to see more advanced workshops.',
        reviewer_type: 'customer',
        is_approved: true,
      }),
      this.reviewRepo.create({
        user_id: adminUser.id,
        rating: 5,
        comment: 'Transformative yoga journey! The community here is supportive and the teaching quality is outstanding. Five stars!',
        reviewer_type: 'customer',
        is_approved: true,
      }),
    ]);
    this.logger.log('Seeded sample approved reviews');
  }
}
