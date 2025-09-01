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
    },
    {
      tableName: "institutes",
      timestamps: false,
    }
  );
};
