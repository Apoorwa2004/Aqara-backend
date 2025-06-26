const Product = require('../models/Product');

exports.updateQuantityOnly = async (req, res) => {
  try {
    // Ensure req.user exists
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: User not found in request' });
    }

    const { quantity } = req.body;
    const { role } = req.user;

    // Make sure the role matches exactly
    if (role !== 'store') {
      return res.status(403).json({ message: 'Only store users can update quantity.' });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.quantity = quantity;
    await product.save();

    return res.json({ message: 'Quantity updated successfully', product });
  } catch (err) {
    console.error('❌ Error updating quantity:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
