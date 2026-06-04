import { describe, it, expect, vi } from "vitest";
import { computeProjections } from "../hooks/useSalesFunnelMetrics";
import { renderHook } from "@testing-library/react";
import { useDataImportExport } from "../hooks/useDataImportExport";

// Mock Supabase calls since we don't have a live connection in tests
vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    },
  };
});

// Mock react-query or useLeads/useRecentActivities hooks if needed
vi.mock("@/hooks/useLeads", () => {
  return {
    useLeads: () => ({ data: [], isLoading: false }),
    useLeadStats: () => ({ stats: { conversionRates: [], salesCycleTimes: [] } }),
    useDeleteAllLeads: () => ({ mutateAsync: vi.fn() }),
  };
});

vi.mock("@/hooks/useActivities", () => {
  return {
    useRecentActivities: () => ({ data: [], isLoading: false }),
    useTodayActivities: () => ({ data: null, isLoading: false }),
  };
});

describe("computeProjections", () => {
  it("should compute correct projections based on conversion rates", () => {
    const rates = {
      contactedRate: 50,
      relevantRate: 30,
      opportunityRate: 50,
      customerRate: 30,
    };

    const result = computeProjections(rates);

    expect(result.if100Contacts).toBe(100);
    expect(result.if100Contacted).toBe(50);
    expect(result.if100Relevant).toBe(15);
    expect(result.if100Opportunities).toBe(8);
    expect(result.if100Customers).toBe(2);
  });

  it("should handle 0% conversion rates safely", () => {
    const rates = {
      contactedRate: 0,
      relevantRate: 0,
      opportunityRate: 0,
      customerRate: 0,
    };

    const result = computeProjections(rates);

    expect(result.if100Contacts).toBe(100);
    expect(result.if100Contacted).toBe(0);
    expect(result.if100Relevant).toBe(0);
    expect(result.if100Opportunities).toBe(0);
    expect(result.if100Customers).toBe(0);
  });
});

describe("useDataImportExport Parser Helpers", () => {
  it("should correctly detect delimiters", () => {
    const { result } = renderHook(() => useDataImportExport());
    
    const csvComma = "nombre,empresa,canal\nJuan,Empresa ABC,linkedin";
    const csvSemicolon = "nombre;empresa;canal\nJuan;Empresa ABC;linkedin";
    
    expect(result.current.detectDelimiter(csvComma)).toBe(",");
    expect(result.current.detectDelimiter(csvSemicolon)).toBe(";");
  });

  it("should parse CSV line with quotes and delimiters", () => {
    const { result } = renderHook(() => useDataImportExport());
    
    const line = 'Juan Perez,"Empresa, ABC",linkedin';
    const parsed = result.current.parseCSVLine(line, ",");
    
    expect(parsed).toEqual(["Juan Perez", "Empresa, ABC", "linkedin"]);
  });

  it("should normalize headers correctly", () => {
    const { result } = renderHook(() => useDataImportExport());
    
    expect(result.current.normalizeHeader("\uFEFFNombre ")).toBe("nombre");
    expect(result.current.normalizeHeader(' "Empresa" ')).toBe("empresa");
  });

  it("should normalize channels", () => {
    const { result } = renderHook(() => useDataImportExport());
    
    expect(result.current.normalizeChannel("SalesNavigator")).toBe("linkedin");
    expect(result.current.normalizeChannel("li")).toBe("linkedin");
    expect(result.current.normalizeChannel("llamada")).toBe("phone");
    expect(result.current.normalizeChannel("Correo")).toBe("email");
    expect(result.current.normalizeChannel("unknown")).toBe("email"); // fallback
  });

  it("should process rows data correctly with headers", () => {
    const { result } = renderHook(() => useDataImportExport());
    
    const rows = [
      ["nombre", "empresa", "canal", "estado", "email", "telefono"],
      ["Ana", "Global Corp", "linkedin", "qualified", "ana@global.com", "12345"]
    ];
    
    const parsed = result.current.processRowsData(rows);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("Ana");
    expect(parsed[0].company).toBe("Global Corp");
    expect(parsed[0].channel).toBe("linkedin");
    expect(parsed[0].status).toBe("qualified");
    expect(parsed[0].email).toBe("ana@global.com");
    expect(parsed[0].phone).toBe("12345");
  });
});
