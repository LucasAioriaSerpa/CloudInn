-- 002: completa um banco criado antes destas migrações (por exemplo, o banco atual do Azure).
-- Só ADICIONA colunas e índices que faltarem; nunca remove nem muda o tipo do que já existe.
-- Divergências de tipo não são corrigidas aqui: rode npm run db:check para listá-las.

IF COL_LENGTH('dbo.Guests', 'VipStatus') IS NULL
  ALTER TABLE dbo.Guests ADD VipStatus BIT NOT NULL CONSTRAINT DF_Guests_VipStatus DEFAULT 0;
IF COL_LENGTH('dbo.Guests', 'UpdatedAt') IS NULL
  ALTER TABLE dbo.Guests ADD UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Guests_UpdatedAt DEFAULT SYSUTCDATETIME();
GO

IF COL_LENGTH('dbo.Reservations', 'ActualCheckInAt') IS NULL
  ALTER TABLE dbo.Reservations ADD ActualCheckInAt DATETIME2(0) NULL;
IF COL_LENGTH('dbo.Reservations', 'ActualCheckOutAt') IS NULL
  ALTER TABLE dbo.Reservations ADD ActualCheckOutAt DATETIME2(0) NULL;
IF COL_LENGTH('dbo.Reservations', 'UpdatedAt') IS NULL
  ALTER TABLE dbo.Reservations ADD UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Reservations_UpdatedAt DEFAULT SYSUTCDATETIME();
GO

-- Documento único por hóspede (prevenção de duplicidade, RF02).
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Guests_Document' AND object_id = OBJECT_ID(N'dbo.Guests'))
  CREATE UNIQUE INDEX UX_Guests_Document ON dbo.Guests (Document);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Reservations_Code' AND object_id = OBJECT_ID(N'dbo.Reservations'))
  CREATE UNIQUE INDEX UX_Reservations_Code ON dbo.Reservations (Code);
GO

-- Consulta de sobreposição por quarto e período (prevenção de overbooking, RF05).
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Reservations_Room_Dates' AND object_id = OBJECT_ID(N'dbo.Reservations'))
  CREATE INDEX IX_Reservations_Room_Dates ON dbo.Reservations (RoomIdRef, CheckInDate, CheckOutDate) INCLUDE (Status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Reservations_Hotel_Dates' AND object_id = OBJECT_ID(N'dbo.Reservations'))
  CREATE INDEX IX_Reservations_Hotel_Dates ON dbo.Reservations (HotelIdRef, CheckInDate, CheckOutDate) INCLUDE (Status, TotalAmount);
GO

-- Uma chave de idempotência por consumidor.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_IdempotencyKeys_Consumer_Key' AND object_id = OBJECT_ID(N'dbo.IdempotencyKeys'))
  CREATE UNIQUE INDEX UX_IdempotencyKeys_Consumer_Key ON dbo.IdempotencyKeys (Consumer, IdempotencyKey);
GO

-- Publicador da Outbox (Fase 6) busca pendentes em ordem de criação.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_OutboxMessages_Status_CreatedAt' AND object_id = OBJECT_ID(N'dbo.OutboxMessages'))
  CREATE INDEX IX_OutboxMessages_Status_CreatedAt ON dbo.OutboxMessages (Status, CreatedAt);
GO
