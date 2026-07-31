import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function createColaborador() {
  const args = process.argv.slice(2);
  const username = args[0] || "colaborador.prueba";
  const name = args[1] || "Colaborador Prueba";
  const password = args[2] || "asdf123";

  console.log(`👤 Creando usuario Colaborador: "${username}"...`);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      isHR: false,
      activo: true,
      mustChangePassword: false,
    },
    create: {
      username,
      name,
      passwordHash,
      isHR: false,
      activo: true,
      mustChangePassword: false,
      category: "OPERATIVO",
      area: "General",
      puesto: "Colaborador",
      empresa: "SANBIA",
    },
  });

  console.log(`✅ Colaborador Creado Exitosamente:`);
  console.log(`   - ID: ${user.id}`);
  console.log(`   - Usuario: ${user.username}`);
  console.log(`   - Nombre: ${user.name}`);
  console.log(`   - Contraseña: ${password}`);
  console.log(`   - Tipo: Colaborador (isHR: ${user.isHR})`);
}

createColaborador()
  .catch((e) => {
    console.error("Error al crear colaborador:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
