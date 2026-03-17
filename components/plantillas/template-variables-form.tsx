"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VariableField {
  key: string;
  label: string;
  type: "text" | "number" | "date";
  required: boolean;
}

interface TemplateVariablesFormProps {
  fields: VariableField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function TemplateVariablesForm({
  fields,
  values,
  onChange,
}: TemplateVariablesFormProps) {
  const t = useTranslations("plantillas");

  if (fields.length === 0) {
    return <p className="text-sm text-gray-500">Esta plantilla no tiene variables.</p>;
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && (
              <span className="ml-1 text-red-500">*</span>
            )}
          </Label>
          <Input
            id={field.key}
            type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
            value={values[field.key] ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.label}
          />
        </div>
      ))}
    </div>
  );
}
