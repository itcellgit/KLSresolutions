const { UserType, Role, User } = require('./models');
const bcrypt = require('bcrypt');

async function seed() {
  // Seed user types
  await UserType.bulkCreate([
    { id: 1, name: 'admin' },
    { id: 2, name: 'institute admin' },
    { id: 3, name: 'member' }
  ], { ignoreDuplicates: true });

  // Seed roles
  await Role.bulkCreate([
    { id: 1, role_name: 'Member' },
    { id: 2, role_name: 'Chairman' },
    { id: 3, role_name: 'President' },
    { id: 4, role_name: 'Vice Chairman' },
    { id: 5, role_name: 'Secretary' }
  ], { ignoreDuplicates: true });

  // Seed admin user
  const password = await bcrypt.hash('password123@', 10);
  await User.findOrCreate({
    where: { username: 'klsadmin@klsbelagavi.org' },
    defaults: {
      password,
      usertypeid: 1,
      institute_id: null
    }
  });

  console.log('Seeded user types, roles, and admin user.');
}

seed().then(() => process.exit());
