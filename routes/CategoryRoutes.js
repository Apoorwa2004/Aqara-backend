const express = require('express');
const router = express.Router();
const Category = require('../models/Category');


// Create new Category
router.post('/', async (req, res) => {
    try {
      const { name } = req.body;
      const category = await Category.create({ name });
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Server error creating category' });
    }
  });
  
  // Get all categories
  router.get('/', async (req, res) => {
    try {
      const categories = await Category.findAll();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Server error fetching categories' });
    }
  });
  
  module.exports = router;
  