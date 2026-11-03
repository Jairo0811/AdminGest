import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkflowsService } from './workflows.service';

describe('Project template tenant isolation', () => {
  it('rejects applying a template when tenant does not own the target project', async () => {
    const prisma = {
      projectTemplate: { findFirst: jest.fn().mockResolvedValue({
        id: 'template-a', companyId: 'company-a', stepsJson: '["Planificar"]',
      }) },
      project: { findFirst: jest.fn().mockResolvedValue(null) },
      projectTask: { createMany: jest.fn() },
    } as unknown as PrismaService;
    const service = new WorkflowsService(prisma);
    await expect(service.applyTemplate('company-a', 'template-a', 'project-b'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.projectTask.createMany).not.toHaveBeenCalled();
  });

  it('disallows unregistered events for automation rules', async () => {
    const prisma = { workflowRule: { upsert: jest.fn() } } as unknown as PrismaService;
    const service = new WorkflowsService(prisma);
    await expect(service.updateRule('company-a', 'RUN_SCRIPT', true))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.workflowRule.upsert).not.toHaveBeenCalled();
  });
});
