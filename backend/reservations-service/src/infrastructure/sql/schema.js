// Colunas que os repositórios deste serviço usam. Fonte do npm run db:check.
// Tipos conforme migrations/001_initial_schema.sql.
const EXPECTED_SCHEMA = {
  Guests: {
    Id: 'uniqueidentifier', Name: 'nvarchar', Document: 'varchar', Email: 'varchar', Phone: 'varchar',
    VipStatus: 'bit', CreatedAt: 'datetime2', UpdatedAt: 'datetime2'
  },
  Reservations: {
    Id: 'uniqueidentifier', Code: 'varchar', GuestId: 'uniqueidentifier', HotelIdRef: 'varchar', RoomIdRef: 'varchar',
    CheckInDate: 'date', CheckOutDate: 'date', Status: 'varchar', TotalAmount: 'decimal', OriginChannel: 'varchar',
    ActualCheckInAt: 'datetime2', ActualCheckOutAt: 'datetime2', CreatedAt: 'datetime2', UpdatedAt: 'datetime2'
  },
  IdempotencyKeys: {
    Id: 'uniqueidentifier', Consumer: 'nvarchar', IdempotencyKey: 'nvarchar', ResponseStatusCode: 'int',
    ResponseBody: 'nvarchar', CreatedAt: 'datetime2', ExpiresAt: 'datetime2'
  },
  OutboxMessages: {
    Id: 'uniqueidentifier', EventType: 'varchar', AggregateId: 'varchar', Payload: 'nvarchar', Status: 'varchar',
    RetryCount: 'int', CreatedAt: 'datetime2', ProcessedAt: 'datetime2'
  },
  ReservationAudits: {
    Id: 'uniqueidentifier', ReservationId: 'uniqueidentifier', PreviousStatus: 'varchar', NewStatus: 'varchar',
    ChangedBy: 'varchar', Reason: 'nvarchar', ChangedAt: 'datetime2'
  }
};

// Tipos de texto equivalentes para leitura e escrita via mssql (varchar x nvarchar não quebram o código).
const COMPATIBLE = { varchar: ['varchar', 'nvarchar'], nvarchar: ['nvarchar', 'varchar'] };

function compareSchema(actualColumns) {
  const problems = [];
  for (const [table, columns] of Object.entries(EXPECTED_SCHEMA)) {
    const actual = actualColumns.filter(column => column.table === table);
    if (!actual.length) {
      problems.push(`Tabela dbo.${table} não existe.`);
      continue;
    }
    for (const [column, type] of Object.entries(columns)) {
      const found = actual.find(item => item.column === column);
      if (!found) problems.push(`dbo.${table}.${column} não existe.`);
      else if (!(COMPATIBLE[type] || [type]).includes(found.type)) {
        problems.push(`dbo.${table}.${column} é ${found.type}; esperado ${type}.`);
      }
    }
  }
  return problems;
}

module.exports = { EXPECTED_SCHEMA, compareSchema };
