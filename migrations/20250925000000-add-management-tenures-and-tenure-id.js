"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create management_tenures table
    await queryInterface.createTable("management_tenures", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tenure: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add tenure_id column to member_role table
    await queryInterface.addColumn("member_role", "tenure_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: "management_tenures",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Modify the existing tenure column to be nullable (optional change)
    await queryInterface.changeColumn("member_role", "tenure", {
      type: Sequelize.STRING(128),
      allowNull: true,
    });

    // Add foreign key constraint
    await queryInterface.addConstraint("member_role", {
      fields: ["tenure_id"],
      type: "foreign key",
      name: "fk_member_role_tenure_id",
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
      "member_role",
      "fk_member_role_tenure_id"
    );

    // Remove tenure_id column from member_role table
    await queryInterface.removeColumn("member_role", "tenure_id");

    // Revert tenure column to not nullable
    await queryInterface.changeColumn("member_role", "tenure", {
      type: Sequelize.STRING(128),
      allowNull: false,
    });

    // Drop management_tenures table
    await queryInterface.dropTable("management_tenures");
  },
};
