import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import {
  CustomerStatus,
  MembershipStatus,
  YogaExperienceLevel,
} from '../common/enums/customer.enums';
import { Lead } from '../leads/entities/lead.entity';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
    private readonly authService: AuthService,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    if (dto.user_id == null) {
      return this.createDirect(dto);
    }
    const c = this.repo.create({
      ...dto,
      country: dto.country ?? 'India',
    });
    if (dto.date_of_birth) c.date_of_birth = new Date(dto.date_of_birth);
    if (dto.membership_start_date) c.membership_start_date = new Date(dto.membership_start_date);
    if (dto.membership_end_date) c.membership_end_date = new Date(dto.membership_end_date);
    return this.repo.save(c);
  }

  private async createDirect(dto: CreateCustomerDto): Promise<Customer> {
    // Check if password is provided - if yes, create with active status and credentials
    const shouldCompleteOnboarding = dto.password && dto.password.length >= 8 && dto.email;
    
    if (shouldCompleteOnboarding) {
      // Create customer with onboarding status first
      const c = this.repo.create({
        full_name: dto.full_name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : null,
        gender: dto.gender ?? null,
        yoga_experience_level: dto.yoga_experience_level ?? null,
        preferred_class_type: dto.preferred_class_type ?? null,
        membership_status: dto.membership_status ?? MembershipStatus.ACTIVE,
        membership_start_date: dto.membership_start_date ? new Date(dto.membership_start_date) : null,
        membership_end_date: dto.membership_end_date ? new Date(dto.membership_end_date) : null,
        address_line1: dto.address_line1 ?? null,
        address_line2: dto.address_line2 ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        postal_code: dto.postal_code ?? null,
        country: dto.country ?? 'India',
        emergency_contact_name: dto.emergency_contact_name ?? null,
        emergency_contact_phone: dto.emergency_contact_phone ?? null,
        emergency_contact_relation: dto.emergency_contact_relation ?? null,
        medical_conditions: dto.medical_conditions ?? null,
        allergies: dto.allergies ?? null,
        current_medications: dto.current_medications ?? null,
        fitness_goals: dto.fitness_goals ?? null,
        previous_injuries: dto.previous_injuries ?? null,
        profile_image_url: dto.profile_image_url ?? null,
        status: CustomerStatus.ONBOARDING,
        onboarded_at: null,
      });
      const savedCustomer = await this.repo.save(c);
      
      // Immediately complete onboarding to create credentials and set status to active
      const email = (dto.email ?? '').trim().toLowerCase();
      if (!email) {
        throw new BadRequestException('Email is required when providing password');
      }
      
      const user = await this.authService.createUser(
        { 
          email, 
          password: dto.password!,
          name: dto.full_name || null,
          phone: dto.phone || null
        },
        UserRole.CUSTOMER,
      );
      
      savedCustomer.user_id = user.id;
      savedCustomer.email = email;
      savedCustomer.status = CustomerStatus.ACTIVE;
      savedCustomer.onboarded_at = new Date();
      
      return this.repo.save(savedCustomer);
    } else {
      // Create customer as draft/onboarding (no password provided)
      const c = this.repo.create({
        full_name: dto.full_name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : null,
        gender: dto.gender ?? null,
        yoga_experience_level: dto.yoga_experience_level ?? null,
        preferred_class_type: dto.preferred_class_type ?? null,
        membership_status: dto.membership_status ?? MembershipStatus.ACTIVE,
        membership_start_date: dto.membership_start_date ? new Date(dto.membership_start_date) : null,
        membership_end_date: dto.membership_end_date ? new Date(dto.membership_end_date) : null,
        address_line1: dto.address_line1 ?? null,
        address_line2: dto.address_line2 ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        postal_code: dto.postal_code ?? null,
        country: dto.country ?? 'India',
        emergency_contact_name: dto.emergency_contact_name ?? null,
        emergency_contact_phone: dto.emergency_contact_phone ?? null,
        emergency_contact_relation: dto.emergency_contact_relation ?? null,
        medical_conditions: dto.medical_conditions ?? null,
        allergies: dto.allergies ?? null,
        current_medications: dto.current_medications ?? null,
        fitness_goals: dto.fitness_goals ?? null,
        previous_injuries: dto.previous_injuries ?? null,
        profile_image_url: dto.profile_image_url ?? null,
        status: CustomerStatus.ONBOARDING,
        onboarded_at: null,
      });
      return this.repo.save(c);
    }
  }

  async createFromLead(lead: Lead): Promise<Customer> {
    const existing = await this.findByLeadId(lead.id);
    if (existing) return existing;

    // Validate required fields
    if (!lead.full_name || !lead.full_name.trim()) {
      throw new BadRequestException('Lead must have a full_name to create a customer');
    }

    const yogaLevel =
      lead.experience_level != null
        ? (lead.experience_level as unknown as YogaExperienceLevel)
        : null;

    const c = this.repo.create({
      lead_id: lead.id,
      full_name: lead.full_name.trim(),
      phone: lead.phone ?? null,
      email: lead.email ?? null,
      fitness_goals: lead.goals ?? null,
      medical_conditions: lead.health_conditions ?? null,
      yoga_experience_level: yogaLevel,
      preferred_class_type: lead.preferred_class_type ?? null,
      country: 'India',
      status: CustomerStatus.ONBOARDING,
      onboarded_at: null,
    });
    return this.repo.save(c);
  }

  async findByLeadId(leadId: number): Promise<Customer | null> {
    return this.repo.findOne({
      where: { lead_id: leadId },
      relations: ['user', 'lead'],
    });
  }

  async completeOnboarding(id: number, dto: CompleteOnboardingDto): Promise<Customer> {
    const c = await this.findOne(id);
    if (c.status !== CustomerStatus.ONBOARDING || c.user_id != null) {
      throw new BadRequestException('Customer is not in onboarding or already has credentials');
    }
    const email = (dto.email ?? c.email ?? c.lead?.email ?? '').trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Email is required to create login credentials');
    }
    const user = await this.authService.createUser(
      { 
        email, 
        password: dto.password,
        name: c.full_name || null,
        phone: c.phone || null
      },
      UserRole.CUSTOMER,
    );
    c.user_id = user.id;
    c.email = email;
    c.status = CustomerStatus.ACTIVE;
    c.onboarded_at = new Date();
    return this.repo.save(c);
  }

  async findAll(filters: { membership_status?: string; status?: string } = {}) {
    const where: Record<string, unknown> = {};
    if (filters.membership_status) where.membership_status = filters.membership_status;
    if (filters.status) where.status = filters.status;
    return this.repo.find({
      where,
      relations: ['user', 'lead'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['user', 'lead'],
    });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async findByUserId(userId: number) {
    return this.repo.findOne({
      where: { user_id: userId },
      relations: ['user', 'lead'],
    });
  }

  async update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const c = await this.findOne(id);
    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    ) as Partial<UpdateCustomerDto>;
    Object.assign(c, updates);
    if (updates.date_of_birth) c.date_of_birth = new Date(updates.date_of_birth);
    if (updates.membership_start_date) c.membership_start_date = new Date(updates.membership_start_date);
    if (updates.membership_end_date) c.membership_end_date = new Date(updates.membership_end_date);
    return this.repo.save(c);
  }

  async remove(id: number): Promise<void> {
    const c = await this.findOne(id);
    await this.repo.remove(c);
  }
}
