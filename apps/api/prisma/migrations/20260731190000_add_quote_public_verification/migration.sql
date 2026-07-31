ALTER TABLE [Quote] ADD [publicCode] NVARCHAR(36) NULL;

UPDATE [Quote]
SET [publicCode] = CONVERT(NVARCHAR(36), NEWID())
WHERE [publicCode] IS NULL;

ALTER TABLE [Quote] ALTER COLUMN [publicCode] NVARCHAR(36) NOT NULL;

CREATE UNIQUE INDEX [Quote_publicCode_key] ON [Quote]([publicCode]);

ALTER TABLE [Quote]
ADD CONSTRAINT [Quote_publicCode_df] DEFAULT CONVERT(NVARCHAR(36), NEWID()) FOR [publicCode];
