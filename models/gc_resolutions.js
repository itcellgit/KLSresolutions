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
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      resolution: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      compliance: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      meeting_notes: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      institute_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      gc_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
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
      tableName: "gc_resolutions",
      timestamps: false,
    }
  );
};
