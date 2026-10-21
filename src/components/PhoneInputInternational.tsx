import React from "react";
import { POPULAR_COUNTRIES } from "@/lib/phone";
import { Input } from "@/components/ui/input";

interface PhoneInputInternationalProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  countryDial: string;
  onCountryDialChange: (dial: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function PhoneInputInternational({
  id = "tel",
  value,
  onChange,
  countryDial,
  onCountryDialChange,
  placeholder,
  required = false,
  disabled = false,
}: PhoneInputInternationalProps) {
  const currentCountry =
    POPULAR_COUNTRIES.find((c) => c.dial === countryDial) || POPULAR_COUNTRIES[0];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Se for Brasil, aplica máscara suave (XX) XXXXX-XXXX
    if (countryDial === "55") {
      const digits = raw.replace(/\D/g, "").slice(0, 11);
      if (digits.length <= 2) {
        raw = digits.length > 0 ? `(${digits}` : "";
      } else if (digits.length <= 7) {
        raw = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      } else {
        raw = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
      }
    }

    onChange(raw);
  };

  return (
    <div className="flex gap-2">
      {/* Seletor de País / DDI */}
      <div className="relative shrink-0 w-[115px]">
        <select
          value={countryDial}
          onChange={(e) => {
            onCountryDialChange(e.target.value);
          }}
          disabled={disabled}
          className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-xs md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer font-medium"
        >
          {POPULAR_COUNTRIES.map((c) => (
            <option key={`${c.code}-${c.dial}`} value={c.dial}>
              {c.flag} +{c.dial} ({c.code})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground text-xs">
          ▼
        </div>
      </div>

      {/* Input de Telefone */}
      <div className="flex-1">
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder || currentCountry.maskPlaceholder}
          required={required}
          disabled={disabled}
          className="w-full"
        />
      </div>
    </div>
  );
}
