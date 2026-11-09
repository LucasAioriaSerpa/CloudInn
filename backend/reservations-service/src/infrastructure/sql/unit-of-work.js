const { sql, getConnection } = require('./connection');

class SqlUnitOfWork {
  async transaction(operation) {
    const pool = await getConnection();

    const transaction = new sql.Transaction(pool);

    await transaction.begin(
      sql.ISOLATION_LEVEL.SERIALIZABLE
    );

    try {
      const result = await operation(transaction);

      await transaction.commit();

      return result;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Erro ao desfazer transação:', rollbackError.message);
      }

      throw error;
    }
  }
}

module.exports = {
  SqlUnitOfWork
};