import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface SavedScenario {
  id: string;
  name: string;
  type: "sales" | "calls" | "email" | "linkedin";
  inputs: any;
  created_at: string;
}

export const useSavedScenarios = () => {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sales_saved_scenarios");
      if (saved) {
        setScenarios(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error reading saved scenarios:", e);
    }
  }, []);

  const saveScenario = (name: string, type: SavedScenario["type"], inputs: any) => {
    if (!name.trim()) {
      toast.error("El nombre del escenario no puede estar vacío");
      return null;
    }

    const uuid = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);

    const newScenario: SavedScenario = {
      id: uuid,
      name: name.trim(),
      type,
      inputs: JSON.parse(JSON.stringify(inputs)), // Deep clone
      created_at: new Date().toISOString(),
    };

    const updated = [newScenario, ...scenarios];
    setScenarios(updated);
    localStorage.setItem("sales_saved_scenarios", JSON.stringify(updated));
    toast.success(`Escenario "${name}" guardado correctamente`);
    return newScenario;
  };

  const deleteScenario = (id: string) => {
    const updated = scenarios.filter((s) => s.id !== id);
    setScenarios(updated);
    localStorage.setItem("sales_saved_scenarios", JSON.stringify(updated));
    toast.success("Escenario eliminado");
  };

  return {
    scenarios,
    saveScenario,
    deleteScenario,
  };
};
