const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();
const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    dialect: "postgres",
  }
);

const UserType = require("./usertype")(sequelize, DataTypes);
const User = require("./users")(sequelize, DataTypes);
const Member = require("./members")(sequelize, DataTypes);
const Role = require("./roles")(sequelize, DataTypes);
const MemberRole = require("./member_role")(sequelize, DataTypes);
const Institute = require("./institutes")(sequelize, DataTypes);
const GCResolution = require("./gc_resolutions")(sequelize, DataTypes);
const BOMResolution = require("./bom_resolutions")(sequelize, DataTypes);

// Associations
UserType.hasMany(User, { foreignKey: "usertypeid" });
User.belongsTo(UserType, { foreignKey: "usertypeid" });
User.hasOne(Member, { foreignKey: "userid" });
Member.belongsTo(User, { foreignKey: "userid" });
Institute.hasMany(GCResolution, { foreignKey: "institute_id" });
GCResolution.belongsTo(Institute, { foreignKey: "institute_id" });
GCResolution.hasMany(BOMResolution, { foreignKey: "gc_resolution_id" });
BOMResolution.belongsTo(GCResolution, { foreignKey: "gc_resolution_id" });

// Export models and sequelize instance
module.exports = {
  sequelize,
  UserType,
  User,
  Member,
  Role,
  MemberRole,
  Institute,
  GCResolution,
  BOMResolution,
};
