CREATE TABLE [dbo].[PasswordResetToken] (
    [id] NVARCHAR(36) NOT NULL,
    [userId] NVARCHAR(36) NOT NULL,
    [tokenHash] NVARCHAR(64) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [usedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PasswordResetToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [createdIp] NVARCHAR(64),
    [userAgent] NVARCHAR(500),
    CONSTRAINT [PasswordResetToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PasswordResetToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE UNIQUE NONCLUSTERED INDEX [PasswordResetToken_tokenHash_key]
ON [dbo].[PasswordResetToken]([tokenHash]);

CREATE NONCLUSTERED INDEX [PasswordResetToken_userId_expiresAt_idx]
ON [dbo].[PasswordResetToken]([userId], [expiresAt]);
