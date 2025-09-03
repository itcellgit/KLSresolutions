module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "member_role",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
      },
      member_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      level: {
        type: DataTypes.STRING(5),
        allowNull: false,
      },
      institute_id: {
        type: DataTypes.INTEGER,
      },
      tenure: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
    },
    {
      tableName: "member_role",
      timestamps: false,
    }
  );
};
