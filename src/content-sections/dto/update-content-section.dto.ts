import { PartialType } from '@nestjs/mapped-types';
import { CreateContentSectionDto } from './create-content-section.dto';

export class UpdateContentSectionDto extends PartialType(CreateContentSectionDto) {}

