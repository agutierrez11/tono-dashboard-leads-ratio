import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import { getIndustries, saveCustomIndustry } from "@/utils/industries";

interface IndustrySelectProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const IndustrySelect: React.FC<IndustrySelectProps> = ({
  value,
  onChange,
  placeholder = "Selecciona o escribe una industria",
  className = "",
}) => {
  const [industries, setIndustries] = useState<string[]>([]);
  const [isManual, setIsManual] = useState(false);
  const [manualText, setManualText] = useState("");

  useEffect(() => {
    setIndustries(getIndustries());
  }, []);

  const handleSelectChange = (val: string) => {
    if (val === "__MANUAL__") {
      setIsManual(true);
      setManualText("");
    } else {
      setIsManual(false);
      onChange(val);
    }
  };

  const handleSaveManual = () => {
    const trimmed = manualText.trim();
    if (trimmed) {
      const updated = saveCustomIndustry(trimmed);
      setIndustries(updated);
      onChange(trimmed);
      setIsManual(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {!isManual ? (
        <div className="flex gap-2">
          <Select value={value || ""} onValueChange={handleSelectChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
              <SelectItem value="__MANUAL__" className="font-semibold text-primary">
                ➕ Otra Industria (Escribir manual)...
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Escribir industria manual"
            onClick={() => setIsManual(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Escribe la vertical (ej. Marinas, Joyerías, etc.)"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveManual();
              }
            }}
            autoFocus
          />
          <Button type="button" size="sm" onClick={handleSaveManual}>
            <Check className="h-4 w-4 mr-1" /> Guardar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsManual(false)}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
};
