module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
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
      gc_resolution_id: {
        type: DataTypes.BIGINT,
      },
      bom_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      bom_no: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "bom_resolutions",
      timestamps: false,
    }
  );
};
