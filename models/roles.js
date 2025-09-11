module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
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

  // Define association
  Role.associate = (models) => {
    Role.hasMany(models.member_role, {
      foreignKey: "role_id",
      sourceKey: "id",
    });
  };

  return Role;
};
