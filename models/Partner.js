// models/Partner.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Quotation = require('./Quotations');

const Partner = sequelize.define('Partner', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  company: {
  type: DataTypes.STRING,
  allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('normal', 'special'),
    defaultValue: 'normal',
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'Partners',
  timestamps: true,
});


module.exports = Partner;
