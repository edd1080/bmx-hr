import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function createAdmin() {
  const args = process.argv.slice(2);
  const username = args[0] || "admin.general";
  const name = args[1] || "Administrador General";
  const password = args[2] || "Admin123!";

  console.log(`👤 Creando usuario Administrador General: "${username}"...`);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      isHR: true,
      activo: true,
      mustChangePassword: false,
    },
    create: {
      username,
      name,
      passwordHash,
      isHR: true,
      activo: true,
      mustChangePassword: false,
      category: "CONFIDENCIAL",
      area: "Gente & Gestión",
      puesto: "Administrador General de Plataforma",
      empresa: "SANBIA",
    },
  });

  console.log(`✅ Usuario Creado Exitosamente:`);
  console.log(`   - ID: ${user.id}`);
  console.log(`   - Usuario: ${user.username}`);
  console.log(`   - Nombre: ${user.name}`);
  console.log(`   - Contraseña: ${password}`);
  console.log(`   - Permisos Admin (isHR): ${user.isHR}`);
}

createAdmin()
  .catch((e) => {
    console.error("Error al crear usuario admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
