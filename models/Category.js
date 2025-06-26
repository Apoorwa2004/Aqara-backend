const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Your DB connection file

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'categories', // Your table name
  timestamps: true,        // createdAt and updatedAt
});

module.exports = Category;
