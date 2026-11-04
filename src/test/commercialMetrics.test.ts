import { describe, it, expect } from "vitest";
import {
  computeCommercialMetrics,
  canTransitionToWon,
  formatSafeRate,
  CommercialBusiness,
  CommercialActivity
} from "../lib/commercialEngine";

describe("Commercial Metrics & Attribution Engine", () => {
  const today = "2026-11-04";

  it("EJEMPLO DE VALIDACIÓN: 20 llamadas al mismo comercio sin conectar", () => {
    const business: CommercialBusiness = {
      id: "MP-CANCUN-001",
      name: "Restaurante Los Mariscos Cancún",
      industry: "Restaurante & Bar",
      city: "Cancún",
      stage: "calificacion",
      createdAt: today
    };

    // 20 llamadas hoy al mismo negocio, ninguna conecta
    const activities: CommercialActivity[] = Array.from({ length: 20 }, (_, i) => ({
      id: `act-call-${i + 1}`,
      businessId: "MP-CANCUN-001",
      channel: "llamada",
      date: today,
      connected: false,
      outcome: "no_conecto"
    }));

    const metrics = computeCommercialMetrics({
      businesses: [business],
      activities,
      periodStart: today,
      periodEnd: today,
      dailyActivityGoal: 15
    });

    // Validaciones estrictas exigidas por el usuario:
    expect(metrics.totalTouches).toBe(20);
    expect(metrics.llamadas.realizadas).toBe(20);
    expect(metrics.llamadas.conectadas).toBe(0);
    expect(metrics.llamadas.tasaConexionStr).toBe("0%");
    expect(metrics.uniqueBusinessesWorked).toBe(1);
    expect(metrics.uniqueBusinessIdsWorked).toEqual(["MP-CANCUN-001"]);
    expect(metrics.negociosConAvanceCount).toBe(0);
    expect(metrics.visitas.agendadas).toBe(0);
    expect(metrics.visitas.realizadas).toBe(0);
    expect(metrics.visitas.cierresGanados).toBe(0);
    expect(metrics.overachievement).toBe(5); // 20 - 15 = 5 extra
  });

  it("Deduplica comercios únicos por ID para evitar duplicados en semana y mes", () => {
    const businesses: CommercialBusiness[] = [
      { id: "ID-101", name: "Hotel Playa Maya", industry: "Hotelería", city: "Playa del Carmen", stage: "calificacion", createdAt: "2026-11-01" },
      { id: "ID-102", name: "Clínica Dental Tulum", industry: "Salud", city: "Tulum", stage: "negociacion", createdAt: "2026-11-01" }
    ];

    const activities: CommercialActivity[] = [
      { id: "a1", businessId: "ID-101", channel: "llamada", date: "2026-11-02", connected: true, outcome: "sin_avance" },
      { id: "a2", businessId: "ID-101", channel: "whatsapp", date: "2026-11-03", outcome: "respondio" },
      { id: "a3", businessId: "ID-101", channel: "correo_1a1", date: "2026-11-04", outcome: "enviado" },
      { id: "a4", businessId: "ID-102", channel: "llamada", date: "2026-11-03", connected: true, outcome: "visita_agendada" },
      { id: "a5", businessId: "ID-102", channel: "visita", date: "2026-11-04", outcome: "visita_realizada" }
    ];

    const weeklyMetrics = computeCommercialMetrics({
      businesses,
      activities,
      periodStart: "2026-11-01",
      periodEnd: "2026-11-07"
    });

    expect(weeklyMetrics.totalTouches).toBe(5);
    expect(weeklyMetrics.uniqueBusinessesWorked).toBe(2);
    expect(weeklyMetrics.uniqueBusinessIdsWorked.sort()).toEqual(["ID-101", "ID-102"]);
  });

  it("REGLA ESTRICTA DE CIERRE: Un negocio solo puede ser Ganado tras realizar la visita al local", () => {
    const business: CommercialBusiness = {
      id: "ID-HOTEL",
      name: "Hotel Boutique Paraíso",
      industry: "Hotelería",
      city: "Tulum",
      stage: "closing_deal",
      createdAt: today
    };

    // Escenario 1: Aceptó verbalmente en llamada, pero no se ha realizado visita física
    const activitiesVerbalOnly: CommercialActivity[] = [
      { id: "a1", businessId: "ID-HOTEL", channel: "llamada", date: today, connected: true, outcome: "acepto_verbalmente" }
    ];

    const check1 = canTransitionToWon(business, activitiesVerbalOnly);
    expect(check1.allowed).toBe(false);
    expect(check1.reason).toContain("solo puede marcarse como Ganado después de realizar la visita presencial al local");

    // Escenario 2: Se registra visita física realizada
    const activitiesWithVisit: CommercialActivity[] = [
      ...activitiesVerbalOnly,
      { id: "a2", businessId: "ID-HOTEL", channel: "visita", date: today, outcome: "visita_realizada" }
    ];

    const check2 = canTransitionToWon(business, activitiesWithVisit);
    expect(check2.allowed).toBe(true);
  });

  it("Guarda contra división por cero: muestra '—' y nunca #DIV/0!", () => {
    expect(formatSafeRate(0, 0)).toBe("—");
    expect(formatSafeRate(5, 0)).toBe("—");
    expect(formatSafeRate(0, 10)).toBe("0%");
    expect(formatSafeRate(3, 10)).toBe("30%");
  });

  it("Atribución única de cita y promedio de toques por negocio", () => {
    const business: CommercialBusiness = {
      id: "MP-BACALAR",
      name: "Laguna Cabañas",
      industry: "Hotelería",
      city: "Bacalar",
      stage: "negociacion",
      createdAt: "2026-11-01"
    };

    // Recorrido multicanal:
    // 1. WhatsApp: pidió llamada
    // 2. Llamada: visita agendada (la cita se atribuye aquí)
    // 3. Visita realizada
    const activities: CommercialActivity[] = [
      { id: "m1", businessId: "MP-BACALAR", channel: "whatsapp", date: "2026-11-01", outcome: "pidio_llamada" },
      { id: "m2", businessId: "MP-BACALAR", channel: "llamada", date: "2026-11-02", connected: true, outcome: "visita_agendada" },
      { id: "m3", businessId: "MP-BACALAR", channel: "visita", date: "2026-11-03", outcome: "visita_realizada" }
    ];

    const metrics = computeCommercialMetrics({
      businesses: [business],
      activities,
      periodStart: "2026-11-01",
      periodEnd: "2026-11-05"
    });

    expect(metrics.whatsapp.pidieronLlamada).toBe(1);
    expect(metrics.whatsapp.visitasAtribuidas).toBe(0);
    expect(metrics.llamadas.visitasAgendadas).toBe(1);
    expect(metrics.visitas.realizadas).toBe(1);
    expect(metrics.promedioToquesHastaVisita).toBe(2); // Le tomó 2 toques (WA + llamada) hasta la cita
  });
});
