import { IsIn } from 'class-validator';

export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DISQUALIFIED',
  'CONVERTED',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export class UpdateLeadStatusDto {
  @IsIn(LEAD_STATUSES)
  status!: LeadStatus;
}
