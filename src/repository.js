const sqlite = require("sqlite3").verbose();
const fs = require("fs").promises;
const path = require("path");
const { logger, LOG_TYPE_ERROR } = require("./logger");

function openDB() {
  return new sqlite.Database("./data/database.db", (err) => {
    if (err) {
      logger(`[openDB] erro ao abrir banco de dados. ${err}`, LOG_TYPE_ERROR);
    }
  });
}

async function startDb() {
  logger(`[startDb] Iniciando aplicação.`);

  try {
    await fs.mkdir("./data", { recursive: true });
  } catch (err) {
    logger(
      `[startDb] erro ao criar diretório de banco de dados. ${err}`,
      LOG_TYPE_ERROR
    );
    throw new Error(
      `[startDb] erro ao criar diretório de banco de dados. ${err}`
    );
  }

  const db = openDB();
  db.exec(`CREATE TABLE IF NOT EXISTS stocks 
    (
      id INTEGER PRIMARY KEY,
      url TEXT,
      title TEXT,
      created_at DATE,
      deleted_at DATE
    )`);
  db.exec(`CREATE TABLE IF NOT EXISTS stocks_values 
    (
      id INTEGER PRIMARY KEY,
      stockId INTEGER,
      value REAL,
      percentage TEXT,
      status TEXT,
      created_at DATE
    )`);

  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_stocks_values_stockId ON stocks_values (stockId)`
  ); // index

  db.exec(
    `CREATE TABLE IF NOT EXISTS settings 
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      refresh_interval INTEGER DEFAULT 5,
      update_on_startup BOOLEAN DEFAULT 0,
      analyze_custom_color BOOLEAN DEFAULT 1
    );`,
    (err) => {
      if (err) {
        logger(
          `[startDb] erro ao criar tabela de configurações. ${err}`,
          LOG_TYPE_ERROR
        );
      }
    }
  );

  db.close();
  await initializeSettings();
}

function saveStock(stock) {
  logger(`[saveStock] ${stock.id} - ${stock.title}`);
  const db = openDB();

  const insertStock = db.prepare(
    `INSERT INTO stocks (url, title, created_at) values (?, ?, ?)`
  );

  insertStock.run(stock.url, stock.title, stock.updated_at, function (err) {
    if (err) {
      logger(`[saveStock] erro ao inserir. ${err.message}`, LOG_TYPE_ERROR);
      return;
    }
    stock.id = this.lastID;
  });

  insertStock.finalize();
  db.close();
  saveStockValue(stock);
}

function saveStockValue(stock) {
  const db = openDB();

  const insert = db.prepare(
    `INSERT INTO stocks_values (stockId, value, percentage, status, created_at) values (?, ?, ?, ?, ?)`
  );

  insert.run(
    stock.id,
    stock.value,
    stock.percentage,
    stock.status,
    stock.updated_at,
    function (err) {
      if (err) {
        logger(
          `[saveStockValue] erro ao inserir. ${err.message}`,
          LOG_TYPE_ERROR
        );
        return;
      }
    }
  );

  insert.finalize();
  db.close();
}

async function getStocks() {
  const db = openDB();

  const stocks = await new Promise((resolve, reject) => {
    db.all(
      `SELECT 
      st.*,
      stv.percentage,
      stv.status,
      stv.value,
      stv.created_at as updated_at
      FROM stocks st
      LEFT JOIN (
        SELECT * FROM stocks_values 
        GROUP BY stockId
        HAVING created_at = max(created_at)
        ORDER BY id desc
      ) stv ON stv.stockId = st.id
      WHERE st.deleted_at IS NULL
      GROUP BY st.id
      ORDER BY st.id ASC;`,
      [],
      function (error, rows) {
        if (error) {
          logger(
            `[getStocks] erro ao buscar. ${error.message}`,
            LOG_TYPE_ERROR
          );
          reject(`[getStocks] erro ao buscar. ${err.message}`);
        }

        resolve(rows);
      }
    );
  });
  db.close();
  return stocks;
}

function deleteStockById(stockId) {
  logger(`deleteStockById: ${stockId}`);

  const db = openDB();

  const deleteStock = db.prepare(`UPDATE stocks SET deleted_at =? WHERE id =?`);

  deleteStock.run(new Date(), stockId, function (err) {
    if (err) {
      logger(
        `[deleteStockById] erro ao excluir stock. ${err.message}`,
        LOG_TYPE_ERROR
      );
      return;
    }
  });

  deleteStock.finalize();
  db.close();
}

async function getStock(id, startDate, endDate) {
  const db = openDB();

  const stock = await new Promise((resolve, reject) => {
    db.get(
      `SELECT
            st.*,
            stv.max,
            stv.min,
            (SELECT percentage FROM stocks_values WHERE stockId = st.id AND value = stv.max LIMIT 1) as maxPercentage,
            (SELECT status FROM stocks_values WHERE stockId = st.id AND value = stv.max LIMIT 1) as maxPercentageStatus,
            (SELECT percentage FROM stocks_values WHERE stockId = st.id AND value = stv.min LIMIT 1) as minPercentage,
            (SELECT status FROM stocks_values WHERE stockId = st.id AND value = stv.min LIMIT 1) as minPercentageStatus
        FROM stocks st
        LEFT JOIN (
            SELECT
                stockId,
                MAX(value) as max,
                MIN(value) as min
            FROM
                stocks_values
            WHERE created_at BETWEEN $startDate AND $endDate
            GROUP BY
                stockId
        ) stv ON st.id = stv.stockId
        WHERE st.id = $id;`,
      { $startDate: startDate, $endDate: endDate, $id: id },
      function (error, rows) {
        if (error) {
          logger(`[getStock] erro ao buscar. ${error.message}`, LOG_TYPE_ERROR);
          reject(`[getStock] erro ao buscar. ${error.message}`);
        }
        resolve(rows);
      }
    );
  });

  const stockValues = await new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM stocks_values 
        WHERE stockId = $id AND (created_at BETWEEN $startDate AND $endDate );`,
      { $id: id, $startDate: startDate, $endDate: endDate },
      function (error, rows) {
        if (error) {
          logger(`[getStock] erro ao buscar. ${error.message}`, LOG_TYPE_ERROR);
          reject(`[getStock] erro ao buscar. ${err.message}`);
        }

        resolve(rows);
      }
    );
  });
  db.close();

  return {
    stock,
    stockValues,
  };
}

async function saveSettings(settings) {
  const db = openDB();
  await new Promise((resolve, reject) => {
    db.run(`DELETE FROM settings WHERE id > 0;`, [], function (err) {
      if (err) {
        logger(
          `[saveSettings] erro ao deletar. ${err.message}`,
          LOG_TYPE_ERROR
        );
        reject(err);
      } else {
        resolve();
      }
    });
    db.run(
      `INSERT INTO settings (refresh_interval, update_on_startup, analyze_custom_color) VALUES (?, ?, ?)`,
      [
        settings.refreshInterval,
        settings.updateOnStartup,
        settings.analyzeCustomColor,
      ],
      function (err) {
        if (err) {
          logger(
            `[saveSettings] erro ao inserir. ${err.message}`,
            LOG_TYPE_ERROR
          );
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
  db.close();
}

async function loadSettings() {
  const db = openDB();
  const data = await new Promise((resolve, reject) => {
    db.get(
      `SELECT refresh_interval, update_on_startup, analyze_custom_color FROM settings ORDER BY id DESC LIMIT 1`,
      (err, row) => {
        if (err) {
          logger(
            `[loadSettings] erro ao buscar. ${err.message}`,
            LOG_TYPE_ERROR
          );
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
  db.close();
  return data;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initializeSettings() {
  try {
    await delay(500); // Atraso de 500ms
    const settings = await loadSettings();
    if (!settings) {
      logger(`[startDb] Criando configurações padrão.`);
      await saveSettings({
        refreshInterval: 5,
        updateOnStartup: 1,
        analyzeCustomColor: 1,
      });
    }
  } catch (err) {
    logger(
      `[startDb] erro ao criar configurações padrão. ${err}`,
      LOG_TYPE_ERROR
    );
  }
}

async function getStockLastID() {
  const db = openDB();

  const stockId = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id FROM stocks ORDER BY id DESC LIMIT 1;`,
      [],
      function (error, rows) {
        if (error) {
          logger(
            `[getStock] erro ao buscar ultimo ID. ${error.message}`,
            LOG_TYPE_ERROR
          );
          reject(`[getStock] erro ao buscar ultimo ID. ${error.message}`);
        }
        resolve(rows);
      }
    );
  });

  db.close();

  return stockId ? stockId.id : 0;
}

module.exports = {
  startDb,
  saveStock,
  saveStockValue,
  getStocks,
  deleteStockById,
  getStock,
  saveSettings,
  loadSettings,
  getStockLastID,
};
