const fs = require('fs');
const path = require('path');
const { JSDOM } = require('c:/Users/Antonio/.gemini/antigravity-ide/scratch/tono-dashboard-leads-ratio/node_modules/jsdom');

console.log("===============================================================================");
console.log("🧪 BATERÍA DE PRUEBAS END-TO-END AUTOMATIZADAS (UI-UX & LOGIC TEST HARNESS)");
console.log("Dashboard Comercial Mercado Pago Quintana Roo");
console.log("Inspirado en habilidades: ui-ux-tester & gstack-qa (mis-agentes-y-skills)");
console.log("===============================================================================\n");

const htmlPath = 'c:/Users/Antonio/.gemini/antigravity-ide/scratch/tono-dashboard-leads-ratio/tono-dashboard-mercadopago.html';
const rawHtml = fs.readFileSync(htmlPath, 'utf8');

// Interceptar fetch para auditar las llamadas a Google Sheets
const interceptedCalls = [];

const dom = new JSDOM(rawHtml, {
  runScripts: "dangerously",
  url: "https://agutierrez11.github.io/tono-dashboard-leads-ratio/tono-dashboard-mercadopago.html",
  beforeParse(window) {
    // Mock de localStorage
    const store = {};
    window.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { for (const k in store) delete store[k]; }
    };

    // Mock de fetch para interceptar y registrar cada llamada a Google Apps Script
    window.fetch = async (url, options = {}) => {
      interceptedCalls.push({ url: String(url), options, timestamp: new Date().toISOString() });
      if (options.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true, message: "Mock post success" })
        };
      }
      // Mock GET live API
      return {
        ok: true,
        json: async () => ({
          success: true,
          count: 2,
          leads: [
            {
              id: "MP-QR-0001",
              name: "DÉJÁ VU Clínica Estética y Spa",
              industry: "Clínica Estética & MedSpa",
              city: "Playa del Carmen",
              phone: "998 154 7112",
              email: "contacto_real@dejavu.mx",
              website: "https://dejavuspa.com",
              tpv: 550000,
              rating: 5.0,
              reviews: 83
            },
            {
              id: "MP-QR-0002",
              name: "Xtabay Medicina Estética",
              industry: "Clínica Estética & MedSpa",
              city: "Cancún",
              phone: "984 876 6365",
              email: "info@xtabaymed.com",
              website: "https://xtabaymed.com",
              tpv: 550000,
              rating: 4.9,
              reviews: 248
            }
          ]
        })
      };
    };

    // Mock clipboard
    window.navigator.clipboard = {
      writeText: async (text) => Promise.resolve()
    };
  }
});

const { window } = dom;
const { document } = window;

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✅ PASÓ: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FALLÓ: ${testName} -> ${details}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("🔹 GRUPO 1: Inicialización y Render del DOM");
  assert(document.getElementById("kpi-touches") !== null, "Elemento KPI Toques existe en el DOM");
  assert(document.getElementById("kanban-board") !== null, "Elemento Tablero Kanban existe en el DOM");
  assert(document.getElementById("banco-table-body") !== null, "Elemento Tabla Acordeón Maestro existe");
  assert(document.getElementById("btn-sync-sheets") !== null, "Botón Sincronizar Google Sheets existe en la barra superior");

  console.log("\n🔹 GRUPO 2: Sincronización en Vivo con Google Sheets");
  interceptedCalls.length = 0;
  await window.syncWithGoogleSheets(false);
  assert(interceptedCalls.some(c => c.url.includes("script.google.com")), "syncWithGoogleSheets realiza petición GET al endpoint de Google Apps Script");
  const bankLeads = window.getAllBankLeads();
  assert(bankLeads && bankLeads.length > 0, "getAllBankLeads() se puebla con datos del Sheet");
  assert(bankLeads[0].email === "contacto_real@dejavu.mx", "Los datos frescos (email editado) se actualizan en memoria");

  console.log("\n🔹 GRUPO 3: Flujo de Jalar Comercios (Single, Lote y Seleccionados)");
  interceptedCalls.length = 0;
  window.setActiveDeals([]); // Empezar limpio
  window.pullToActive("MP-QR-0001");
  const dealsAfterPull = window.getActiveDeals();
  assert(dealsAfterPull.length === 1, "pullToActive agrega el comercio a la cartera activa (deals)");
  assert(dealsAfterPull[0].id === "MP-QR-0001", "El comercio jalado coincide con el ID");
  assert(interceptedCalls.some(c => c.options && c.options.body && c.options.body.includes("pull_batch")), "pullToActive manda la señal 'pull_batch' a Google Sheets para pintarlo de verde");

  interceptedCalls.length = 0;
  window.pullBatch(1);
  const dealsAfterBatch = window.getActiveDeals();
  assert(dealsAfterBatch.length === 2, "pullBatch agrega el lote a deals respetando los no existentes");
  assert(interceptedCalls.some(c => c.options && c.options.body && c.options.body.includes("pull_batch")), "pullBatch manda la señal 'pull_batch' a Google Sheets");

  console.log("\n🔹 GRUPO 4: Registro de Actividad y Tacómetro Diario");
  interceptedCalls.length = 0;
  const deal1 = dealsAfterBatch[0];
  window.openActivityModalForDeal(deal1.id);
  document.getElementById("actChannel").value = "llamada";
  window.onActChannelChange("llamada");
  document.querySelector('input[name="callConnected"][value="si"]').checked = true;
  window.onCallConnectChange(true);
  document.getElementById("actOutcome").value = "pidio_visita";
  document.getElementById("actNote").value = "Interesado en Point Smart para sucursal Playa";
  
  const mockEvt = { preventDefault: () => {} };
  window.saveActivity(mockEvt);

  assert(deal1.logs.length === 1, "La actividad se registra en el historial cronológico del comercio");
  assert(interceptedCalls.some(c => c.options && c.options.body && c.options.body.includes("log_touch") && c.options.body.includes("SÍ")), "La llamada exitosa envía 'SÍ' en resultado hacia Bitacora_Actividad");

  console.log("\n🔹 GRUPO 5: Tratamiento de Correo Electrónico (Sin falso 'No Contestó')");
  interceptedCalls.length = 0;
  window.openActivityModalForDeal(deal1.id);
  document.getElementById("actChannel").value = "correo_1a1";
  window.onActChannelChange("correo_1a1");
  document.getElementById("actOutcome").value = "enviado";
  document.getElementById("actNote").value = "Envío de comparativa de comisiones por email";
  window.saveActivity(mockEvt);

  assert(interceptedCalls.some(c => c.options && c.options.body && c.options.body.includes("Enviado (En espera)")), "Un correo recién enviado se registra como 'Enviado (En espera)' en lugar de 'No Contestó'");

  console.log("\n🔹 GRUPO 6: Avance de Etapas y Flujo de Cierre Ganado");
  interceptedCalls.length = 0;
  // Simular drop o cambio a Ganado
  window.openActivityModalForDeal(deal1.id, "ganado");
  assert(document.getElementById("actTitle").textContent.includes("Cierre Ganado"), "Al seleccionar Ganado, el modal se titula correctamente sin alertas bloqueantes");
  document.getElementById("actNote").value = "Terminal Point Smart 4G entregada y cobrando";
  window.saveActivity(mockEvt);

  assert(deal1.stage === "ganado", "El deal queda en etapa 'ganado'");
  assert(interceptedCalls.some(c => c.options && c.options.body && c.options.body.includes("GANADO")), "Se envía el estado 'GANADO' a Google Sheets para pintarlo de verde oscuro");

  console.log("\n🔹 GRUPO 7: Flujo de Descarte / Perdido con Documentación");
  interceptedCalls.length = 0;
  const deal2 = dealsAfterBatch[1];
  window.openActivityModalForDeal(deal2.id, "perdido");
  assert(document.getElementById("actTitle").textContent.includes("Descarte"), "Al seleccionar Perdido, se abre el modal para documentar el motivo de descarte");
  document.getElementById("actOutcome").value = "rechazo_tasa";
  document.getElementById("actNote").value = "Tienen contrato con BBVA hasta 2027";
  window.saveActivity(mockEvt);

  assert(deal2.stage === "perdido", "El deal queda en etapa 'perdido'");
  assert(interceptedCalls.some(c => c.options && c.options.body && c.options.body.includes("DESCARTADO")), "Se envía el estado 'DESCARTADO' a Google Sheets para pintarlo de rojo tenue");

  console.log("\n🔹 GRUPO 8: Reflejo en Acordeón Maestro (Distintivos Visuales)");
  window.renderBancoTable();
  const bancoTableText = document.getElementById("banco-table-body").innerHTML;
  assert(bancoTableText.includes("Ganado MP"), "El Acordeón Maestro muestra la insignia 'Ganado MP' para el comercio ganado");
  assert(bancoTableText.includes("Descartado"), "El Acordeón Maestro muestra la insignia 'Descartado' para el comercio descartado");

  console.log("\n🔹 GRUPO 9: Cambio Directo desde Dropdown de Tabla (changeStage)");
  interceptedCalls.length = 0;
  window.changeStage(deal1.id, "negociacion");
  assert(deal1.stage === "negociacion", "changeStage actualiza la etapa en memoria local");
  assert(interceptedCalls.some(c => c.options && c.options.body && c.options.body.includes("update_deal")), "changeStage manda 'update_deal' a Google Sheets de inmediato sin requerir modal");

  console.log("\n===============================================================================");
  console.log(`📊 RESULTADO DE LA SUITE: ${passed} PASADOS | ${failed} FALLADOS`);
  if (failed === 0) {
    console.log("🎉 ¡COBERTURA 100% EXITOSA! Todos los flujos comerciales y de sincronización son sólidos.");
  } else {
    console.error("⚠️ Se detectaron fallas que deben corregirse.");
  }
  console.log("===============================================================================");

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
  console.error("Error fatal en la ejecución de la suite:", err);
  process.exit(1);
});
