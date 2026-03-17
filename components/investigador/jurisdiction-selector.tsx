"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Scale } from "lucide-react";

const JURISDICTIONS = [
  { value: "federal", label: "Federal" },
  { value: "cdmx", label: "Ciudad de México" },
  { value: "jalisco", label: "Jalisco" },
  { value: "nuevo-leon", label: "Nuevo León" },
  { value: "estado-de-mexico", label: "Estado de México" },
  { value: "puebla", label: "Puebla" },
  { value: "guanajuato", label: "Guanajuato" },
  { value: "veracruz", label: "Veracruz" },
  { value: "chihuahua", label: "Chihuahua" },
  { value: "tamaulipas", label: "Tamaulipas" },
  { value: "sonora", label: "Sonora" },
  { value: "baja-california", label: "Baja California" },
  { value: "sinaloa", label: "Sinaloa" },
  { value: "coahuila", label: "Coahuila" },
  { value: "oaxaca", label: "Oaxaca" },
  { value: "chiapas", label: "Chiapas" },
  { value: "michoacan", label: "Michoacán" },
  { value: "guerrero", label: "Guerrero" },
  { value: "hidalgo", label: "Hidalgo" },
  { value: "san-luis-potosi", label: "San Luis Potosí" },
  { value: "tabasco", label: "Tabasco" },
  { value: "yucatan", label: "Yucatán" },
  { value: "morelos", label: "Morelos" },
  { value: "durango", label: "Durango" },
  { value: "zacatecas", label: "Zacatecas" },
  { value: "quintana-roo", label: "Quintana Roo" },
  { value: "queretaro", label: "Querétaro" },
  { value: "aguascalientes", label: "Aguascalientes" },
  { value: "tlaxcala", label: "Tlaxcala" },
  { value: "nayarit", label: "Nayarit" },
  { value: "campeche", label: "Campeche" },
  { value: "colima", label: "Colima" },
  { value: "baja-california-sur", label: "Baja California Sur" },
] as const;

const AREAS_OF_LAW = [
  { value: "ALL", label: "Todas las áreas" },
  { value: "CIVIL", label: "Civil" },
  { value: "PENAL", label: "Penal" },
  { value: "MERCANTIL", label: "Mercantil" },
  { value: "LABORAL", label: "Laboral" },
  { value: "FISCAL", label: "Fiscal" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "CONSTITUCIONAL", label: "Constitucional / Amparo" },
  { value: "FAMILIAR", label: "Familiar" },
  { value: "CORPORATIVO", label: "Corporativo" },
  { value: "INMOBILIARIO", label: "Inmobiliario" },
  { value: "PROPIEDAD_INTELECTUAL", label: "Propiedad Intelectual" },
  { value: "COMERCIO_EXTERIOR", label: "Comercio Exterior / USMCA" },
  { value: "MIGRATORIO", label: "Migratorio" },
  { value: "NOTARIAL", label: "Notarial" },
  { value: "AMBIENTAL", label: "Ambiental" },
  { value: "AGRARIO", label: "Agrario" },
] as const;

interface JurisdictionSelectorProps {
  jurisdiction: string;
  areaOfLaw: string;
  onJurisdictionChange: (v: string) => void;
  onAreaOfLawChange: (v: string) => void;
}

export function JurisdictionSelector({
  jurisdiction,
  areaOfLaw,
  onJurisdictionChange,
  onAreaOfLawChange,
}: JurisdictionSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={jurisdiction} onValueChange={onJurisdictionChange}>
        <SelectTrigger className="h-8 w-44 gap-1 border-white/20 bg-white/5 text-xs text-white focus:ring-[#C9A84C]">
          <MapPin className="h-3 w-3 shrink-0 text-[#C9A84C]" />
          <SelectValue placeholder="Jurisdicción" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          <SelectGroup>
            <SelectLabel className="text-xs text-gray-400">Jurisdicción</SelectLabel>
            {JURISDICTIONS.map((j) => (
              <SelectItem key={j.value} value={j.value} className="text-xs">
                {j.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={areaOfLaw} onValueChange={onAreaOfLawChange}>
        <SelectTrigger className="h-8 w-48 gap-1 border-white/20 bg-white/5 text-xs text-white focus:ring-[#C9A84C]">
          <Scale className="h-3 w-3 shrink-0 text-[#C9A84C]" />
          <SelectValue placeholder="Área del derecho" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          <SelectGroup>
            <SelectLabel className="text-xs text-gray-400">Área del derecho</SelectLabel>
            {AREAS_OF_LAW.map((a) => (
              <SelectItem key={a.value} value={a.value} className="text-xs">
                {a.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
