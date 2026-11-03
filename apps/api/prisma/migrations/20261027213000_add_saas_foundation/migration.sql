BEGIN TRY

BEGIN TRAN;

-- SaaS plan catalog
CREATE TABLE [dbo].[Plan] (
    [id] NVARCHAR(36) NOT NULL,
    [code] NVARCHAR(32) NOT NULL,
    [name] NVARCHAR(80) NOT NULL,
    [description] NVARCHAR(500),
    [monthlyPrice] DECIMAL(18,2) NOT NULL CONSTRAINT [Plan_monthlyPrice_df] DEFAULT 0,
    [currency] NVARCHAR(3) NOT NULL CONSTRAINT [Plan_currency_df] DEFAULT 'DOP',
    [maxUsers] INT NOT NULL,
    [maxCustomers] INT NOT NULL,
    [maxProjects] INT NOT NULL,
    [storageMb] INT NOT NULL CONSTRAINT [Plan_storageMb_df] DEFAULT 1024,
    [advancedReports] BIT NOT NULL CONSTRAINT [Plan_advancedReports_df] DEFAULT 0,
    [apiAccess] BIT NOT NULL CONSTRAINT [Plan_apiAccess_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [Plan_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Plan_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Plan_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Plan_code_key] UNIQUE NONCLUSTERED ([code])
);

-- One current subscription per tenant
CREATE TABLE [dbo].[Subscription] (
    [id] NVARCHAR(36) NOT NULL,
    [companyId] NVARCHAR(36) NOT NULL,
    [planId] NVARCHAR(36) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Subscription_status_df] DEFAULT 'TRIAL',
    [trialEndsAt] DATETIME2,
    [currentPeriodStart] DATETIME2 NOT NULL CONSTRAINT [Subscription_currentPeriodStart_df] DEFAULT CURRENT_TIMESTAMP,
    [currentPeriodEnd] DATETIME2,
    [cancelAtPeriodEnd] BIT NOT NULL CONSTRAINT [Subscription_cancelAtPeriodEnd_df] DEFAULT 0,
    [canceledAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Subscription_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Subscription_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Subscription_companyId_key] UNIQUE NONCLUSTERED ([companyId])
);

CREATE NONCLUSTERED INDEX [Subscription_planId_status_idx]
ON [dbo].[Subscription]([planId], [status]);

ALTER TABLE [dbo].[Subscription]
ADD CONSTRAINT [Subscription_companyId_fkey]
FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[Subscription]
ADD CONSTRAINT [Subscription_planId_fkey]
FOREIGN KEY ([planId]) REFERENCES [dbo].[Plan]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Initial commercial tiers. Prices remain configurable and start at zero until billing is connected.
INSERT INTO [dbo].[Plan]
([id], [code], [name], [description], [monthlyPrice], [currency], [maxUsers], [maxCustomers], [maxProjects], [storageMb], [advancedReports], [apiAccess], [isActive], [createdAt], [updatedAt])
VALUES
(CONVERT(NVARCHAR(36), NEWID()), 'STARTER', 'Starter', 'Operación esencial para equipos pequeños.', 0, 'DOP', 3, 100, 10, 1024, 0, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CONVERT(NVARCHAR(36), NEWID()), 'PRO', 'Pro', 'Mayor capacidad y reportes avanzados.', 0, 'DOP', 10, 1000, 100, 10240, 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CONVERT(NVARCHAR(36), NEWID()), 'BUSINESS', 'Business', 'Capacidad ampliada y acceso de integración.', 0, 'DOP', 50, 10000, 1000, 51200, 1, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Existing tenants enter a 14-day Starter trial so the migration is backwards compatible.
INSERT INTO [dbo].[Subscription]
([id], [companyId], [planId], [status], [trialEndsAt], [currentPeriodStart], [cancelAtPeriodEnd], [createdAt], [updatedAt])
SELECT
    CONVERT(NVARCHAR(36), NEWID()),
    c.[id],
    p.[id],
    'TRIAL',
    DATEADD(day, 14, CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM [dbo].[Company] c
CROSS JOIN [dbo].[Plan] p
WHERE p.[code] = 'STARTER'
  AND NOT EXISTS (
      SELECT 1 FROM [dbo].[Subscription] s WHERE s.[companyId] = c.[id]
  );

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;

THROW;

END CATCH
