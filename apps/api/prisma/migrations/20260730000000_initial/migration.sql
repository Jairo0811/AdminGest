BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[Company] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(140) NOT NULL,
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
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [email] NVARCHAR(254) NOT NULL,
    [passwordHash] NVARCHAR(100) NOT NULL,
    [firstName] NVARCHAR(60) NOT NULL,
    [lastName] NVARCHAR(60) NOT NULL,
    [role] NVARCHAR(30) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'SALES_REP',
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [User_status_df] DEFAULT 'ACTIVE',
    [lastLoginAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Lead] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [ownerId] UNIQUEIDENTIFIER,
    [firstName] NVARCHAR(80) NOT NULL,
    [lastName] NVARCHAR(80),
    [companyName] NVARCHAR(140),
    [jobTitle] NVARCHAR(100),
    [email] NVARCHAR(254),
    [phone] NVARCHAR(30),
    [source] NVARCHAR(80),
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Lead_status_df] DEFAULT 'NEW',
    [priority] INT NOT NULL CONSTRAINT [Lead_priority_df] DEFAULT 2,
    [notes] NVARCHAR(max),
    [convertedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Lead_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Lead_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Customer] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(160) NOT NULL,
    [taxId] NVARCHAR(30),
    [email] NVARCHAR(254),
    [phone] NVARCHAR(30),
    [address] NVARCHAR(500),
    [website] NVARCHAR(500),
    [isActive] BIT NOT NULL CONSTRAINT [Customer_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Customer_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Customer_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Contact] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [customerId] UNIQUEIDENTIFIER NOT NULL,
    [firstName] NVARCHAR(80) NOT NULL,
    [lastName] NVARCHAR(80),
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
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
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
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [customerId] UNIQUEIDENTIFIER NOT NULL,
    [ownerId] UNIQUEIDENTIFIER,
    [pipelineStageId] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(180) NOT NULL,
    [description] NVARCHAR(max),
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
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [customerId] UNIQUEIDENTIFIER,
    [opportunityId] UNIQUEIDENTIFIER,
    [ownerId] UNIQUEIDENTIFIER,
    [type] NVARCHAR(30) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Activity_status_df] DEFAULT 'PENDING',
    [subject] NVARCHAR(180) NOT NULL,
    [description] NVARCHAR(max),
    [scheduledAt] DATETIME2 NOT NULL,
    [completedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Activity_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Activity_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CatalogItem] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [sku] NVARCHAR(50),
    [name] NVARCHAR(160) NOT NULL,
    [description] NVARCHAR(max),
    [type] NVARCHAR(20) NOT NULL,
    [unitPrice] DECIMAL(18,2) NOT NULL,
    [unitCost] DECIMAL(18,2) NOT NULL CONSTRAINT [CatalogItem_unitCost_df] DEFAULT 0,
    [taxRate] DECIMAL(5,2) NOT NULL CONSTRAINT [CatalogItem_taxRate_df] DEFAULT 18,
    [stockQuantity] DECIMAL(18,2) NOT NULL CONSTRAINT [CatalogItem_stockQuantity_df] DEFAULT 0,
    [reorderPoint] DECIMAL(18,2) NOT NULL CONSTRAINT [CatalogItem_reorderPoint_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [CatalogItem_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CatalogItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [CatalogItem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CatalogItem_companyId_sku_key] UNIQUE NONCLUSTERED ([companyId],[sku])
);

-- CreateTable
CREATE TABLE [dbo].[Quote] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [customerId] UNIQUEIDENTIFIER NOT NULL,
    [opportunityId] UNIQUEIDENTIFIER,
    [number] NVARCHAR(40) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Quote_status_df] DEFAULT 'DRAFT',
    [issueDate] DATETIME2 NOT NULL CONSTRAINT [Quote_issueDate_df] DEFAULT CURRENT_TIMESTAMP,
    [validUntil] DATETIME2,
    [subtotal] DECIMAL(18,2) NOT NULL CONSTRAINT [Quote_subtotal_df] DEFAULT 0,
    [discount] DECIMAL(18,2) NOT NULL CONSTRAINT [Quote_discount_df] DEFAULT 0,
    [tax] DECIMAL(18,2) NOT NULL CONSTRAINT [Quote_tax_df] DEFAULT 0,
    [total] DECIMAL(18,2) NOT NULL CONSTRAINT [Quote_total_df] DEFAULT 0,
    [notes] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Quote_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Quote_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Quote_companyId_number_key] UNIQUE NONCLUSTERED ([companyId],[number])
);

-- CreateTable
CREATE TABLE [dbo].[QuoteItem] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [quoteId] UNIQUEIDENTIFIER NOT NULL,
    [catalogItemId] UNIQUEIDENTIFIER,
    [description] NVARCHAR(300) NOT NULL,
    [quantity] DECIMAL(18,2) NOT NULL CONSTRAINT [QuoteItem_quantity_df] DEFAULT 1,
    [unitPrice] DECIMAL(18,2) NOT NULL,
    [taxRate] DECIMAL(5,2) NOT NULL CONSTRAINT [QuoteItem_taxRate_df] DEFAULT 18,
    [lineTotal] DECIMAL(18,2) NOT NULL,
    CONSTRAINT [QuoteItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [customerId] UNIQUEIDENTIFIER NOT NULL,
    [opportunityId] UNIQUEIDENTIFIER,
    [managerId] UNIQUEIDENTIFIER,
    [name] NVARCHAR(180) NOT NULL,
    [description] NVARCHAR(max),
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
    [id] UNIQUEIDENTIFIER NOT NULL,
    [projectId] UNIQUEIDENTIFIER NOT NULL,
    [assigneeId] UNIQUEIDENTIFIER,
    [parentId] UNIQUEIDENTIFIER,
    [title] NVARCHAR(200) NOT NULL,
    [description] NVARCHAR(max),
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
CREATE TABLE [dbo].[Supplier] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(160) NOT NULL,
    [taxId] NVARCHAR(30),
    [email] NVARCHAR(254),
    [phone] NVARCHAR(30),
    [address] NVARCHAR(500),
    [isActive] BIT NOT NULL CONSTRAINT [Supplier_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Supplier_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Supplier_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PurchaseOrder] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [supplierId] UNIQUEIDENTIFIER NOT NULL,
    [number] NVARCHAR(40) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [PurchaseOrder_status_df] DEFAULT 'DRAFT',
    [orderDate] DATETIME2 NOT NULL CONSTRAINT [PurchaseOrder_orderDate_df] DEFAULT CURRENT_TIMESTAMP,
    [expectedAt] DATETIME2,
    [subtotal] DECIMAL(18,2) NOT NULL CONSTRAINT [PurchaseOrder_subtotal_df] DEFAULT 0,
    [tax] DECIMAL(18,2) NOT NULL CONSTRAINT [PurchaseOrder_tax_df] DEFAULT 0,
    [total] DECIMAL(18,2) NOT NULL CONSTRAINT [PurchaseOrder_total_df] DEFAULT 0,
    [notes] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PurchaseOrder_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PurchaseOrder_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PurchaseOrder_companyId_number_key] UNIQUE NONCLUSTERED ([companyId],[number])
);

-- CreateTable
CREATE TABLE [dbo].[PurchaseOrderItem] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [purchaseOrderId] UNIQUEIDENTIFIER NOT NULL,
    [catalogItemId] UNIQUEIDENTIFIER,
    [description] NVARCHAR(300) NOT NULL,
    [quantity] DECIMAL(18,2) NOT NULL CONSTRAINT [PurchaseOrderItem_quantity_df] DEFAULT 1,
    [unitCost] DECIMAL(18,2) NOT NULL,
    [taxRate] DECIMAL(5,2) NOT NULL CONSTRAINT [PurchaseOrderItem_taxRate_df] DEFAULT 18,
    [lineTotal] DECIMAL(18,2) NOT NULL,
    CONSTRAINT [PurchaseOrderItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[InventoryMovement] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [catalogItemId] UNIQUEIDENTIFIER NOT NULL,
    [type] NVARCHAR(20) NOT NULL,
    [quantity] DECIMAL(18,2) NOT NULL,
    [reference] NVARCHAR(100),
    [notes] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [InventoryMovement_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [InventoryMovement_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Expense] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [category] NVARCHAR(80) NOT NULL,
    [description] NVARCHAR(300) NOT NULL,
    [amount] DECIMAL(18,2) NOT NULL,
    [expenseDate] DATETIME2 NOT NULL CONSTRAINT [Expense_expenseDate_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Expense_status_df] DEFAULT 'REGISTERED',
    [reference] NVARCHAR(100),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Expense_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Expense_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Notification] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER,
    [title] NVARCHAR(180) NOT NULL,
    [message] NVARCHAR(max) NOT NULL,
    [type] NVARCHAR(20) NOT NULL CONSTRAINT [Notification_type_df] DEFAULT 'INFO',
    [readAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Notification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Notification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AuditLog] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER,
    [action] NVARCHAR(30) NOT NULL,
    [entity] NVARCHAR(60) NOT NULL,
    [entityId] UNIQUEIDENTIFIER,
    [oldValues] NVARCHAR(max),
    [newValues] NVARCHAR(max),
    [ipAddress] NVARCHAR(45),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AuditLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_companyId_status_idx] ON [dbo].[User]([companyId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_companyId_role_idx] ON [dbo].[User]([companyId], [role]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Lead_companyId_status_idx] ON [dbo].[Lead]([companyId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Lead_ownerId_idx] ON [dbo].[Lead]([ownerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Customer_companyId_name_idx] ON [dbo].[Customer]([companyId], [name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Customer_companyId_isActive_idx] ON [dbo].[Customer]([companyId], [isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contact_customerId_idx] ON [dbo].[Contact]([customerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PipelineStage_companyId_idx] ON [dbo].[PipelineStage]([companyId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_companyId_status_idx] ON [dbo].[Opportunity]([companyId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_customerId_idx] ON [dbo].[Opportunity]([customerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_ownerId_idx] ON [dbo].[Opportunity]([ownerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_pipelineStageId_idx] ON [dbo].[Opportunity]([pipelineStageId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Activity_companyId_scheduledAt_idx] ON [dbo].[Activity]([companyId], [scheduledAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Activity_ownerId_status_idx] ON [dbo].[Activity]([ownerId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CatalogItem_companyId_isActive_idx] ON [dbo].[CatalogItem]([companyId], [isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Quote_customerId_status_idx] ON [dbo].[Quote]([customerId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuoteItem_quoteId_idx] ON [dbo].[QuoteItem]([quoteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Project_companyId_status_idx] ON [dbo].[Project]([companyId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Project_customerId_idx] ON [dbo].[Project]([customerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProjectTask_projectId_status_idx] ON [dbo].[ProjectTask]([projectId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProjectTask_assigneeId_idx] ON [dbo].[ProjectTask]([assigneeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProjectTask_parentId_idx] ON [dbo].[ProjectTask]([parentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Supplier_companyId_name_idx] ON [dbo].[Supplier]([companyId], [name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseOrder_supplierId_status_idx] ON [dbo].[PurchaseOrder]([supplierId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseOrderItem_purchaseOrderId_idx] ON [dbo].[PurchaseOrderItem]([purchaseOrderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InventoryMovement_catalogItemId_createdAt_idx] ON [dbo].[InventoryMovement]([catalogItemId], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Expense_companyId_expenseDate_idx] ON [dbo].[Expense]([companyId], [expenseDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Notification_companyId_createdAt_idx] ON [dbo].[Notification]([companyId], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Notification_userId_readAt_idx] ON [dbo].[Notification]([userId], [readAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_companyId_createdAt_idx] ON [dbo].[AuditLog]([companyId], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_userId_idx] ON [dbo].[AuditLog]([userId]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Lead] ADD CONSTRAINT [Lead_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Lead] ADD CONSTRAINT [Lead_ownerId_fkey] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Customer] ADD CONSTRAINT [Customer_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Contact] ADD CONSTRAINT [Contact_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PipelineStage] ADD CONSTRAINT [PipelineStage_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_ownerId_fkey] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_pipelineStageId_fkey] FOREIGN KEY ([pipelineStageId]) REFERENCES [dbo].[PipelineStage]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_opportunityId_fkey] FOREIGN KEY ([opportunityId]) REFERENCES [dbo].[Opportunity]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_ownerId_fkey] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CatalogItem] ADD CONSTRAINT [CatalogItem_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Quote] ADD CONSTRAINT [Quote_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Quote] ADD CONSTRAINT [Quote_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Quote] ADD CONSTRAINT [Quote_opportunityId_fkey] FOREIGN KEY ([opportunityId]) REFERENCES [dbo].[Opportunity]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[QuoteItem] ADD CONSTRAINT [QuoteItem_quoteId_fkey] FOREIGN KEY ([quoteId]) REFERENCES [dbo].[Quote]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[QuoteItem] ADD CONSTRAINT [QuoteItem_catalogItemId_fkey] FOREIGN KEY ([catalogItemId]) REFERENCES [dbo].[CatalogItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_opportunityId_fkey] FOREIGN KEY ([opportunityId]) REFERENCES [dbo].[Opportunity]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_managerId_fkey] FOREIGN KEY ([managerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectTask] ADD CONSTRAINT [ProjectTask_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectTask] ADD CONSTRAINT [ProjectTask_assigneeId_fkey] FOREIGN KEY ([assigneeId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectTask] ADD CONSTRAINT [ProjectTask_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[ProjectTask]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Supplier] ADD CONSTRAINT [Supplier_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseOrder] ADD CONSTRAINT [PurchaseOrder_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseOrder] ADD CONSTRAINT [PurchaseOrder_supplierId_fkey] FOREIGN KEY ([supplierId]) REFERENCES [dbo].[Supplier]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseOrderItem] ADD CONSTRAINT [PurchaseOrderItem_purchaseOrderId_fkey] FOREIGN KEY ([purchaseOrderId]) REFERENCES [dbo].[PurchaseOrder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseOrderItem] ADD CONSTRAINT [PurchaseOrderItem_catalogItemId_fkey] FOREIGN KEY ([catalogItemId]) REFERENCES [dbo].[CatalogItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[InventoryMovement] ADD CONSTRAINT [InventoryMovement_catalogItemId_fkey] FOREIGN KEY ([catalogItemId]) REFERENCES [dbo].[CatalogItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Expense] ADD CONSTRAINT [Expense_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [AuditLog_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
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
