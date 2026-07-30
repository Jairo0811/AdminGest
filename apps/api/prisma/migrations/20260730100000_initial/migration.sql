BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[Company] (
    [id] NVARCHAR(36) NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [taxId] NVARCHAR(30),
    [email] NVARCHAR(254),
    [phone] NVARCHAR(30),
    [address] NVARCHAR(500),
    [logoUrl] NVARCHAR(500),
    [currency] NVARCHAR(3) NOT NULL CONSTRAINT [Company_currency_df] DEFAULT 'DOP',
    [timezone] NVARCHAR(64) NOT NULL CONSTRAINT [Company_timezone_df] DEFAULT 'America/Santo_Domingo',
    [isActive] BIT NOT NULL CONSTRAINT [Company_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Company_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Company_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Company_taxId_key] UNIQUE NONCLUSTERED ([taxId])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(36) NOT NULL,
    [companyId] NVARCHAR(36) NOT NULL,
    [email] NVARCHAR(254) NOT NULL,
    [passwordHash] NVARCHAR(100) NOT NULL,
    [firstName] NVARCHAR(60) NOT NULL,
    [lastName] NVARCHAR(60) NOT NULL,
    [role] NVARCHAR(32) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'SALES_REP',
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [User_status_df] DEFAULT 'ACTIVE',
    [lastLoginAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Lead] (
    [id] NVARCHAR(36) NOT NULL,
    [companyId] NVARCHAR(36) NOT NULL,
    [ownerId] NVARCHAR(36),
    [firstName] NVARCHAR(60) NOT NULL,
    [lastName] NVARCHAR(60),
    [companyName] NVARCHAR(150),
    [jobTitle] NVARCHAR(100),
    [email] NVARCHAR(254),
    [phone] NVARCHAR(30),
    [source] NVARCHAR(80),
    [status] NVARCHAR(24) NOT NULL CONSTRAINT [Lead_status_df] DEFAULT 'NEW',
    [priority] INT NOT NULL CONSTRAINT [Lead_priority_df] DEFAULT 2,
    [notes] NVARCHAR(2000),
    [convertedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Lead_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Lead_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Customer] (
    [id] NVARCHAR(36) NOT NULL,
    [companyId] NVARCHAR(36) NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [taxId] NVARCHAR(30),
    [email] NVARCHAR(254),
    [phone] NVARCHAR(30),
    [address] NVARCHAR(500),
    [website] NVARCHAR(500),
    [isActive] BIT NOT NULL CONSTRAINT [Customer_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Customer_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Customer_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Customer_companyId_taxId_key] UNIQUE NONCLUSTERED ([companyId],[taxId])
);

-- CreateTable
CREATE TABLE [dbo].[Contact] (
    [id] NVARCHAR(36) NOT NULL,
    [customerId] NVARCHAR(36) NOT NULL,
    [firstName] NVARCHAR(60) NOT NULL,
    [lastName] NVARCHAR(60),
    [jobTitle] NVARCHAR(100),
    [email] NVARCHAR(254),
    [phone] NVARCHAR(30),
    [isPrimary] BIT NOT NULL CONSTRAINT [Contact_isPrimary_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Contact_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Contact_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PipelineStage] (
    [id] NVARCHAR(36) NOT NULL,
    [companyId] NVARCHAR(36) NOT NULL,
    [name] NVARCHAR(80) NOT NULL,
    [position] INT NOT NULL,
    [probability] INT NOT NULL CONSTRAINT [PipelineStage_probability_df] DEFAULT 0,
    [isWon] BIT NOT NULL CONSTRAINT [PipelineStage_isWon_df] DEFAULT 0,
    [isLost] BIT NOT NULL CONSTRAINT [PipelineStage_isLost_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PipelineStage_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PipelineStage_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PipelineStage_companyId_position_key] UNIQUE NONCLUSTERED ([companyId],[position])
);

-- CreateTable
CREATE TABLE [dbo].[Opportunity] (
    [id] NVARCHAR(36) NOT NULL,
    [companyId] NVARCHAR(36) NOT NULL,
    [customerId] NVARCHAR(36) NOT NULL,
    [ownerId] NVARCHAR(36),
    [pipelineStageId] NVARCHAR(36) NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [description] NVARCHAR(2000),
    [estimatedValue] DECIMAL(18,2) NOT NULL CONSTRAINT [Opportunity_estimatedValue_df] DEFAULT 0,
    [probability] INT NOT NULL CONSTRAINT [Opportunity_probability_df] DEFAULT 0,
    [expectedCloseDate] DATETIME2,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Opportunity_status_df] DEFAULT 'OPEN',
    [lostReason] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Opportunity_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Opportunity_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Activity] (
    [id] NVARCHAR(36) NOT NULL,
    [companyId] NVARCHAR(36) NOT NULL,
    [customerId] NVARCHAR(36),
    [opportunityId] NVARCHAR(36),
    [ownerId] NVARCHAR(36),
    [type] NVARCHAR(24) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Activity_status_df] DEFAULT 'PENDING',
    [subject] NVARCHAR(150) NOT NULL,
    [description] NVARCHAR(2000),
    [scheduledAt] DATETIME2 NOT NULL,
    [completedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Activity_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Activity_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CatalogItem] (
    [id] NVARCHAR(36) NOT NULL,
    [companyId] NVARCHAR(36) NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [description] NVARCHAR(2000),
    [type] NVARCHAR(20) NOT NULL,
    [unitPrice] DECIMAL(18,2) NOT NULL,
    [taxRate] DECIMAL(5,2) NOT NULL CONSTRAINT [CatalogItem_taxRate_df] DEFAULT 18,
    [isActive] BIT NOT NULL CONSTRAINT [CatalogItem_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CatalogItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [CatalogItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Quote] (
    [id] NVARCHAR(36) NOT NULL,
    [companyId] NVARCHAR(36) NOT NULL,
    [customerId] NVARCHAR(36) NOT NULL,
    [opportunityId] NVARCHAR(36),
    [number] NVARCHAR(30) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Quote_status_df] DEFAULT 'DRAFT',
    [issueDate] DATETIME2 NOT NULL CONSTRAINT [Quote_issueDate_df] DEFAULT CURRENT_TIMESTAMP,
    [validUntil] DATETIME2,
    [subtotal] DECIMAL(18,2) NOT NULL CONSTRAINT [Quote_subtotal_df] DEFAULT 0,
    [discount] DECIMAL(18,2) NOT NULL CONSTRAINT [Quote_discount_df] DEFAULT 0,
    [tax] DECIMAL(18,2) NOT NULL CONSTRAINT [Quote_tax_df] DEFAULT 0,
    [total] DECIMAL(18,2) NOT NULL CONSTRAINT [Quote_total_df] DEFAULT 0,
    [notes] NVARCHAR(2000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Quote_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Quote_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Quote_companyId_number_key] UNIQUE NONCLUSTERED ([companyId],[number])
);

-- CreateTable
CREATE TABLE [dbo].[QuoteItem] (
    [id] NVARCHAR(36) NOT NULL,
    [quoteId] NVARCHAR(36) NOT NULL,
    [catalogItemId] NVARCHAR(36),
    [description] NVARCHAR(500) NOT NULL,
    [quantity] DECIMAL(18,2) NOT NULL CONSTRAINT [QuoteItem_quantity_df] DEFAULT 1,
    [unitPrice] DECIMAL(18,2) NOT NULL,
    [taxRate] DECIMAL(5,2) NOT NULL CONSTRAINT [QuoteItem_taxRate_df] DEFAULT 18,
    [lineTotal] DECIMAL(18,2) NOT NULL,
    CONSTRAINT [QuoteItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [id] NVARCHAR(36) NOT NULL,
    [companyId] NVARCHAR(36) NOT NULL,
    [customerId] NVARCHAR(36) NOT NULL,
    [opportunityId] NVARCHAR(36),
    [managerId] NVARCHAR(36),
    [name] NVARCHAR(150) NOT NULL,
    [description] NVARCHAR(2000),
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Project_status_df] DEFAULT 'PLANNED',
    [startDate] DATETIME2,
    [endDate] DATETIME2,
    [budget] DECIMAL(18,2),
    [progress] INT NOT NULL CONSTRAINT [Project_progress_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Project_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Project_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Project_opportunityId_key] UNIQUE NONCLUSTERED ([opportunityId])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectTask] (
    [id] NVARCHAR(36) NOT NULL,
    [projectId] NVARCHAR(36) NOT NULL,
    [assigneeId] NVARCHAR(36),
    [parentId] NVARCHAR(36),
    [title] NVARCHAR(150) NOT NULL,
    [description] NVARCHAR(2000),
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [ProjectTask_status_df] DEFAULT 'PENDING',
    [priority] INT NOT NULL CONSTRAINT [ProjectTask_priority_df] DEFAULT 2,
    [startDate] DATETIME2,
    [dueDate] DATETIME2,
    [progress] INT NOT NULL CONSTRAINT [ProjectTask_progress_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProjectTask_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ProjectTask_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AuditLog] (
    [id] NVARCHAR(36) NOT NULL,
    [companyId] NVARCHAR(36) NOT NULL,
    [userId] NVARCHAR(36),
    [action] NVARCHAR(40) NOT NULL,
    [entity] NVARCHAR(80) NOT NULL,
    [entityId] NVARCHAR(36),
    [oldValues] NVARCHAR(4000),
    [newValues] NVARCHAR(4000),
    [ipAddress] NVARCHAR(64),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AuditLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_companyId_status_idx] ON [dbo].[User]([companyId], [status]);
CREATE NONCLUSTERED INDEX [User_companyId_role_idx] ON [dbo].[User]([companyId], [role]);
CREATE NONCLUSTERED INDEX [Lead_companyId_status_idx] ON [dbo].[Lead]([companyId], [status]);
CREATE NONCLUSTERED INDEX [Lead_ownerId_idx] ON [dbo].[Lead]([ownerId]);
CREATE NONCLUSTERED INDEX [Customer_companyId_name_idx] ON [dbo].[Customer]([companyId], [name]);
CREATE NONCLUSTERED INDEX [Contact_customerId_idx] ON [dbo].[Contact]([customerId]);
CREATE NONCLUSTERED INDEX [PipelineStage_companyId_idx] ON [dbo].[PipelineStage]([companyId]);
CREATE NONCLUSTERED INDEX [Opportunity_companyId_status_idx] ON [dbo].[Opportunity]([companyId], [status]);
CREATE NONCLUSTERED INDEX [Opportunity_customerId_idx] ON [dbo].[Opportunity]([customerId]);
CREATE NONCLUSTERED INDEX [Opportunity_ownerId_idx] ON [dbo].[Opportunity]([ownerId]);
CREATE NONCLUSTERED INDEX [Opportunity_pipelineStageId_idx] ON [dbo].[Opportunity]([pipelineStageId]);
CREATE NONCLUSTERED INDEX [Activity_companyId_scheduledAt_idx] ON [dbo].[Activity]([companyId], [scheduledAt]);
CREATE NONCLUSTERED INDEX [Activity_ownerId_status_idx] ON [dbo].[Activity]([ownerId], [status]);
CREATE NONCLUSTERED INDEX [CatalogItem_companyId_isActive_idx] ON [dbo].[CatalogItem]([companyId], [isActive]);
CREATE NONCLUSTERED INDEX [Quote_customerId_status_idx] ON [dbo].[Quote]([customerId], [status]);
CREATE NONCLUSTERED INDEX [QuoteItem_quoteId_idx] ON [dbo].[QuoteItem]([quoteId]);
CREATE NONCLUSTERED INDEX [Project_companyId_status_idx] ON [dbo].[Project]([companyId], [status]);
CREATE NONCLUSTERED INDEX [Project_customerId_idx] ON [dbo].[Project]([customerId]);
CREATE NONCLUSTERED INDEX [ProjectTask_projectId_status_idx] ON [dbo].[ProjectTask]([projectId], [status]);
CREATE NONCLUSTERED INDEX [ProjectTask_assigneeId_idx] ON [dbo].[ProjectTask]([assigneeId]);
CREATE NONCLUSTERED INDEX [ProjectTask_parentId_idx] ON [dbo].[ProjectTask]([parentId]);
CREATE NONCLUSTERED INDEX [AuditLog_companyId_createdAt_idx] ON [dbo].[AuditLog]([companyId], [createdAt]);
CREATE NONCLUSTERED INDEX [AuditLog_userId_idx] ON [dbo].[AuditLog]([userId]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Lead] ADD CONSTRAINT [Lead_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Lead] ADD CONSTRAINT [Lead_ownerId_fkey] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Customer] ADD CONSTRAINT [Customer_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Contact] ADD CONSTRAINT [Contact_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[PipelineStage] ADD CONSTRAINT [PipelineStage_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_ownerId_fkey] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_pipelineStageId_fkey] FOREIGN KEY ([pipelineStageId]) REFERENCES [dbo].[PipelineStage]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_opportunityId_fkey] FOREIGN KEY ([opportunityId]) REFERENCES [dbo].[Opportunity]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_ownerId_fkey] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[CatalogItem] ADD CONSTRAINT [CatalogItem_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Quote] ADD CONSTRAINT [Quote_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Quote] ADD CONSTRAINT [Quote_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Quote] ADD CONSTRAINT [Quote_opportunityId_fkey] FOREIGN KEY ([opportunityId]) REFERENCES [dbo].[Opportunity]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[QuoteItem] ADD CONSTRAINT [QuoteItem_quoteId_fkey] FOREIGN KEY ([quoteId]) REFERENCES [dbo].[Quote]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[QuoteItem] ADD CONSTRAINT [QuoteItem_catalogItemId_fkey] FOREIGN KEY ([catalogItemId]) REFERENCES [dbo].[CatalogItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_opportunityId_fkey] FOREIGN KEY ([opportunityId]) REFERENCES [dbo].[Opportunity]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_managerId_fkey] FOREIGN KEY ([managerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjectTask] ADD CONSTRAINT [ProjectTask_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjectTask] ADD CONSTRAINT [ProjectTask_assigneeId_fkey] FOREIGN KEY ([assigneeId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjectTask] ADD CONSTRAINT [ProjectTask_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[ProjectTask]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [AuditLog_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [AuditLog_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

