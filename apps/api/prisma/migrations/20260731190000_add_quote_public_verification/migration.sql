ALTER TABLE [Quote]
ADD [publicCode] NVARCHAR(36) NOT NULL
    CONSTRAINT [Quote_publicCode_df]
    DEFAULT CONVERT(NVARCHAR(36), NEWID())
    WITH VALUES;

EXEC(N'CREATE UNIQUE INDEX [Quote_publicCode_key] ON [Quote]([publicCode])');
