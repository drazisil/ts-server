import { Sequelize, DataTypes, Model } from 'sequelize';

// Initialize Sequelize
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'banned_ips.db',
});

// Define the BannedIP model
export class BannedIP extends Model {}
BannedIP.init(
  {
    ip: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'BannedIP',
    tableName: 'banned_ips',
    timestamps: false,
  }
);

// Define the Connection model
export class Connection extends Model {}
Connection.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dataReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    errors: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Connection',
    tableName: 'connections',
    timestamps: false,
  }
);

// Sync the models with the database
export async function initializeModels() {
  await sequelize.sync();
}
