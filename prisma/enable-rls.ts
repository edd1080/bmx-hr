import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const TABLES = [
  "User",
  "LeaveRequest",
  "Notification",
  "Meta",
  "MetaAvance",
  "Post",
  "Course",
  "Ruta",
  "RutaCurso",
  "Ticket",
  "TicketComment",
  "Beneficio",
  "Question",
  "ExamAttempt",
  "Enrollment",
  "Lesson",
  "ImportRun",
  "Direccion",
  "Posicion",
  "OnboardingConfig",
  "OnboardingSession",
  "NuevoIngreso",
  "PlanSesion",
  "Documento",
  "DocumentoDestinatario",
  "Firma",
  "PushSubscription",
  "Evento",
  "EventoRSVP",
  "Encuesta",
  "EncuestaOpcion",
  "EncuestaVoto",
  "Reconocimiento",
];

async function main() {
  console.log("🔒 Habilitando Row Level Security (RLS) en todas las tablas de Supabase PostgreSQL...");

  for (const table of TABLES) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`  ✓ RLS habilitado en tabla "${table}"`);
    } catch (error) {
      console.error(`  ✕ Error al habilitar RLS en tabla "${table}":`, error);
    }
  }

  console.log("✨ Habilitación de RLS completada exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error al ejecutar RLS script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
