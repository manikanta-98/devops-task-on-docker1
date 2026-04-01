const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// 🔹 Database Pool
const pool = new Pool({
  host: process.env.DB_HOST,   // db
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});

// 🔹 DB Retry Logic
async function waitForDB() {
  let retries = 5;
  while (retries) {
    try {
      await pool.query('SELECT 1');
      console.log("✅ Connected to PostgreSQL");
      return;
    } catch (err) {
      console.log("❌ Waiting for DB...");
      retries--;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
  console.error("❌ Could not connect to DB");
  process.exit(1);
}

waitForDB();


// 🔹 Health Check
app.get('/health', (req, res) => {
  res.json({ status: "OK", message: "Server is running 🚀" });
});


// 🔹 Create Table (init)
app.get('/init', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    res.json({ message: "Table created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 Create User (POST)
app.post('/users', async (req, res) => {
  try {
    const { name } = req.body;

    const result = await pool.query(
      'INSERT INTO users (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 Get All Users
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 Get Single User
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM users WHERE id=$1',
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 Delete User
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM users WHERE id=$1',
      [id]
    );

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 Root Route
app.get('/', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ message: "✅ Backend + PostgreSQL working" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 Global Error Handler (professional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});


// 🔹 Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
