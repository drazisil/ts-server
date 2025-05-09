'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('banned_ips', {
    ip: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('banned_ips');
}
