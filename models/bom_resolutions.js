module.exports = (sequelize, DataTypes) => {
  const BOMResolution = sequelize.define(
    "bom_resolutions",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      agenda: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      resolution: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      compliance: {
        type: DataTypes.TEXT,
      },
      bom_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      // bom_no: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      //   unique: true,
      // },
      // agenda_section: {
      //   type: DataTypes.STRING,
      //   allowNull: true,
      // },
      tenure_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "management_tenures",
          key: "id",
        },
      },
    },
    {
      tableName: "bom_resolutions",
      timestamps: false,
    }
  );

  // Define associations
  BOMResolution.associate = (models) => {
    // BOM Resolution belongs to a Management Tenure
    BOMResolution.belongsTo(models.ManagementTenure, {
      foreignKey: "tenure_id",
      as: "managementTenure",
    });
  };

  return BOMResolution;
};
