module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "roles",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      role_name: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
    },
    {
      tableName: "roles",
      timestamps: false,
    }
  );
};
