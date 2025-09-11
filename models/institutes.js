module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "institutes",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
      phone: {
        type: DataTypes.BIGINT,
      },
      code: {
        type: DataTypes.STRING(10), // Added code column
        allowNull: true,
      },
    },
    {
      tableName: "institutes",
      timestamps: false,
    }
  );
};
