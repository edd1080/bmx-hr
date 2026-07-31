const TITLES: Record<string, { crumb: string; title: string }> = {
  "/dashboard": { crumb: "", title: "Inicio" },
  "/equipo": { crumb: "Jefe inmediato", title: "Dashboard del equipo" },
  "/equipo/metas": { crumb: "Jefe inmediato", title: "Metas de mi equipo" },
  "/metas": { crumb: "", title: "Gestión de Metas" },
  "/comunicacion": { crumb: "", title: "Comunicación" },
  "/capacitacion": { crumb: "", title: "Capacitación" },
  "/venta-empleados": { crumb: "", title: "Venta Empleados" },
  "/beneficios": { crumb: "", title: "Beneficios" },
  "/mesa-ayuda": { crumb: "", title: "Mesa de Ayuda" },
  "/firma": { crumb: "", title: "Firma Electrónica" },
  "/perfil": { crumb: "", title: "Mi Perfil" },
  "/organigrama": { crumb: "", title: "Organigrama" },
  "/admin": { crumb: "Gente y Gestión", title: "Panel maestro" },
  "/admin/colaboradores": { crumb: "Gente y Gestión", title: "Colaboradores" },
  "/admin/metas": { crumb: "Gente y Gestión", title: "Metas de la compañía" },
  "/admin/solicitudes": { crumb: "Gente y Gestión", title: "Gestión de solicitudes" },
  "/admin/constancias": { crumb: "Gente y Gestión", title: "Constancias" },
  "/admin/importar": { crumb: "Gente y Gestión", title: "Importar base de datos" },
  "/cambiar-password": { crumb: "", title: "Cambiar contraseña" },
};

export function getViewTitle(pathname: string, roleLabel: string) {
  const match = TITLES[pathname] ?? { crumb: roleLabel, title: "" };
  return { crumb: match.crumb || roleLabel, title: match.title };
}
