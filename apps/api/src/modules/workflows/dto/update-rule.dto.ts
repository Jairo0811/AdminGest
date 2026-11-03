import { IsBoolean } from 'class-validator';

export class UpdateRuleDto {
  @IsBoolean()
  enabled!: boolean;
}
