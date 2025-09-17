// Script to seed default roles
// Run this once to create the default member roles

import dbConnect from "@/lib/mongodb";
import Role from "@/models/Role";

const defaultRoles = [
  {
    member: "Bronze",
    diskon: 0,
    description: "Member standar tanpa diskon",
    isActive: true,
  },
  {
    member: "Silver",
    diskon: 5,
    description: "Member silver dengan diskon 5%",
    isActive: true,
  },
  {
    member: "Gold",
    diskon: 10,
    description: "Member gold dengan diskon 10%",
    isActive: true,
  },
  {
    member: "Platinum",
    diskon: 15,
    description: "Member platinum dengan diskon 15%",
    isActive: true,
  },
  {
    member: "Diamond",
    diskon: 20,
    description: "Member diamond dengan diskon 20%",
    isActive: true,
  },
];

async function seedRoles() {
  try {
    await dbConnect();

    console.log("🌱 Seeding roles...");

    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ member: roleData.member });

      if (!existingRole) {
        const role = new Role(roleData);
        await role.save();
        console.log(`✅ Created role: ${roleData.member}`);
      } else {
        console.log(`⏭️ Role already exists: ${roleData.member}`);
      }
    }

    console.log("🎉 Roles seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
  }
}

export default seedRoles;
