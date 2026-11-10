const { sql, getConnection, errorNumber } = require('./connection');

const DEADLOCK = 1205;
const MAX_ATTEMPTS = 3;

// Transação SERIALIZABLE. Em deadlock (comum quando duas reservas disputam o mesmo quarto),
// o SQL Server desfaz uma delas; a operação é repetida e então enxerga a reserva concorrente.
class SqlUnitOfWork {
  async transaction(operation) {
    for (let attempt = 1; ; attempt += 1) {
      const pool = await getConnection();
      const transaction = new sql.Transaction(pool);
      await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

      try {
        const result = await operation(transaction);
        await transaction.commit();
        return result;
      } catch (error) {
        await transaction.rollback().catch(() => undefined); // já desfeita em caso de deadlock
        if (errorNumber(error) === DEADLOCK && attempt < MAX_ATTEMPTS) continue;
        throw error;
      }
    }
  }
}

module.exports = {
  SqlUnitOfWork
};
