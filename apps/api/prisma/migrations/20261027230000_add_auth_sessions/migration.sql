BEGIN TRY
BEGIN TRAN;

CREATE TABLE [dbo].[AuthSession] (
    [id] NVARCHAR(36) NOT NULL,
    [userId] NVARCHAR(36) NOT NULL,
    [refreshTokenHash] NVARCHAR(64) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [lastUsedAt] DATETIME2 NOT NULL CONSTRAINT [AuthSession_lastUsedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [revokedAt] DATETIME2,
    [ipAddress] NVARCHAR(64),
    [userAgent] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AuthSession_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [AuthSession_pkey] PRIMARY KEY CLUSTERED ([id])
);
CREATE NONCLUSTERED INDEX [AuthSession_userId_revokedAt_expiresAt_idx]
ON [dbo].[AuthSession]([userId], [revokedAt], [expiresAt]);
ALTER TABLE [dbo].[AuthSession] ADD CONSTRAINT [AuthSession_userId_fkey]
FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
