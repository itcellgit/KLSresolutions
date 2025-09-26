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
      gc_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      gc_no: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      agenda_section: {
        type: DataTypes.STRING,
        allowNull: true,
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
