import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { ServiceOption } from '../services/entities/service-option.entity';
import { InstituteInfo as InstituteInfoEntity } from '../institute-info/entities/institute-info.entity';
import { Review } from '../reviews/entities/review.entity';
import { Trainer } from '../trainers/entities/trainer.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { ServiceMode, ServiceFrequency, ServiceAudience } from '../common/enums/service.enums';
import { RecurrenceType } from '../common/enums/schedule.enums';
import { CustomerStatus, MembershipStatus, CustomerGender, YogaExperienceLevel } from '../common/enums/customer.enums';
import { computeAvailableDates } from '../schedules/schedules.service';

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
    @InjectRepository(InstituteInfoEntity)
    private readonly instituteInfoRepo: Repository<InstituteInfoEntity>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Trainer)
    private readonly trainerRepo: Repository<Trainer>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
  ) {}

  async run() {
    // In production, only seed if database is empty (first run)
    if (process.env.NODE_ENV === 'production') {
      const userCount = await this.userRepo.count();
      if (userCount > 0) {
        this.logger.log('Production database already has data, skipping seed');
        return;
      }
      this.logger.warn('⚠️  Production database is empty - performing one-time seed');
    }
    
    await this.seedAdmin();
    await this.seedServiceOptions();
    await this.seedServices();
    await this.seedTrainer();
    await this.seedCustomers();
    await this.seedSchedules();
    await this.seedInstituteInfo();
    await this.seedApprovedReviews();
    
    if (process.env.NODE_ENV === 'production') {
      this.logger.log('✅ Production database seeded successfully (one-time operation)');
    }
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

  private async seedTrainer() {
    const count = await this.trainerRepo.count();
    if (count > 0) return;

    // Create a trainer user first
    const hash = await bcrypt.hash('Trainer@1234', this.saltRounds);
    const trainerUser = await this.userRepo.save(
      this.userRepo.create({
        email: 'trainer@yogaplatform.com',
        name: 'Priya Sharma',
        phone: '+91-9876543210',
        password_hash: hash,
        role: UserRole.TRAINER,
      }),
    );

    await this.trainerRepo.save(
      this.trainerRepo.create({
        user_id: trainerUser.id,
        full_name: 'Priya Sharma',
        phone: '+91-9876543210',
        gender: 'female',
        specialization: 'Hatha Yoga, Vinyasa Flow',
        yoga_styles: 'Hatha Yoga, Vinyasa Flow, Power Yoga, Meditation',
        experience_years: 8,
        certifications: 'RYT-500, Yoga Alliance Certified',
        designations: 'Senior Yoga Instructor',
        bio: 'Priya is a certified yoga instructor with 8+ years of experience in Hatha and Vinyasa yoga. She specializes in mindfulness and meditation practices.',
        is_available: true,
      }),
    );
    this.logger.log('Seeded trainer: trainer@yogaplatform.com / Trainer@1234');
  }

  private async seedCustomers() {
    const count = await this.customerRepo.count();
    if (count > 0) return;

    const customers = [
      {
        email: 'rahul.kumar@example.com',
        full_name: 'Rahul Kumar',
        phone: '+91-9811111111',
        gender: CustomerGender.MALE,
        date_of_birth: new Date('1990-05-15'),
        city: 'Mumbai',
        state: 'Maharashtra',
        yoga_experience_level: YogaExperienceLevel.BEGINNER,
        fitness_goals: 'Improve flexibility and reduce stress',
      },
      {
        email: 'sneha.patel@example.com',
        full_name: 'Sneha Patel',
        phone: '+91-9822222222',
        gender: CustomerGender.FEMALE,
        date_of_birth: new Date('1985-08-22'),
        city: 'Delhi',
        state: 'Delhi',
        yoga_experience_level: YogaExperienceLevel.INTERMEDIATE,
        fitness_goals: 'Weight loss and better posture',
      },
      {
        email: 'amit.singh@example.com',
        full_name: 'Amit Singh',
        phone: '+91-9833333333',
        gender: CustomerGender.MALE,
        date_of_birth: new Date('1995-12-10'),
        city: 'Bangalore',
        state: 'Karnataka',
        yoga_experience_level: YogaExperienceLevel.BEGINNER,
        fitness_goals: 'Build strength and improve mental clarity',
      },
      {
        email: 'priyanka.gupta@example.com',
        full_name: 'Priyanka Gupta',
        phone: '+91-9844444444',
        gender: CustomerGender.FEMALE,
        date_of_birth: new Date('1992-03-28'),
        city: 'Chennai',
        state: 'Tamil Nadu',
        yoga_experience_level: YogaExperienceLevel.ADVANCED,
        fitness_goals: 'Deepen yoga practice and become a teacher',
      },
    ];

    for (const c of customers) {
      // Create user for each customer
      const hash = await bcrypt.hash(`${c.full_name.split(' ')[0]}@123`, this.saltRounds);
      const user = await this.userRepo.save(
        this.userRepo.create({
          email: c.email,
          name: c.full_name,
          phone: c.phone,
          password_hash: hash,
          role: UserRole.CUSTOMER,
        }),
      );

      await this.customerRepo.save(
        this.customerRepo.create({
          user_id: user.id,
          email: c.email,
          full_name: c.full_name,
          phone: c.phone,
          gender: c.gender,
          date_of_birth: c.date_of_birth,
          city: c.city,
          state: c.state,
          yoga_experience_level: c.yoga_experience_level,
          fitness_goals: c.fitness_goals,
          status: CustomerStatus.ACTIVE,
          membership_status: MembershipStatus.INACTIVE,
          onboarded_at: new Date(),
        }),
      );
    }
    this.logger.log('Seeded 4 customers (passwords: FirstName@123)');
  }

  private async seedSchedules() {
    const count = await this.scheduleRepo.count();
    if (count > 0) return;

    const trainer = await this.trainerRepo.findOne({ where: { is_available: true } });
    if (!trainer) {
      this.logger.warn('No trainer found, skipping schedule seeding');
      return;
    }

    const services = await this.serviceRepo.find({ take: 4 });
    if (services.length === 0) {
      this.logger.warn('No services found, skipping schedule seeding');
      return;
    }

    const today = new Date();
    const effectiveFrom = new Date(today.getFullYear(), today.getMonth(), 1); // Start of current month
    const effectiveUntil = new Date(today.getFullYear(), today.getMonth() + 3, 0); // End of 3 months from now

    // Helper to format dates
    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

    // 1. DAILY schedule
    const dailySchedule = {
      service_id: services[0].id,
      trainer_id: trainer.id,
      name: 'Morning Hatha Yoga (Daily)',
      recurrence_type: RecurrenceType.DAILY,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
      day_of_month: null,
      custom_dates: null,
      start_time: '06:00:00',
      end_time: '07:00:00',
      effective_from: effectiveFrom,
      effective_until: effectiveUntil,
      max_participants: 20,
      location: 'Main Studio Hall',
      is_active: true,
    };
    dailySchedule['available_dates'] = computeAvailableDates({
      ...dailySchedule,
    });
    await this.scheduleRepo.save(this.scheduleRepo.create(dailySchedule));

    // 2. WEEKLY schedule (Mon, Wed, Fri)
    const weeklySchedule = {
      service_id: services[1]?.id || services[0].id,
      trainer_id: trainer.id,
      name: 'Evening Power Yoga (Mon/Wed/Fri)',
      recurrence_type: RecurrenceType.WEEKLY,
      monday: true,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: true,
      saturday: false,
      sunday: false,
      day_of_month: null,
      custom_dates: null,
      start_time: '18:00:00',
      end_time: '19:30:00',
      effective_from: effectiveFrom,
      effective_until: effectiveUntil,
      max_participants: 15,
      location: 'Main Studio Hall',
      is_active: true,
    };
    weeklySchedule['available_dates'] = computeAvailableDates({
      ...weeklySchedule,
    });
    await this.scheduleRepo.save(this.scheduleRepo.create(weeklySchedule));

    // 3. WEEKLY schedule (Sat/Sun)
    const weekendSchedule = {
      service_id: services[2]?.id || services[0].id,
      trainer_id: trainer.id,
      name: 'Weekend Vinyasa Flow (Sat/Sun)',
      recurrence_type: RecurrenceType.WEEKLY,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: true,
      sunday: true,
      day_of_month: null,
      custom_dates: null,
      start_time: '08:00:00',
      end_time: '09:30:00',
      effective_from: effectiveFrom,
      effective_until: effectiveUntil,
      max_participants: 25,
      location: 'Outdoor Yoga Deck',
      is_active: true,
    };
    weekendSchedule['available_dates'] = computeAvailableDates({
      ...weekendSchedule,
    });
    await this.scheduleRepo.save(this.scheduleRepo.create(weekendSchedule));

    // 4. MONTHLY schedule (15th of each month)
    const monthlySchedule = {
      service_id: services[3]?.id || services[0].id,
      trainer_id: trainer.id,
      name: 'Monthly Full Moon Meditation',
      recurrence_type: RecurrenceType.MONTHLY,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
      day_of_month: 15,
      custom_dates: null,
      start_time: '20:00:00',
      end_time: '21:30:00',
      effective_from: effectiveFrom,
      effective_until: effectiveUntil,
      max_participants: 30,
      location: 'Meditation Room',
      is_active: true,
    };
    monthlySchedule['available_dates'] = computeAvailableDates({
      ...monthlySchedule,
    });
    await this.scheduleRepo.save(this.scheduleRepo.create(monthlySchedule));

    // 5. CUSTOM schedule (specific workshop dates)
    const customDates = [
      toDateStr(new Date(today.getFullYear(), today.getMonth(), 10)),
      toDateStr(new Date(today.getFullYear(), today.getMonth(), 20)),
      toDateStr(new Date(today.getFullYear(), today.getMonth() + 1, 5)),
      toDateStr(new Date(today.getFullYear(), today.getMonth() + 1, 15)),
    ];
    const customSchedule = {
      service_id: services[0].id,
      trainer_id: trainer.id,
      name: 'Special Yoga Workshop (Custom Dates)',
      recurrence_type: RecurrenceType.CUSTOM,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
      day_of_month: null,
      custom_dates: customDates,
      start_time: '10:00:00',
      end_time: '13:00:00',
      effective_from: effectiveFrom,
      effective_until: effectiveUntil,
      max_participants: 10,
      location: 'Workshop Room',
      is_active: true,
    };
    customSchedule['available_dates'] = computeAvailableDates({
      ...customSchedule,
    });
    await this.scheduleRepo.save(this.scheduleRepo.create(customSchedule));

    this.logger.log('Seeded 5 schedules (daily, weekly MWF, weekend, monthly, custom)');
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
