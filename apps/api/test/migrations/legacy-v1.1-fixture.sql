-- Datos con el esquema de AdminGest v1.1.0 (antes de la migración 20261103120000).
-- Representa una instalación real: numeración con huecos (una cotización eliminada, por
-- lo que count+1 repetiría un número existente) y documentos que apuntan a un proyecto
-- eliminado (no existía clave foránea). En v1.1 la restricción UNIQUE sobre columnas
-- nulas solo admitía una empresa sin RNC; tras migrar deben admitirse varias.
SET NOCOUNT ON;
DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @year NVARCHAR(4) = CAST(YEAR(SYSUTCDATETIME()) AS NVARCHAR(4));
DECLARE @starter NVARCHAR(36) = (SELECT [id] FROM [dbo].[Plan] WHERE [code] = 'STARTER');

INSERT INTO [dbo].[Company] ([id], [name], [taxId], [timezone], [updatedAt]) VALUES
  ('10000000-0000-4000-8000-000000000001', N'Legado Uno SRL', NULL, 'UTC', @now);
INSERT INTO [dbo].[Subscription] ([id], [companyId], [planId], [status], [trialEndsAt], [updatedAt]) VALUES
  ('10000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-000000000001', @starter, 'ACTIVE', NULL, @now);
INSERT INTO [dbo].[User] ([id], [companyId], [email], [passwordHash], [firstName], [lastName], [role], [updatedAt]) VALUES
  ('10000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001', 'legado@integracion.test',
   '$2b$12$cxtTAop2kSX0XAUFMX1.juckYe9esBFXRyZI.eY9oyz1Ffku4wDPa', N'Usuario', N'Legado', 'ADMIN', @now);
INSERT INTO [dbo].[Customer] ([id], [companyId], [name], [taxId], [updatedAt]) VALUES
  ('10000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000001', N'Cliente legado', NULL, @now);
INSERT INTO [dbo].[Project] ([id], [companyId], [customerId], [name], [updatedAt]) VALUES
  ('10000000-0000-4000-8000-000000000031', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000021', N'Proyecto vigente', @now);
INSERT INTO [dbo].[Quote] ([id], [companyId], [customerId], [number], [subtotal], [discount], [tax], [total], [updatedAt]) VALUES
  ('10000000-0000-4000-8000-000000000041', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000021', CONCAT('COT-', @year, '-00001'), 100, 0, 18, 118, @now),
  ('10000000-0000-4000-8000-000000000042', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000021', CONCAT('COT-', @year, '-00003'), 100, 0, 18, 118, @now);
INSERT INTO [dbo].[QuoteItem] ([id], [quoteId], [description], [quantity], [unitPrice], [taxRate], [lineTotal]) VALUES
  ('10000000-0000-4000-8000-000000000051', '10000000-0000-4000-8000-000000000041', N'Servicio legado', 1, 100, 18, 100);
INSERT INTO [dbo].[DocumentRecord] ([id], [companyId], [creatorId], [title], [category], [url], [projectId], [updatedAt]) VALUES
  ('10000000-0000-4000-8000-000000000061', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000011', N'Proyecto eliminado', 'OTHER', 'https://docs.example.com/a', '10000000-0000-4000-8000-0000000000ff', @now),
  ('10000000-0000-4000-8000-000000000062', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000011', N'Proyecto vigente', 'OTHER', 'https://docs.example.com/b', '10000000-0000-4000-8000-000000000031', @now);

-- Segunda empresa (con RNC: el esquema anterior no permitía dos empresas sin RNC).
INSERT INTO [dbo].[Company] ([id], [name], [taxId], [updatedAt]) VALUES
  ('20000000-0000-4000-8000-000000000001', N'Legado Dos SRL', '101000002', @now);
