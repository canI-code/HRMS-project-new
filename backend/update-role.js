db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "hr_admin" } }
);

const user = db.users.findOne(
  { email: "admin@example.com" },
  { email: 1, role: 1, isActive: 1 }
);

print(JSON.stringify(user, null, 2));
