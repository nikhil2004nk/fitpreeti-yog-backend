// src/trainers/dto/update-trainer.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateTrainerDto } from './create-trainer.dto';

export class UpdateTrainerDto extends PartialType(CreateTrainerDto) {}