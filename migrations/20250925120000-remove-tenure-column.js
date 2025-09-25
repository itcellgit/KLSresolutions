"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the tenure column from member_role table as it's replaced by tenure_id
    await queryInterface.removeColumn("member_role", "tenure");
  },

  async down(queryInterface, Sequelize) {
    // Add back the tenure column if rollback is needed
    await queryInterface.addColumn("member_role", "tenure", {
      type: Sequelize.STRING(128),
      allowNull: true,
    });
  },
};
