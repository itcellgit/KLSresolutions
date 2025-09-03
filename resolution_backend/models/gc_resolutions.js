module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "gc_resolutions",
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
      institute_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      dom: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: "gc_resolutions",
      timestamps: false,
    }
  );
};
