const db = require("./db");

// MySQL database helper class
class DatabaseHelper {
  /**
   * Execute a SELECT query and return results
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  static async query(sql, params = []) {
    try {
      const [rows] = await db.query(sql, params);
      return rows;
    } catch (error) {
      console.error("Database query error:", error.message);
      throw error;
    }
  }

  /**
   * Execute INSERT, UPDATE, DELETE queries
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Execution result
   */
  static async execute(sql, params = []) {
    try {
      const [result] = await db.execute(sql, params);
      return result;
    } catch (error) {
      console.error("Database execute error:", error.message);
      throw error;
    }
  }

  /**
   * Get a database connection for transactions
   * @returns {Promise<Object>} Database connection
   */
  static async getConnection() {
    try {
      const connection = await db.getConnection();
      return {
        query: async (sql, params) => {
          const [rows] = await connection.query(sql, params);
          return rows;
        },
        execute: async (sql, params) => {
          const [result] = await connection.execute(sql, params);
          return result;
        },
        beginTransaction: () => connection.beginTransaction(),
        commit: () => connection.commit(),
        rollback: () => connection.rollback(),
        release: () => connection.release(),
      };
    } catch (error) {
      console.error("Database connection error:", error.message);
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   * @param {Array} queries - Array of {sql, params} objects
   * @returns {Promise<Array>} Results of all queries
   */
  static async transaction(queries) {
    const connection = await this.getConnection();

    try {
      await connection.beginTransaction();

      const results = [];
      for (const query of queries) {
        const result = await connection.execute(query.sql, query.params || []);
        results.push(result);
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Check if database connection is healthy
   * @returns {Promise<boolean>} Connection status
   */
  static async isConnected() {
    try {
      await this.query("SELECT 1 as connected");
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = DatabaseHelper;
