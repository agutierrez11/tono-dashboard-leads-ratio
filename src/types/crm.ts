export type TouchType = "whatsapp" | "call" | "visit" | "email";

export interface TouchLog {
  id: string;
  type: TouchType;
  date: string; // ISO String
  note?: string;
}

export type LeadStage =
  | "new"
  | "contacted"
  | "visit"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export interface CrmLead {
  id: string;
  name: string;
  company: string;
  contact_person?: string;
  phone: string;
  phone_intl?: string;
  whatsapp_link?: string;
  email?: string;
  website_or_ig?: string;
  address_full?: string;
  street_and_number?: string;
  neighborhood?: string;
  postal_code?: string;
  city?: string;
  state?: string;
  industry: string;
  mcc?: string;
  product_opportunity?: string;
  tpv_monthly?: number;
  quality_points?: number;
  operational_pain?: string;
  opening_hook?: string;
  stage: LeadStage;
  // Tracking & Anti-duplicados
  status_mi_crm: "En Espera" | "Activo en Mi CRM" | "Descartado";
  status_meli_crm: "Pendiente" | "Cargado en MELI CRM";
  fecha_carga_mi_crm?: string;
  fecha_carga_meli?: string;
  // Toques y Actividad
  touches: TouchLog[];
  created_at: string;
  updated_at: string;
  contacted_at?: string;
  closed_at?: string;
  days_in_cycle?: number;
}

export interface DailyActivityStats {
  calls_today: number;
  whatsapps_today: number;
  visits_today: number;
  emails_today: number;
  total_touches_today: number;
  leads_created_today: number;
  leads_created_this_week: number;
  leads_created_this_month: number;
}
