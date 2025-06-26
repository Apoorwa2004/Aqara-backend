
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Customer  = require('../models/Customer');

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password || !address) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existing = await Customer.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await Customer.create({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
    });

    const token = jwt.sign({ id: customer.id, type: 'customer' }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.cookie('customerToken', token, { httpOnly: true });
    res.status(201).json({ success: true, token, customer });
  } catch (err) {
    console.error('Signup Error:', err); // ✅ THIS is what you should check in your terminal
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const customer = await Customer.findOne({ where: { email } });
    if (!customer) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: customer.id, type: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('customerToken', token, { httpOnly: true });
    res.json({ success: true, token, customer });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// POST /api/customers/change-password
router.post('/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    const customer = await Customer.findOne({ where: { email } });
    if (!customer) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, customer.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    customer.password = newPassword;
    await customer.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Customer password change error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;
