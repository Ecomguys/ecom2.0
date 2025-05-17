require('dotenv').config();
const express = require('express');
const mysql   = require('mysql2');
const cors    = require('cors');
const path    = require('path');

const app = express();

// 1) MySQL pool
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// 2) Middleware
app.use(cors());
app.use(express.json());

// 3) Serve your front-end (HTML/CSS/JS/imgs)
app.use('/', express.static(path.join(__dirname, '..')));

// 4) PRODUCT ROUTES
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, price, image FROM products WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, description, price, image } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)',
      [name, description, price, image]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 5) CART ROUTES
app.post('/api/cart', async (req, res) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO carts (user_id) VALUES (NULL)'
    );
    res.status(201).json({ cartId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create cart' });
  }
});

app.post('/api/cart_items', async (req, res) => {
  try {
    const { cartId, productId, quantity } = req.body;
    const [p] = await pool.query(
      'SELECT price FROM products WHERE id = ?',
      [productId]
    );
    if (!p.length) return res.status(404).json({ error: 'Product not found' });
    const price = p[0].price;

    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, price)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         quantity = quantity + VALUES(quantity)`,
      [cartId, productId, quantity, price]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add to cart' });
  }
});

app.get('/api/cart_items/:cartId', async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT ci.id, ci.quantity, ci.price, p.name, p.image
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = ?`,
      [req.params.cartId]
    );
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch cart items' });
  }
});

app.delete('/api/cart_items/:itemId', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE id = ?', [req.params.itemId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove item' });
  }
});

// 6) AUTH ROUTES

// a) LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query(
      'SELECT id, username AS name FROM users WHERE email = ? AND password_hash = ?',
      [email, password]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ userId: rows[0].id, name: rows[0].name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// b) WHO AM I?
app.get('/api/me', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(401).json({ error: 'Not logged in' });
  try {
    const [rows] = await pool.query(
      'SELECT id, username AS name, email FROM users WHERE id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch user' });
  }
});

// c) REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, password]
    );
    res.status(201).json({ userId: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already in use' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 7) FALLBACK — serve index.html for any non-API route
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 8) START SERVER
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server + frontend listening on http://localhost:${port}`);
});
