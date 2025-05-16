const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const users = [];

exports.signup = async (req, res) => {
  const { email, password } = req.body;
  const existing = users.find(user => user.email === email);
  if (existing) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ email, password: hashedPassword });
  res.status(201).json({ message: "User registered successfully" });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(user => user.email === email);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ email: user.email }, "secretkey", { expiresIn: "1h" });
  res.json({ token });
};