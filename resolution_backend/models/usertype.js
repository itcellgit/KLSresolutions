module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "usertype",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
    },
    {
      tableName: "usertype",
      timestamps: false,
    }
  );
};
