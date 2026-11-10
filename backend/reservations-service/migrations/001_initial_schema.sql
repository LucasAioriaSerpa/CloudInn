-- 001: tabelas do Reservas Service (ERD do arc42: DOC/diagrams/erd-azure-sql.mmd).
-- Idempotente: cada tabela só é criada se ainda não existir. Nunca apaga nem altera dados.
-- Exceção ao ERD: IdempotencyKeys usa as colunas IdempotencyKey e ResponseStatusCode, que são
-- as usadas pelo código já integrado ao banco do Azure (o ERD chama de Key e StatusCode).

IF OBJECT_ID(N'dbo.Guests', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Guests (
    Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Guests PRIMARY KEY DEFAULT NEWID(),
    Name        NVARCHAR(150)    NOT NULL,
    Document    VARCHAR(30)      NOT NULL,
    Email       VARCHAR(120)     NULL,
    Phone       VARCHAR(25)      NULL,
    VipStatus   BIT              NOT NULL CONSTRAINT DF_Guests_VipStatus DEFAULT 0,
    CreatedAt   DATETIME2(0)     NOT NULL CONSTRAINT DF_Guests_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2(0)     NOT NULL CONSTRAINT DF_Guests_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
END;
GO

IF OBJECT_ID(N'dbo.Reservations', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Reservations (
    Id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Reservations PRIMARY KEY DEFAULT NEWID(),
    Code              VARCHAR(20)      NOT NULL,
    GuestId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Reservations_Guests REFERENCES dbo.Guests (Id),
    HotelIdRef        VARCHAR(50)      NOT NULL,
    RoomIdRef         VARCHAR(50)      NOT NULL,
    CheckInDate       DATE             NOT NULL,
    CheckOutDate      DATE             NOT NULL,
    Status            VARCHAR(20)      NOT NULL,
    TotalAmount       DECIMAL(10, 2)   NOT NULL,
    OriginChannel     VARCHAR(50)      NULL,
    ActualCheckInAt   DATETIME2(0)     NULL,
    ActualCheckOutAt  DATETIME2(0)     NULL,
    CreatedAt         DATETIME2(0)     NOT NULL CONSTRAINT DF_Reservations_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt         DATETIME2(0)     NOT NULL CONSTRAINT DF_Reservations_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Reservations_Status CHECK (Status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT CK_Reservations_Dates CHECK (CheckOutDate > CheckInDate),
    CONSTRAINT CK_Reservations_TotalAmount CHECK (TotalAmount >= 0)
  );
END;
GO

IF OBJECT_ID(N'dbo.IdempotencyKeys', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.IdempotencyKeys (
    Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_IdempotencyKeys PRIMARY KEY DEFAULT NEWID(),
    Consumer            NVARCHAR(100)    NOT NULL,
    IdempotencyKey      NVARCHAR(255)    NOT NULL,
    ResponseStatusCode  INT              NOT NULL,
    ResponseBody        NVARCHAR(MAX)    NOT NULL,
    CreatedAt           DATETIME2(0)     NOT NULL CONSTRAINT DF_IdempotencyKeys_CreatedAt DEFAULT SYSUTCDATETIME(),
    ExpiresAt           DATETIME2(0)     NOT NULL
  );
END;
GO

IF OBJECT_ID(N'dbo.OutboxMessages', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.OutboxMessages (
    Id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_OutboxMessages PRIMARY KEY DEFAULT NEWID(),
    EventType    VARCHAR(80)      NOT NULL,
    AggregateId  VARCHAR(50)      NOT NULL,
    Payload      NVARCHAR(MAX)    NOT NULL,
    Status       VARCHAR(20)      NOT NULL CONSTRAINT DF_OutboxMessages_Status DEFAULT 'PENDING',
    RetryCount   INT              NOT NULL CONSTRAINT DF_OutboxMessages_RetryCount DEFAULT 0,
    CreatedAt    DATETIME2(0)     NOT NULL CONSTRAINT DF_OutboxMessages_CreatedAt DEFAULT SYSUTCDATETIME(),
    ProcessedAt  DATETIME2(0)     NULL,
    CONSTRAINT CK_OutboxMessages_Status CHECK (Status IN ('PENDING', 'PUBLISHED', 'FAILED'))
  );
END;
GO

IF OBJECT_ID(N'dbo.ReservationAudits', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ReservationAudits (
    Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ReservationAudits PRIMARY KEY DEFAULT NEWID(),
    ReservationId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ReservationAudits_Reservations REFERENCES dbo.Reservations (Id),
    PreviousStatus  VARCHAR(20)      NULL,
    NewStatus       VARCHAR(20)      NOT NULL,
    ChangedBy       VARCHAR(80)      NOT NULL,
    Reason          NVARCHAR(255)    NULL,
    ChangedAt       DATETIME2(0)     NOT NULL CONSTRAINT DF_ReservationAudits_ChangedAt DEFAULT SYSUTCDATETIME()
  );
END;
GO
