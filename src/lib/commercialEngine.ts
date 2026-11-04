/**
 * Motor Comercial Táctico - Mercado Pago Quintana Roo
 * Implementa las reglas estrictas de medición comercial local:
 * - Desacoplamiento de toques (esfuerzo), cobertura (comercios únicos) y avances.
 * - Sin backend, sin APIs externas, almacenamiento local.
 * - Candado estricto: Ganado solo tras visita presencial realizada.
 */

export type Channel = 'llamada' | 'whatsapp' | 'correo_1a1' | 'visita';

export type Stage = 'calificacion' | 'negociacion' | 'closing_deal' | 'ganado' | 'perdido';

export type CallOutcome = 'no_conecto' | 'sin_avance' | 'pidio_visita' | 'visita_agendada' | 'acepto_verbalmente';
export type WhatsAppOutcome = 'sin_respuesta' | 'respondio' | 'pidio_llamada' | 'visita_agendada';
export type EmailOutcome = 'enviado' | 'respondio' | 'visita_agendada';
export type VisitOutcome = 'agendada' | 'visita_realizada' | 'visita_no_concretada' | 'cierre_ganado';

export interface CommercialBusiness {
  id: string;
  name: string;
  industry: string;
  city: string;
  stage: Stage;
  createdAt: string; // ISO string
}

export interface CommercialActivity {
  id: string;
  businessId: string;
  channel: Channel;
  date: string; // ISO string o YYYY-MM-DD
  connected?: boolean;
  outcome: string;
  comment?: string;
  advancement?: 'visita_agendada' | 'cierre_ganado';
}

export interface YAMMCampaign {
  id: string;
  name: string;
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

/**
 * Validador de avance a Ganado:
 * Un negocio solo puede marcarse como Ganado después de realizar la visita presencial al local.
 */
export function canTransitionToWon(
  business: CommercialBusiness,
  activities: CommercialActivity[]
): { allowed: boolean; reason?: string } {
  const businessActivities = activities.filter(a => a.businessId === business.id);
  const hasRealizedVisit = businessActivities.some(
    a => a.channel === 'visita' && (a.outcome === 'visita_realizada' || a.outcome === 'cierre_ganado')
  );

  if (!hasRealizedVisit) {
    return {
      allowed: false,
      reason: 'Un negocio solo puede marcarse como Ganado después de realizar la visita presencial al local. Una aceptación verbal es Closing Deal / visita pendiente.'
    };
  }

  return { allowed: true };
}

/**
 * Formatea porcentaje seguro con guarda para denominador cero.
 * Nunca produce #DIV/0! ni NaN.
 */
export function formatSafeRate(numerator: number, denominator: number): string {
  if (!denominator || denominator <= 0) return '—';
  const pct = Math.round((numerator / denominator) * 100);
  return `${pct}%`;
}

/**
 * Calcula el motor de métricas comerciales para un periodo específico
 */
export function computeCommercialMetrics(params: {
  businesses: CommercialBusiness[];
  activities: CommercialActivity[];
  periodStart: string; // ISO date string (inicio inclusive)
  periodEnd: string;   // ISO date string (fin inclusive)
  dailyActivityGoal?: number; // default 15
  dailyProspectsTarget?: number; // default 8
}) {
  const {
    businesses,
    activities,
    periodStart,
    periodEnd,
    dailyActivityGoal = 15,
    dailyProspectsTarget = 8
  } = params;

  const startMs = new Date(periodStart).getTime();
  const endMs = new Date(periodEnd).getTime();

  // Filtrar actividades en el rango
  const periodActivities = activities.filter(a => {
    const t = new Date(a.date).getTime();
    return t >= startMs && t <= endMs;
  });

  // Filtrar prospectos creados en el rango
  const newBusinesses = businesses.filter(b => {
    const t = new Date(b.createdAt).getTime();
    return t >= startMs && t <= endMs;
  });

  // 1. Toques brutos (Esfuerzo del periodo)
  const totalTouches = periodActivities.length;
  const touchesByChannel = {
    llamada: periodActivities.filter(a => a.channel === 'llamada').length,
    whatsapp: periodActivities.filter(a => a.channel === 'whatsapp').length,
    correo_1a1: periodActivities.filter(a => a.channel === 'correo_1a1').length,
    visita: periodActivities.filter(a => a.channel === 'visita').length
  };

  // Excedente de actividad sobre meta diaria
  const overachievement = Math.max(0, totalTouches - dailyActivityGoal);

  // 2. Cobertura: Comercios únicos trabajados (Deduplicados estrictamente por ID)
  const uniqueBusinessIdsWorked = new Set(periodActivities.map(a => a.businessId));
  const uniqueBusinessesWorked = uniqueBusinessIdsWorked.size;

  // 3. Prospectos nuevos creados en el periodo
  const newProspectsCount = newBusinesses.length;

  // 4. Canal Llamadas
  const llamadas = periodActivities.filter(a => a.channel === 'llamada');
  const llamadasRealizadas = llamadas.length;
  const llamadasConectadas = llamadas.filter(a => a.connected === true).length;
  const llamadasVisitasAgendadas = llamadas.filter(a => a.outcome === 'visita_agendada' || a.advancement === 'visita_agendada').length;

  // 5. Canal WhatsApp
  const wa = periodActivities.filter(a => a.channel === 'whatsapp');
  const waToques = wa.length;
  const waRespuestas = wa.filter(a => a.outcome === 'respondio' || a.outcome === 'pidio_llamada' || a.outcome === 'visita_agendada').length;
  const waPidieronLlamada = wa.filter(a => a.outcome === 'pidio_llamada').length;
  const waVisitasAtribuidas = wa.filter(a => a.outcome === 'visita_agendada' || a.advancement === 'visita_agendada').length;

  // 6. Canal Correo 1:1
  const correos = periodActivities.filter(a => a.channel === 'correo_1a1');
  const correosEnviados = correos.length;
  const correosRespuestas = correos.filter(a => a.outcome === 'respondio' || a.outcome === 'visita_agendada').length;
  const correosVisitasAtribuidas = correos.filter(a => a.outcome === 'visita_agendada' || a.advancement === 'visita_agendada').length;

  // 7. Canal Visitas
  const visitas = periodActivities.filter(a => a.channel === 'visita');
  const visitasAgendadas = llamadasVisitasAgendadas + waVisitasAtribuidas + correosVisitasAtribuidas + visitas.filter(a => a.outcome === 'agendada').length;
  const visitasRealizadas = visitas.filter(a => a.outcome === 'visita_realizada' || a.outcome === 'cierre_ganado').length;
  const visitasNoConcretadas = visitas.filter(a => a.outcome === 'visita_no_concretada').length;
  const cierresGanados = visitas.filter(a => a.outcome === 'cierre_ganado' || a.advancement === 'cierre_ganado').length;

  // 8. Negocios únicos con avance
  const negociosConAvance = new Set<string>();
  periodActivities.forEach(a => {
    if (
      a.outcome === 'visita_agendada' ||
      a.outcome === 'acepto_verbalmente' ||
      a.outcome === 'visita_realizada' ||
      a.outcome === 'cierre_ganado' ||
      a.advancement
    ) {
      negociosConAvance.add(a.businessId);
    }
  });

  // 9. Cálculo de promedio de toques hasta cita / cierre desde el historial de cada comercio
  let touchesToVisitSum = 0;
  let touchesToVisitCount = 0;
  let touchesToWonSum = 0;
  let touchesToWonCount = 0;

  businesses.forEach(b => {
    const bActs = activities
      .filter(a => a.businessId === b.id)
      .sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());

    let countVisit = 0;
    let visitFound = false;

    let countWon = 0;
    let wonFound = false;

    for (const act of bActs) {
      if (!visitFound) countVisit++;
      if (!wonFound) countWon++;

      if (!visitFound && (act.outcome === 'visita_agendada' || act.channel === 'visita')) {
        visitFound = true;
      }

      if (!wonFound && (act.outcome === 'cierre_ganado' || b.stage === 'ganado')) {
        wonFound = true;
      }
    }

    if (visitFound) {
      touchesToVisitSum += countVisit;
      touchesToVisitCount++;
    }

    if (wonFound) {
      touchesToWonSum += countWon;
      touchesToWonCount++;
    }
  });

  const promedioToquesHastaVisita = touchesToVisitCount > 0 ? Number((touchesToVisitSum / touchesToVisitCount).toFixed(1)) : null;
  const promedioToquesHastaCierre = touchesToWonCount > 0 ? Number((touchesToWonSum / touchesToWonCount).toFixed(1)) : null;

  return {
    totalTouches,
    touchesByChannel,
    dailyActivityGoal,
    overachievement,
    uniqueBusinessesWorked,
    uniqueBusinessIdsWorked: Array.from(uniqueBusinessIdsWorked),
    newProspectsCount,
    dailyProspectsTarget,

    // Llamadas
    llamadas: {
      realizadas: llamadasRealizadas,
      conectadas: llamadasConectadas,
      tasaConexion: llamadasRealizadas > 0 ? llamadasConectadas / llamadasRealizadas : null,
      tasaConexionStr: formatSafeRate(llamadasConectadas, llamadasRealizadas),
      visitasAgendadas: llamadasVisitasAgendadas,
      conversionVisita: llamadasConectadas > 0 ? llamadasVisitasAgendadas / llamadasConectadas : null,
      conversionVisitaStr: formatSafeRate(llamadasVisitasAgendadas, llamadasConectadas)
    },

    // WhatsApp
    whatsapp: {
      toques: waToques,
      respuestas: waRespuestas,
      tasaRespuesta: waToques > 0 ? waRespuestas / waToques : null,
      tasaRespuestaStr: formatSafeRate(waRespuestas, waToques),
      pidieronLlamada: waPidieronLlamada,
      visitasAtribuidas: waVisitasAtribuidas
    },

    // Correo 1:1
    correo1a1: {
      enviados: correosEnviados,
      respuestas: correosRespuestas,
      tasaRespuesta: correosEnviados > 0 ? correosRespuestas / correosEnviados : null,
      tasaRespuestaStr: formatSafeRate(correosRespuestas, correosEnviados),
      visitasAtribuidas: correosVisitasAtribuidas
    },

    // Visitas
    visitas: {
      agendadas: visitasAgendadas,
      realizadas: visitasRealizadas,
      noConcretadas: visitasNoConcretadas,
      cierresGanados,
      tasaCierre: visitasRealizadas > 0 ? cierresGanados / visitasRealizadas : null,
      tasaCierreStr: formatSafeRate(cierresGanados, visitasRealizadas)
    },

    // Avances globales
    negociosConAvanceCount: negociosConAvance.size,
    promedioToquesHastaVisita,
    promedioToquesHastaCierre
  };
}
