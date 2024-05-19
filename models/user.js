// getting packages
const bcrypt = require('bcryptjs');
const { DataTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');


const User = sequelize.define('user', {
    userId: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true},
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { 
        type: DataTypes.STRING, 
        allowNull: false,
        set(value) {
            this.setDataValue('password', bcrypt.hashSync(value, 8));
        }
    },
    admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
})

User.prototype.setAdmin = function(value, currentUser) {
    if( currentUser.admin ) {
        this.setDataValue('admin', value);
    }  else {
        throw new Error('Only admins can set admin status');
    }
}

exports.User = User

exports.UserClientFields = [
    'userId',
    'name',
    'email',
    'password',
    'admin'
]