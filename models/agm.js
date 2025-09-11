module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "agm",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      agm_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      agenda: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "agm",
      timestamps: false,
    }
  );
};
