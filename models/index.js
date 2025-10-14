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
const AGM = require("./agm")(sequelize, DataTypes);
const ManagementTenure = require("./management_tenures")(sequelize, DataTypes);

// Associations
UserType.hasMany(User, { foreignKey: "usertypeid" });
User.belongsTo(UserType, { foreignKey: "usertypeid" });
User.hasOne(Member, { foreignKey: "userid" });
Member.belongsTo(User, { foreignKey: "userid" });
Institute.hasMany(GCResolution, { foreignKey: "institute_id" });
GCResolution.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(User, { foreignKey: "institute_id" });
User.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(MemberRole, { foreignKey: "institute_id" });
// Keep MemberRole <-> ManagementTenure and MemberRole <-> Role associations
// consistent with aliases defined in models/member_role.js
MemberRole.belongsTo(ManagementTenure, {
  foreignKey: "tenure_id",
  as: "tenure",
});
ManagementTenure.hasMany(MemberRole, { foreignKey: "tenure_id" });
Role.hasMany(MemberRole, { foreignKey: "role_id" });
MemberRole.belongsTo(Role, { foreignKey: "role_id", as: "role" });
Member.hasMany(MemberRole, { foreignKey: "member_id" });
MemberRole.belongsTo(Member, { foreignKey: "member_id", as: "member" });
// Ensure Institute association alias matches model file
Institute.hasMany(MemberRole, { foreignKey: "institute_id" });
MemberRole.belongsTo(Institute, {
  foreignKey: "institute_id",
  as: "institute",
});
// Simple many-to-one relationships (no through table needed)
GCResolution.belongsTo(ManagementTenure, { foreignKey: "tenure_id" });
ManagementTenure.hasMany(GCResolution, { foreignKey: "tenure_id" });
BOMResolution.belongsTo(ManagementTenure, { foreignKey: "tenure_id" });
ManagementTenure.hasMany(BOMResolution, { foreignKey: "tenure_id" });

// Call associate methods if present (for model-defined associations)
const models = {
  UserType,
  User,
  Member,
  Role,
  MemberRole,
  Institute,
  GCResolution,
  BOMResolution,
  AGM,
  ManagementTenure,
};
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

// Sync database
sequelize
  .sync({ alter: true }) // or { force: true } to drop and recreate tables
  .then(() => {
    console.log("Database synced!");
  })
  .catch((err) => {
    console.error("Sync error:", err);
  });

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
  AGM,
  ManagementTenure,
};
