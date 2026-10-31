export const DEFAULT_INDUSTRIES = [
  "Alimentos y Bebidas (Restaurantes, Bares, Beach Clubs)",
  "Servicios Profesionales y de Salud (Clínicas, Médicos, Dentistas)",
  "Viajes y Turismo (Tours, Marinas, Hoteles Boutique, Yates)",
  "Mueblerías y Decoración de Interiores",
  "Retail y Comercio (Tiendas, Minisúpers, Boutiques)",
  "Talleres, Autopartes y Gasolineras",
  "Entretenimiento y Eventos",
  "Gimnasios y Bienestar / Spas",
  "Educación y Escuelas",
  "Servicios Corporativos y B2B",
];

export const getIndustries = (): string[] => {
  try {
    const saved = localStorage.getItem("tono_custom_industries");
    if (saved) {
      const custom: string[] = JSON.parse(saved);
      return Array.from(new Set([...DEFAULT_INDUSTRIES, ...custom]));
    }
  } catch (e) {
    console.error("Error reading custom industries:", e);
  }
  return DEFAULT_INDUSTRIES;
};

export const saveCustomIndustry = (industry: string): string[] => {
  const trimmed = industry.trim();
  if (!trimmed) return getIndustries();
  
  try {
    const saved = localStorage.getItem("tono_custom_industries");
    const custom: string[] = saved ? JSON.parse(saved) : [];
    if (!custom.includes(trimmed)) {
      custom.push(trimmed);
      localStorage.setItem("tono_custom_industries", JSON.stringify(custom));
    }
    return Array.from(new Set([...DEFAULT_INDUSTRIES, ...custom]));
  } catch (e) {
    console.error("Error saving custom industry:", e);
    return getIndustries();
  }
};
