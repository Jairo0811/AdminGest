-- AdminGest v1.2.0 — Tenant integrity hardening
--
-- 1. Unique indexes on nullable columns become filtered indexes. SQL Server UNIQUE
--    constraints treat NULL as a value, so previously only one company without RNC,
--    one customer without RNC per company and one project without opportunity in the
--    whole database could exist.
-- 2. Composite (companyId, id) keys and composite foreign keys so the database itself
--    rejects references between different tenants.
-- 3. Per-company transactional sequences (quote numbering).
-- 4. Per-line discount and ITBIS amounts persisted by the server on quote items.
--
-- The migration aborts (without partial changes) if existing rows reference records of
-- another tenant; those rows must be reviewed manually before upgrading.
-- References from DocumentRecord to projects/customers that no longer exist are set to
-- NULL, because previous versions deleted projects without clearing those references.

BEGIN TRY

BEGIN TRAN;

-- ---------------------------------------------------------------------------------
-- Preflight: cross-tenant references
-- ---------------------------------------------------------------------------------
DECLARE @violations INT = 0;

SELECT @violations = @violations + COUNT(*) FROM [dbo].[Lead] l
  INNER JOIN [dbo].[User] u ON u.[id] = l.[ownerId] WHERE u.[companyId] <> l.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[Opportunity] o
  INNER JOIN [dbo].[Customer] c ON c.[id] = o.[customerId] WHERE c.[companyId] <> o.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[Opportunity] o
  INNER JOIN [dbo].[User] u ON u.[id] = o.[ownerId] WHERE u.[companyId] <> o.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[Opportunity] o
  INNER JOIN [dbo].[PipelineStage] s ON s.[id] = o.[pipelineStageId] WHERE s.[companyId] <> o.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[Activity] a
  INNER JOIN [dbo].[Customer] c ON c.[id] = a.[customerId] WHERE c.[companyId] <> a.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[Activity] a
  INNER JOIN [dbo].[Opportunity] o ON o.[id] = a.[opportunityId] WHERE o.[companyId] <> a.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[Activity] a
  INNER JOIN [dbo].[User] u ON u.[id] = a.[ownerId] WHERE u.[companyId] <> a.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[Quote] q
  INNER JOIN [dbo].[Customer] c ON c.[id] = q.[customerId] WHERE c.[companyId] <> q.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[Quote] q
  INNER JOIN [dbo].[Opportunity] o ON o.[id] = q.[opportunityId] WHERE o.[companyId] <> q.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[Project] p
  INNER JOIN [dbo].[Customer] c ON c.[id] = p.[customerId] WHERE c.[companyId] <> p.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[Project] p
  INNER JOIN [dbo].[User] u ON u.[id] = p.[managerId] WHERE u.[companyId] <> p.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[Notification] n
  INNER JOIN [dbo].[User] u ON u.[id] = n.[userId] WHERE u.[companyId] <> n.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[DocumentRecord] d
  INNER JOIN [dbo].[User] u ON u.[id] = d.[creatorId] WHERE u.[companyId] <> d.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[DocumentRecord] d
  INNER JOIN [dbo].[Project] p ON p.[id] = d.[projectId] WHERE p.[companyId] <> d.[companyId];
SELECT @violations = @violations + COUNT(*) FROM [dbo].[DocumentRecord] d
  INNER JOIN [dbo].[Customer] c ON c.[id] = d.[customerId] WHERE c.[companyId] <> d.[companyId];

IF @violations > 0
BEGIN
    DECLARE @message NVARCHAR(400) = CONCAT(
        N'AdminGest v1.2.0: se detectaron ', @violations,
        N' referencias entre empresas distintas. Revise los datos antes de migrar (ver docs/RELEASE-1.2.0.md).');
    THROW 51000, @message, 1;
END;

-- Orphan document references (no FK existed before this version).
UPDATE d SET d.[projectId] = NULL FROM [dbo].[DocumentRecord] d
WHERE d.[projectId] IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM [dbo].[Project] p WHERE p.[id] = d.[projectId]);
UPDATE d SET d.[customerId] = NULL FROM [dbo].[DocumentRecord] d
WHERE d.[customerId] IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM [dbo].[Customer] c WHERE c.[id] = d.[customerId]);

-- ---------------------------------------------------------------------------------
-- 1. Filtered unique indexes for nullable columns
-- ---------------------------------------------------------------------------------
ALTER TABLE [dbo].[Company] DROP CONSTRAINT [Company_taxId_key];
CREATE UNIQUE NONCLUSTERED INDEX [Company_taxId_key]
ON [dbo].[Company]([taxId]) WHERE [taxId] IS NOT NULL;

ALTER TABLE [dbo].[Customer] DROP CONSTRAINT [Customer_companyId_taxId_key];
CREATE UNIQUE NONCLUSTERED INDEX [Customer_companyId_taxId_key]
ON [dbo].[Customer]([companyId], [taxId]) WHERE [taxId] IS NOT NULL;

ALTER TABLE [dbo].[Project] DROP CONSTRAINT [Project_opportunityId_key];
CREATE UNIQUE NONCLUSTERED INDEX [Project_opportunityId_key]
ON [dbo].[Project]([opportunityId]) WHERE [opportunityId] IS NOT NULL;

-- ---------------------------------------------------------------------------------
-- 2. Composite tenant keys
-- ---------------------------------------------------------------------------------
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_companyId_id_key] UNIQUE NONCLUSTERED ([companyId], [id]);
ALTER TABLE [dbo].[Customer] ADD CONSTRAINT [Customer_companyId_id_key] UNIQUE NONCLUSTERED ([companyId], [id]);
ALTER TABLE [dbo].[PipelineStage] ADD CONSTRAINT [PipelineStage_companyId_id_key] UNIQUE NONCLUSTERED ([companyId], [id]);
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_companyId_id_key] UNIQUE NONCLUSTERED ([companyId], [id]);
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_companyId_id_key] UNIQUE NONCLUSTERED ([companyId], [id]);

ALTER TABLE [dbo].[Lead] DROP CONSTRAINT [Lead_ownerId_fkey];
ALTER TABLE [dbo].[Lead] ADD CONSTRAINT [Lead_companyId_ownerId_fkey]
FOREIGN KEY ([companyId], [ownerId]) REFERENCES [dbo].[User]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[Opportunity] DROP CONSTRAINT [Opportunity_customerId_fkey];
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_companyId_customerId_fkey]
FOREIGN KEY ([companyId], [customerId]) REFERENCES [dbo].[Customer]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Opportunity] DROP CONSTRAINT [Opportunity_ownerId_fkey];
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_companyId_ownerId_fkey]
FOREIGN KEY ([companyId], [ownerId]) REFERENCES [dbo].[User]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Opportunity] DROP CONSTRAINT [Opportunity_pipelineStageId_fkey];
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_companyId_pipelineStageId_fkey]
FOREIGN KEY ([companyId], [pipelineStageId]) REFERENCES [dbo].[PipelineStage]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[Activity] DROP CONSTRAINT [Activity_customerId_fkey];
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_companyId_customerId_fkey]
FOREIGN KEY ([companyId], [customerId]) REFERENCES [dbo].[Customer]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Activity] DROP CONSTRAINT [Activity_opportunityId_fkey];
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_companyId_opportunityId_fkey]
FOREIGN KEY ([companyId], [opportunityId]) REFERENCES [dbo].[Opportunity]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Activity] DROP CONSTRAINT [Activity_ownerId_fkey];
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_companyId_ownerId_fkey]
FOREIGN KEY ([companyId], [ownerId]) REFERENCES [dbo].[User]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[Quote] DROP CONSTRAINT [Quote_customerId_fkey];
ALTER TABLE [dbo].[Quote] ADD CONSTRAINT [Quote_companyId_customerId_fkey]
FOREIGN KEY ([companyId], [customerId]) REFERENCES [dbo].[Customer]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Quote] DROP CONSTRAINT [Quote_opportunityId_fkey];
ALTER TABLE [dbo].[Quote] ADD CONSTRAINT [Quote_companyId_opportunityId_fkey]
FOREIGN KEY ([companyId], [opportunityId]) REFERENCES [dbo].[Opportunity]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[Project] DROP CONSTRAINT [Project_customerId_fkey];
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_companyId_customerId_fkey]
FOREIGN KEY ([companyId], [customerId]) REFERENCES [dbo].[Customer]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Project] DROP CONSTRAINT [Project_managerId_fkey];
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_companyId_managerId_fkey]
FOREIGN KEY ([companyId], [managerId]) REFERENCES [dbo].[User]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[Notification] DROP CONSTRAINT [Notification_userId_fkey];
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_companyId_userId_fkey]
FOREIGN KEY ([companyId], [userId]) REFERENCES [dbo].[User]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[DocumentRecord] ADD CONSTRAINT [DocumentRecord_companyId_creatorId_fkey]
FOREIGN KEY ([companyId], [creatorId]) REFERENCES [dbo].[User]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[DocumentRecord] ADD CONSTRAINT [DocumentRecord_companyId_projectId_fkey]
FOREIGN KEY ([companyId], [projectId]) REFERENCES [dbo].[Project]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[DocumentRecord] ADD CONSTRAINT [DocumentRecord_companyId_customerId_fkey]
FOREIGN KEY ([companyId], [customerId]) REFERENCES [dbo].[Customer]([companyId], [id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ---------------------------------------------------------------------------------
-- 3. Company sequences
-- ---------------------------------------------------------------------------------
CREATE TABLE [dbo].[CompanySequence] (
    [companyId] NVARCHAR(36) NOT NULL,
    [scope] NVARCHAR(40) NOT NULL,
    [value] INT NOT NULL CONSTRAINT [CompanySequence_value_df] DEFAULT 0,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [CompanySequence_pkey] PRIMARY KEY CLUSTERED ([companyId], [scope])
);
ALTER TABLE [dbo].[CompanySequence] ADD CONSTRAINT [CompanySequence_companyId_fkey]
FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ---------------------------------------------------------------------------------
-- 4. Persisted per-line quote amounts (NULL for quotes created before v1.2.0)
-- ---------------------------------------------------------------------------------
ALTER TABLE [dbo].[QuoteItem] ADD [discountAmount] DECIMAL(18,2) NULL, [taxAmount] DECIMAL(18,2) NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;

THROW;

END CATCH
