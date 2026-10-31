import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Check, Copy, Edit2, Search } from "lucide-react";
import { toast } from "sonner";

interface AddressParts {
  streetAndNumber: string;
  interiorOrUnit: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
}

interface GoogleAddressInputProps {
  initialFullAddress?: string;
  onChange: (full: string, parts: AddressParts) => void;
  className?: string;
}

export const GoogleAddressInput: React.FC<GoogleAddressInputProps> = ({
  initialFullAddress = "",
  onChange,
  className = "",
}) => {
  const [isManual, setIsManual] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialFullAddress);
  const [parts, setParts] = useState<AddressParts>({
    streetAndNumber: "",
    interiorOrUnit: "",
    neighborhood: "",
    postalCode: "",
    city: "Cancún",
    state: "Quintana Roo",
  });

  const handlePartsChange = (field: keyof AddressParts, value: string) => {
    const updated = { ...parts, [field]: value };
    setParts(updated);

    const fullStr = [
      updated.streetAndNumber,
      updated.interiorOrUnit ? `Int. ${updated.interiorOrUnit}` : "",
      updated.neighborhood ? `Col. ${updated.neighborhood}` : "",
      updated.postalCode ? `C.P. ${updated.postalCode}` : "",
      updated.city,
      updated.state,
    ]
      .filter(Boolean)
      .join(", ");

    onChange(fullStr, updated);
  };

  const parseQuickAddress = (raw: string) => {
    setSearchQuery(raw);
    // Extract 5-digit CP if present
    const cpMatch = raw.match(/\b(77\d{3})\b/);
    const cp = cpMatch ? cpMatch[1] : "77500";

    const updated: AddressParts = {
      streetAndNumber: raw.split(",")[0] || raw,
      interiorOrUnit: "",
      neighborhood: raw.split(",")[1]?.trim() || "Centro",
      postalCode: cp,
      city: raw.toLowerCase().includes("playa") ? "Playa del Carmen" : (raw.toLowerCase().includes("tulum") ? "Tulum" : "Cancún"),
      state: "Quintana Roo",
    };

    setParts(updated);
    onChange(raw, updated);
  };

  const copyForMeli = () => {
    const textToCopy = `Calle: ${parts.streetAndNumber} | Local: ${parts.interiorOrUnit || "N/A"} | Col: ${parts.neighborhood} | CP: ${parts.postalCode} | Ciudad: ${parts.city}, ${parts.state}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Dirección estructurada copiada para el CRM de MELI");
  };

  return (
    <div className={`space-y-3 rounded-lg border p-4 bg-muted/20 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 font-medium text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          Dirección del Comercio (Validada para MELI)
        </Label>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsManual(!isManual)}
          >
            <Edit2 className="h-3 w-3 mr-1" />
            {isManual ? "Modo Rápido" : "Desglosar Campos"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={copyForMeli}
            title="Copiar formato limpio para CRM Mercado Pago"
          >
            <Copy className="h-3 w-3 mr-1" /> Copiar para MELI
          </Button>
        </div>
      </div>

      {!isManual ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Escribe la dirección o busca en Google Maps..."
              value={searchQuery}
              onChange={(e) => parseQuickAddress(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            💡 Puedes pegar la dirección de Google Maps; el sistema separa el Código Postal y la Ciudad automáticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="col-span-2">
            <Label className="text-[11px]">Calle y Número Exterior</Label>
            <Input
              size={1}
              placeholder="Av. Bonampak 7"
              value={parts.streetAndNumber}
              onChange={(e) => handlePartsChange("streetAndNumber", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[11px]">Local / Interior (Opcional)</Label>
            <Input
              size={1}
              placeholder="Local 12, Planta Baja"
              value={parts.interiorOrUnit}
              onChange={(e) => handlePartsChange("interiorOrUnit", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[11px]">Colonia / Asentamiento</Label>
            <Input
              size={1}
              placeholder="Zona Hotelera / Ejidal"
              value={parts.neighborhood}
              onChange={(e) => handlePartsChange("neighborhood", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[11px]">Código Postal (5 dígitos)</Label>
            <Input
              size={1}
              placeholder="77500"
              maxLength={5}
              value={parts.postalCode}
              onChange={(e) => handlePartsChange("postalCode", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[11px]">Ciudad / Municipio</Label>
            <Input
              size={1}
              placeholder="Cancún / Benito Juárez"
              value={parts.city}
              onChange={(e) => handlePartsChange("city", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
