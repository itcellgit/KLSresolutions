module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "users",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // optional, for clarity
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
      institute_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "institutes",
          key: "id",
        },
      },
    },
    {
      tableName: "users",
      timestamps: false,
    }
  );
};
