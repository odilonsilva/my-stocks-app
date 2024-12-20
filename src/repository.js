const sqlite = require('sqlite3').verbose();

function openDB() {
  return new sqlite.Database('data/database.db');
}

exports.startDb = () => {
  const db = openDB();
  db.exec(`CREATE TABLE IF NOT EXISTS stocks 
    (
      id INTEGER PRIMARY KEY,
      url TEXT,
      title TEXT,
      created_at DATE,
      deleted_at DATE
    )`
  );
  db.exec(`CREATE TABLE IF NOT EXISTS stocks_values 
    (
      id INTEGER PRIMARY KEY,
      stockId INTEGER,
      value REAL,
      percentage TEXT,
      status TEXT,
      created_at DATE
    )`
  );

  db.close();
}

exports.saveStock = (stock) => {
  console.log(`saveStock`, stock);
  const db = openDB();

  const insertStock = db.prepare(`INSERT INTO stocks (url, title, created_at) values (?, ?, ?)`);

  insertStock.run(stock.url, stock.title, stock.updated_at, function (err) {
    if (err) {
      console.error(`[saveStock] erro ao inserir. ${err.message}`);
      return;
    }
    stock.id = this.lastID;
  });

  insertStock.finalize();
  db.close();
  this.saveStockValue(stock);
}

exports.saveStockValue = (stock) => {
  console.log(`saveStockValue`, stock)

  const db = openDB();

  const insert = db.prepare(`INSERT INTO stocks_values (stockId, value, percentage, status, created_at) values (?, ?, ?, ?, ?)`);

  insert.run(stock.id, stock.value, stock.percentage, stock.status, stock.updated_at, function (err) {
    if (err) {
      console.error(`[saveStockValue] erro ao inserir. ${err.message}`);
      return;
    }
  });

  insert.finalize();
  db.close();
}

exports.getStocks = async () => {
  const db = openDB();
  
  const stocks = await new Promise((resolve, reject) => {
    db.all(`SELECT 
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
      ORDER BY st.id ASC;`, [], function (error, rows) {
      if (error)
        reject(`[getStocks] erro ao buscar. ${err.message}`);

      resolve(rows);
    })
  });
  db.close();
  // console.log(stocks);
  return stocks;
}

exports.deleteStockById = (stockId) => {
  console.log(`deleteStockById`, stockId)

  const db = openDB();

  const deleteStock = db.prepare(`UPDATE stocks SET deleted_at =? WHERE id =?`);

  deleteStock.run(new Date(), stockId, function (err) {
    if (err) {
      console.error(`[deleteStockById] erro ao excluir stock. ${err.message}`);
      return;
    }
  });

  deleteStock.finalize();
  db.close();
}