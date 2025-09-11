module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "members",
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
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
      },
      userid: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "members",
      timestamps: false,
    }
  );
};
