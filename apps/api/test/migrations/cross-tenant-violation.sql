-- Referencia cruzada entre empresas creada por una versión anterior sin validación:
-- la migración 20261103120000 debe abortar sin aplicar ningún cambio.
SET NOCOUNT ON;
DECLARE @now DATETIME2 = SYSUTCDATETIME();
INSERT INTO [dbo].[Company] ([id], [name], [taxId], [updatedAt]) VALUES
  ('30000000-0000-4000-8000-000000000001', N'Empresa X', '101000003', @now),
  ('30000000-0000-4000-8000-000000000002', N'Empresa Y', '101000004', @now);
INSERT INTO [dbo].[User] ([id], [companyId], [email], [passwordHash], [firstName], [lastName], [updatedAt]) VALUES
  ('30000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000002', 'y@integracion.test', 'x', N'Y', N'Y', @now);
INSERT INTO [dbo].[Customer] ([id], [companyId], [name], [updatedAt]) VALUES
  ('30000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000001', N'Cliente X', @now);
INSERT INTO [dbo].[Project] ([id], [companyId], [customerId], [managerId], [name], [updatedAt]) VALUES
  ('30000000-0000-4000-8000-000000000031', '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000021',
   '30000000-0000-4000-8000-000000000011', N'Gerente de otra empresa', @now);
