"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add tenure_id column to bom_resolutions table
    await queryInterface.addColumn("bom_resolutions", "tenure_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: "management_tenures",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add foreign key constraint
    await queryInterface.addConstraint("bom_resolutions", {
      fields: ["tenure_id"],
      type: "foreign key",
      name: "fk_bom_resolutions_tenure_id",
      references: {
        table: "management_tenures",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraint
    await queryInterface.removeConstraint(
      "bom_resolutions",
      "fk_bom_resolutions_tenure_id"
    );

    // Remove tenure_id column from bom_resolutions table
    await queryInterface.removeColumn("bom_resolutions", "tenure_id");
  },
};
