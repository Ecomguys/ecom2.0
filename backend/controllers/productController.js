exports.getProducts = (req, res) => {
  const products = [
    { id: 1, name: "T-Shirt A", price: 118.19 },
    { id: 2, name: "T-Shirt B", price: 99.99 },
    { id: 3, name: "T-Shirt C", price: 79.49 }
  ];
  res.json(products);
};