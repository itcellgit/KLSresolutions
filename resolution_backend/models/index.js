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
GCResolution.hasMany(BOMResolution, { foreignKey: "gc_resolution_id" });
BOMResolution.belongsTo(GCResolution, { foreignKey: "gc_resolution_id" });
Institute.hasMany(User, { foreignKey: "institute_id" });
User.belongsTo(Institute, { foreignKey: "institute_id" });

Institute.hasMany(AGM, { foreignKey: "institute_id" });
AGM.belongsTo(Institute, { foreignKey: "institute_id" });

// Add these missing MemberRole associations
Member.belongsToMany(Role, {
  through: MemberRole,
  foreignKey: "member_id",
  otherKey: "role_id",
});
Role.belongsToMany(Member, {
  through: MemberRole,
  foreignKey: "role_id",
  otherKey: "member_id",
});

// MemberRole belongs to Member and Role
MemberRole.belongsTo(Member, { foreignKey: "member_id" });
MemberRole.belongsTo(Role, { foreignKey: "role_id" });
MemberRole.belongsTo(Institute, { foreignKey: "institute_id" });

// Member and Role have many MemberRoles
Member.hasMany(MemberRole, { foreignKey: "member_id" });
Role.hasMany(MemberRole, { foreignKey: "role_id" });
Institute.hasMany(MemberRole, { foreignKey: "institute_id" });

// ManagementTenure associations (keep existing ones)
ManagementTenure.hasMany(MemberRole, { foreignKey: "tenure_id" });
MemberRole.belongsTo(ManagementTenure, {
  foreignKey: "tenure_id",
  as: "managementTenure",
});

// Add ManagementTenure associations with other models
ManagementTenure.hasMany(GCResolution, { foreignKey: "tenure_id" });
GCResolution.belongsTo(ManagementTenure, { foreignKey: "tenure_id" });

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
