module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "bom_resolutions",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
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
      gc_resolution_id: {
        type: DataTypes.BIGINT,
      },
      dom: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: "bom_resolutions",
      timestamps: false,
    }
  );
};
