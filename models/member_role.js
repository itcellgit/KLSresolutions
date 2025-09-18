module.exports = (sequelize, DataTypes) => {
  const MemberRole = sequelize.define(
    "member_role",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
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

  // Define association

  MemberRole.associate = (models) => {
    MemberRole.belongsTo(models.Role, {
      foreignKey: "role_id",
      targetKey: "id",
    });

    MemberRole.belongsTo(models.Member, {
      foreignKey: "member_id",
      targetKey: "id",
    });
  };

  return MemberRole;
};
