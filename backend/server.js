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

// 3) Serve your front-end (index.html, style.css, script.js, img/, etc)
app.use('/', express.static(path.join(__dirname, '..')));

// 4) Product routes
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/products/:id → returns one product
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name, description, price, image FROM products WHERE id = ?',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }
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

// 5) Cart API
// a) Create a new cart (returns cartId)
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

// b) Add or update a cart item
app.post('/api/cart_items', async (req, res) => {
  try {
    const { cartId, productId, quantity } = req.body;
    const [productRows] = await pool.query(
      'SELECT price FROM products WHERE id = ?',
      [productId]
    );
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const price = productRows[0].price;

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

// c) List all items in a cart
app.get('/api/cart_items/:cartId', async (req, res) => {
  try {
    const { cartId } = req.params;
    const [items] = await pool.query(
      `SELECT ci.id, ci.quantity, ci.price, p.name, p.image
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = ?`,
      [cartId]
    );
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch cart items' });
  }
});

// d) Remove a single item from a cart
app.delete('/api/cart_items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    await pool.query(
      'DELETE FROM cart_items WHERE id = ?',
      [itemId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove item' });
  }
});

// 6) Fallback — serve index.html for any non-API route
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 7) Start
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server + frontend listening on http://localhost:${port}`);
});
