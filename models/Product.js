const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  title: DataTypes.STRING,
  titleSub: DataTypes.STRING,
  description: DataTypes.TEXT,
  about: {
  type: DataTypes.TEXT,
  allowNull: true
  },
  categoryId: DataTypes.INTEGER,
  price1: DataTypes.FLOAT,
  price2: DataTypes.FLOAT,
  price3: DataTypes.FLOAT,
  quantity: DataTypes.INTEGER,
  status: DataTypes.STRING,
  mainPhoto: {
    type: DataTypes.STRING, // single main image filename
    allowNull: true,
  },
  imageUrls: {
    type: DataTypes.JSON,   // array of gallery photo filenames
    allowNull: true,
  },
  videoUrls: {
    type: DataTypes.JSON,   // array of video filenames
    allowNull: true,
  },
  specifications: {
    type: DataTypes.JSON,   // JSON array [{ label: '', value: '' }]
    allowNull: true,
  },
}, {
  tableName: 'Products',
  timestamps: true,
});

module.exports = Product;
