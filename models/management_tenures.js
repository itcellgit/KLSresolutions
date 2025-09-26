module.exports = (sequelize, DataTypes) => {
  const ManagementTenure = sequelize.define(
    "management_tenures",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      tenure: {
        type: DataTypes.STRING(128),
        allowNull: false,
        validate: {
          notNull: {
            msg: "tenure is required",
          },
          notEmpty: {
            msg: "tenure cannot be empty",
          },
          len: {
            args: [1, 128],
            msg: "tenure must be between 1 and 128 characters",
          },
        },
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: {
            msg: "start_date is required",
          },
          notEmpty: {
            msg: "start_date cannot be empty",
          },
          isDate: {
            msg: "start_date must be a valid date",
          },
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "management_tenures",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Define associations
  ManagementTenure.associate = (models) => {
    // A tenure can have many member roles
    ManagementTenure.hasMany(models.MemberRole, {
      foreignKey: "tenure_id",
      sourceKey: "id",
    });

    // A tenure can have many BOM resolutions
    ManagementTenure.hasMany(models.BOMResolution, {
      foreignKey: "tenure_id",
      sourceKey: "id",
    });
  };

  return ManagementTenure;
};
