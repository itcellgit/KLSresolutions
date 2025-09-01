module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "users",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
      usertypeid: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "users",
      timestamps: false,
    }
  );
};
