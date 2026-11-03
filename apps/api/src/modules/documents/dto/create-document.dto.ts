import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const DOCUMENT_CATEGORIES = ['CONTRACT', 'PROPOSAL', 'DELIVERABLE', 'OTHER'] as const;

export class CreateDocumentDto {
  @IsString()
  @MaxLength(150)
  title!: string;

  @IsIn(DOCUMENT_CATEGORIES)
  category!: string;

  @IsString()
  @MaxLength(1500)
  url!: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;
}
