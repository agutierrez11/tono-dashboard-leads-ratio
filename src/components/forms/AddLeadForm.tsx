import React, { useState } from "react";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IndustrySelect } from "@/components/common/IndustrySelect";
import { GoogleAddressInput } from "@/components/common/GoogleAddressInput";
import { Building2, PlusCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const AddLeadForm: React.FC = () => {
  const { addLeadManual } = useMeliCockpit();
  const navigate = useNavigate();

  const [company, setCompany] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [websiteOrIg, setWebsiteOrIg] = useState("");
  const [industry, setIndustry] = useState("");
  const [productOpportunity, setProductOpportunity] = useState("Point Smart 4G");
  const [tpvMonthly, setTpvMonthly] = useState("450000");
  const [notes, setNotes] = useState("");

  const [fullAddress, setFullAddress] = useState("");
  const [addressParts, setAddressParts] = useState({
    streetAndNumber: "",
    interiorOrUnit: "",
    neighborhood: "",
    postalCode: "",
    city: "Cancún",
    state: "Quintana Roo",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!company.trim()) {
      toast.error("Por favor ingresa el nombre de la empresa o comercio.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length > 0 && cleanPhone.length < 10) {
      toast.warning("El teléfono debe tener al menos 10 dígitos para WhatsApp.");
    }

    const success = addLeadManual({
      name: company.trim(),
      company: company.trim(),
      contact_person: contactPerson.trim() || "Director / Dueño",
      phone: cleanPhone,
      email: email.trim(),
      website_or_ig: websiteOrIg.trim(),
      address_full: fullAddress,
      street_and_number: addressParts.streetAndNumber,
      neighborhood: addressParts.neighborhood,
      postal_code: addressParts.postalCode,
      city: addressParts.city,
      state: addressParts.state,
      industry: industry || "General",
      product_opportunity: productOpportunity,
      tpv_monthly: Number(tpvMonthly) || 450000,
      operational_pain: notes.trim(),
      stage: "new",
    });

    if (success) {
      navigate("/leads-list");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alta Manual en Calle</h1>
          <p className="text-xs text-muted-foreground">
            Registra comercios que visites en ruta con dirección validada para MELI CRM.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Ficha del Comercio
          </CardTitle>
          <CardDescription className="text-xs">
            Todos los datos se guardan en tu equipo (100% privado y sin contraseñas).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-xs font-medium">
                  Nombre del Comercio *
                </Label>
                <Input
                  id="company"
                  placeholder="ej. Restaurante Puerto Santo"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactPerson" className="text-xs font-medium">
                  Contacto / Dueño / Encargado
                </Label>
                <Input
                  id="contactPerson"
                  placeholder="ej. Lic. Roberto Gómez"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium">
                  Teléfono / WhatsApp Directo (10 dígitos)
                </Label>
                <Input
                  id="phone"
                  placeholder="ej. 998 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Correo Electrónico (Opcional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@negocio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Dirección con Google Places + Desglose estructurado */}
            <GoogleAddressInput
              initialFullAddress={fullAddress}
              onChange={(full, parts) => {
                setFullAddress(full);
                setAddressParts(parts);
              }}
            />

            {/* Vertical / Industria (Dropdown + Opción Manual) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Vertical / Industria</Label>
              <IndustrySelect
                value={industry}
                onChange={setIndustry}
                placeholder="Selecciona o escribe una industria"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Producto Recomendado</Label>
                <Select value={productOpportunity} onValueChange={setProductOpportunity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Point Smart 4G">Point Smart 4G (Impresión + 4G)</SelectItem>
                    <SelectItem value="Point Air">Point Air (Ligera y Rápida)</SelectItem>
                    <SelectItem value="Point Pro 2">Point Pro 2</SelectItem>
                    <SelectItem value="Link de Pago">Link de Pago / E-commerce</SelectItem>
                    <SelectItem value="Código QR / Wallet">Código QR / Wallet MP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpvMonthly" className="text-xs font-medium">
                  TPV Mensual Estimado (MXN)
                </Label>
                <Input
                  id="tpvMonthly"
                  type="number"
                  placeholder="450000"
                  value={tpvMonthly}
                  onChange={(e) => setTpvMonthly(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-medium">
                Notas de Campo / Dolor Detectado
              </Label>
              <Textarea
                id="notes"
                placeholder="ej. Tienen Clip pero se quejan de la comisión en 6 MSI. El dueño está los martes a las 4pm."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="submit" className="w-full bg-primary">
                <CheckCircle className="h-4 w-4 mr-2" /> Guardar en Mi CRM
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
