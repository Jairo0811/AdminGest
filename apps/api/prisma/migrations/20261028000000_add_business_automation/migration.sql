BEGIN TRY
BEGIN TRAN;

CREATE TABLE [dbo].[Notification] (
  [id] NVARCHAR(36) NOT NULL,
  [companyId] NVARCHAR(36) NOT NULL,
  [userId] NVARCHAR(36) NOT NULL,
  [eventType] NVARCHAR(32) NOT NULL,
  [title] NVARCHAR(150) NOT NULL,
  [message] NVARCHAR(500) NOT NULL,
  [path] NVARCHAR(150) NOT NULL,
  [dedupeKey] NVARCHAR(160) NOT NULL,
  [readAt] DATETIME2,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [Notification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT [Notification_pkey] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [Notification_companyId_userId_dedupeKey_key] UNIQUE NONCLUSTERED ([companyId],[userId],[dedupeKey])
);
CREATE NONCLUSTERED INDEX [Notification_companyId_userId_readAt_createdAt_idx] ON [dbo].[Notification]([companyId],[userId],[readAt],[createdAt]);
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE TABLE [dbo].[WorkflowRule] (
  [id] NVARCHAR(36) NOT NULL,
  [companyId] NVARCHAR(36) NOT NULL,
  [eventType] NVARCHAR(32) NOT NULL,
  [enabled] BIT NOT NULL CONSTRAINT [WorkflowRule_enabled_df] DEFAULT 1,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [WorkflowRule_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
  [updatedAt] DATETIME2 NOT NULL,
  CONSTRAINT [WorkflowRule_pkey] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [WorkflowRule_companyId_eventType_key] UNIQUE NONCLUSTERED ([companyId],[eventType])
);
ALTER TABLE [dbo].[WorkflowRule] ADD CONSTRAINT [WorkflowRule_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE TABLE [dbo].[ProjectTemplate] (
  [id] NVARCHAR(36) NOT NULL,
  [companyId] NVARCHAR(36) NOT NULL,
  [name] NVARCHAR(120) NOT NULL,
  [description] NVARCHAR(500),
  [stepsJson] NVARCHAR(4000) NOT NULL,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProjectTemplate_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
  [updatedAt] DATETIME2 NOT NULL,
  CONSTRAINT [ProjectTemplate_pkey] PRIMARY KEY CLUSTERED ([id])
);
CREATE NONCLUSTERED INDEX [ProjectTemplate_companyId_name_idx] ON [dbo].[ProjectTemplate]([companyId],[name]);
ALTER TABLE [dbo].[ProjectTemplate] ADD CONSTRAINT [ProjectTemplate_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE TABLE [dbo].[DocumentRecord] (
  [id] NVARCHAR(36) NOT NULL,
  [companyId] NVARCHAR(36) NOT NULL,
  [creatorId] NVARCHAR(36) NOT NULL,
  [projectId] NVARCHAR(36),
  [customerId] NVARCHAR(36),
  [title] NVARCHAR(150) NOT NULL,
  [category] NVARCHAR(32) NOT NULL CONSTRAINT [DocumentRecord_category_df] DEFAULT 'OTHER',
  [url] NVARCHAR(1500) NOT NULL,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [DocumentRecord_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
  [updatedAt] DATETIME2 NOT NULL,
  CONSTRAINT [DocumentRecord_pkey] PRIMARY KEY CLUSTERED ([id])
);
CREATE NONCLUSTERED INDEX [DocumentRecord_companyId_projectId_idx] ON [dbo].[DocumentRecord]([companyId],[projectId]);
CREATE NONCLUSTERED INDEX [DocumentRecord_companyId_customerId_idx] ON [dbo].[DocumentRecord]([companyId],[customerId]);
ALTER TABLE [dbo].[DocumentRecord] ADD CONSTRAINT [DocumentRecord_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
