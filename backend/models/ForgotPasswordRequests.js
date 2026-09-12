const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForgotPasswordRequests = sequelize.define('ForgotPasswordRequests', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
});

module.exports = ForgotPasswordRequests;