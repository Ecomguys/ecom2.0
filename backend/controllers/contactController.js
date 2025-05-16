const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "../data/messages.json");

exports.submitMessage = (req, res) => {
  const { name, email, subject, message } = req.body;
  const newMessage = { name, email, subject, message, date: new Date() };

  let messages = [];
  if (fs.existsSync(filePath)) {
    messages = JSON.parse(fs.readFileSync(filePath));
  }
  messages.push(newMessage);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));

  res.status(201).json({ message: "Message received" });
};

exports.getMessages = (req, res) => {
  if (fs.existsSync(filePath)) {
    const messages = JSON.parse(fs.readFileSync(filePath));
    res.json(messages);
  } else {
    res.json([]);
  }
};