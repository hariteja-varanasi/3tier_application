const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// DB config from environment variables
const dbConfig = {
  host:     process.env.DB_HOST     || 'db',
  user:     process.env.DB_USER     || 'appuser',
  password: process.env.DB_PASSWORD || 'apppassword',
  database: process.env.DB_NAME     || 'appdb',
};

// Initialize DB connection with retry
async function getConnection(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mysql.createConnection(dbConfig);
      console.log('✅ Database connected');
      return conn;
    } catch (err) {
      console.log(`⏳ DB not ready (attempt ${i+1}/${retries}): ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Could not connect to database after retries');
}

let db;

async function init() {
  db = await getConnection();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      text VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Table ready');
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'backend' }));

// Get all notes
app.get('/api/notes', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM notes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a note
app.post('/api/notes', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });
  try {
    const [result] = await db.execute('INSERT INTO notes (text) VALUES (?)', [text]);
    res.status(201).json({ id: result.insertId, text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

init()
  .then(() => {
    app.listen(5000, () => console.log('🚀 Backend running on port 5000'));
  })
  .catch(err => {
    console.error('Failed to initialize:', err);
    process.exit(1);
  });
