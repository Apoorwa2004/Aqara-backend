const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Partner = require('./Partner'); // Ensure this path is correct

const Quotation = sequelize.define('Quotation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userType: {
    type: DataTypes.ENUM('customer', 'normal', 'special'),
    allowNull: false,
    defaultValue: 'customer'
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  partnerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Partners', // table name or model name
      key: 'id'
    }
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false
  },
  quotationPdfPath: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Quotations',
  timestamps: true
});


module.exports = Quotation;
