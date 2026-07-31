import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function upsertUser(data: {
  employeeCode: string;
  name: string;
  email: string;
  username: string;
  password: string;
  isHR?: boolean;
  area?: string;
  departamento?: string;
  category?: "ADMINISTRATIVO" | "OPERATIVO";
  vacationDaysAssigned?: number;
  managerCode?: string;
  mustChangePassword?: boolean;
  curp?: string;
  hireDate?: Date;
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  let managerId: string | undefined;
  if (data.managerCode) {
    const manager = await prisma.user.findUnique({
      where: { employeeCode: data.managerCode },
    });
    managerId = manager?.id;
  }

  return prisma.user.upsert({
    where: { employeeCode: data.employeeCode },
    update: {
      name: data.name,
      email: data.email,
      isHR: data.isHR ?? false,
      area: data.area,
      departamento: data.departamento,
      category: data.category ?? "ADMINISTRATIVO",
      vacationDaysAssigned: data.vacationDaysAssigned ?? 12,
      managerId,
      curp: data.curp,
      hireDate: data.hireDate,
    },
    create: {
      employeeCode: data.employeeCode,
      name: data.name,
      email: data.email,
      username: data.username,
      passwordHash,
      isHR: data.isHR ?? false,
      area: data.area,
      departamento: data.departamento,
      category: data.category ?? "ADMINISTRATIVO",
      vacationDaysAssigned: data.vacationDaysAssigned ?? 12,
      managerId,
      mustChangePassword: data.mustChangePassword ?? false,
      curp: data.curp,
      hireDate: data.hireDate,
    },
  });
}

async function main() {
  await upsertUser({
    employeeCode: "HR001",
    name: "Andrea Ruiz",
    email: "andrea.ruiz@empresa.com",
    username: "andrea.ruiz",
    password: "Prueba123",
    isHR: true,
    area: "Gente y Gestión",
    departamento: "Recursos Humanos",
    vacationDaysAssigned: 15,
    hireDate: new Date("2019-02-01T00:00:00Z"),
  });

  await upsertUser({
    employeeCode: "MGR001",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@empresa.com",
    username: "carlos.mendoza",
    password: "Prueba123",
    area: "Comercial",
    departamento: "Ventas",
    vacationDaysAssigned: 14,
    managerCode: "HR001",
    hireDate: new Date("2020-05-10T00:00:00Z"),
  });

  await upsertUser({
    employeeCode: "EMP001",
    name: "Laura Torres",
    email: "laura.torres@empresa.com",
    username: "laura.torres",
    password: "Prueba123",
    area: "Comercial",
    departamento: "Ventas",
    vacationDaysAssigned: 12,
    managerCode: "MGR001",
    curp: "TOLA900101MDFRRR05",
    hireDate: new Date("2022-03-15T00:00:00Z"),
  });

  await upsertUser({
    employeeCode: "EMP002",
    name: "Jorge Ramírez",
    email: "jorge.ramirez@empresa.com",
    username: "jorge.ramirez",
    password: "CambiarAhora1",
    area: "Operaciones",
    departamento: "Producción",
    category: "OPERATIVO",
    vacationDaysAssigned: 10,
    managerCode: "MGR001",
    mustChangePassword: true,
    hireDate: new Date("2023-01-09T00:00:00Z"),
  });

  // Same departamento as Jorge (Producción) — lets us test the operational
  // overlap alert when both are absent on the same day.
  await upsertUser({
    employeeCode: "EMP003",
    name: "Luis Ortega",
    email: "luis.ortega@empresa.com",
    username: "luis.ortega",
    password: "Prueba123",
    area: "Operaciones",
    departamento: "Producción",
    category: "OPERATIVO",
    vacationDaysAssigned: 12,
    managerCode: "MGR001",
    hireDate: new Date("2021-08-20T00:00:00Z"),
  });

  await upsertUser({
    employeeCode: "EMP004",
    name: "Sofía Herrera",
    email: "sofia.herrera@empresa.com",
    username: "sofia.herrera",
    password: "Prueba123",
    area: "Mercadotecnia",
    departamento: "Diseño",
    vacationDaysAssigned: 16,
    managerCode: "MGR001",
    hireDate: new Date("2021-11-02T00:00:00Z"),
  });

  console.log("Seed completado. Usuarios de prueba:");
  console.log("  andrea.ruiz / Prueba123    (Gente y Gestión)");
  console.log("  carlos.mendoza / Prueba123 (Jefe, equipo: Laura, Jorge, Luis, Sofía)");
  console.log("  laura.torres / Prueba123   (Colaboradora, administrativo, Ventas)");
  console.log("  sofia.herrera / Prueba123  (Colaboradora, administrativo, Diseño)");
  console.log("  jorge.ramirez / CambiarAhora1 (Colaborador, operativo, Producción — sin Early Friday, primer login fuerza cambio de contraseña)");
  console.log("  luis.ortega / Prueba123    (Colaborador, operativo, Producción — mismo depto que Jorge, para probar alertas de solapamiento)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
