module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "agm",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      institute_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: "institutes",
            key: "id",
          },
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING(256),
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
      timestamps: true,
    }
  );
};
