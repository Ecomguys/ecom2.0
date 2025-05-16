let cart = [];

exports.addToCart = (req, res) => {
  const { productId, quantity } = req.body;
  const item = cart.find(i => i.productId === productId);
  if (item) {
    item.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  res.json({ message: "Item added to cart", cart });
};

exports.getCart = (req, res) => {
  res.json(cart);
};

exports.placeOrder = (req, res) => {
  const order = {
    items: cart,
    date: new Date()
  };
  cart = []; // Clear cart after order
  res.status(201).json({ message: "Order placed", order });
};