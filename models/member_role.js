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
        validate: {
          notNull: {
            msg: "member_id is required",
          },
          notEmpty: {
            msg: "member_id cannot be empty",
          },
          isInt: {
            msg: "member_id must be an integer",
          },
        },
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "role_id is required",
          },
          notEmpty: {
            msg: "role_id cannot be empty",
          },
          isInt: {
            msg: "role_id must be an integer",
          },
        },
      },
      level: {
        type: DataTypes.STRING(5),
        allowNull: false,
        validate: {
          notNull: {
            msg: "level is required",
          },
          notEmpty: {
            msg: "level cannot be empty",
          },
          len: {
            args: [1, 5],
            msg: "level must be between 1 and 5 characters",
          },
        },
      },
      institute_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Optional - BOM roles are not related to any institute
        validate: {
          isInt: {
            msg: "institute_id must be an integer when provided",
          },
        },
      },
      tenure_id: {
        type: DataTypes.BIGINT,
        allowNull: true, // Optional - some roles might not be tenure-based
        validate: {
          isInt: {
            msg: "tenure_id must be an integer when provided",
          },
        },
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notNull: {
            msg: "status is required",
          },
          notEmpty: {
            msg: "status cannot be empty",
          },
          len: {
            args: [1, 20],
            msg: "status must be between 1 and 20 characters",
          },
          isIn: {
            args: [["active", "inactive"]],
            msg: 'status must be either "active" or "inactive"',
          },
        },
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
      as: "role",
    });

    MemberRole.belongsTo(models.Member, {
      foreignKey: "member_id",
      targetKey: "id",
    });

    // Associate MemberRole with Institute so include: { model: Institute, as: 'institute' } works
    MemberRole.belongsTo(models.Institute, {
      foreignKey: "institute_id",
      targetKey: "id",
      as: "institute",
    });

    MemberRole.belongsTo(models.ManagementTenure, {
      foreignKey: "tenure_id",
      targetKey: "id",
      // Keep legacy alias used by frontend to avoid breaking changes
      as: "managementTenure",
    });
  };

  return MemberRole;
};
