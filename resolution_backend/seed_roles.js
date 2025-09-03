const { Role } = require("./models");
const roles = [
  { id: 1, role_name: "chairman" },
  { id: 2, role_name: "president" },
  { id: 3, role_name: "vice president" },
  { id: 4, role_name: "member" },
  { id: 5, role_name: "secretary" }
];

(async () => {
  for (const role of roles) {
    await Role.findOrCreate({ where: { id: role.id }, defaults: role });
  }
  console.log("Roles seeded successfully.");
  process.exit();
})();
