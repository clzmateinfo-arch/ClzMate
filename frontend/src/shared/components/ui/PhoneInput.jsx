/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState, useId } from "react";
import CountryCode from "@/shared/data/countrycode.json";
import Select from "@/shared/components/ui/Select";
import Input from "@/shared/components/ui/Input";

export default function PhoneInput({
  name = "phone",
  defaultCountry = undefined,
  value = undefined,
  onChange = () => { },
  placeholder = "",
  selectProps = {},
  inputProps = {},
  label = "Phone Number",
  required = true,
  className = "",
  error = ""
}) {
  const codes = useMemo(() => CountryCode || [], []);
  const uid = useId();

  const defaultCode = defaultCountry || codes?.[0]?.code;

  const [country, setCountry] = useState(defaultCode);
  const [digits, setDigits] = useState("");

  useEffect(() => {
    if (!value && value !== "") return;
    let v = String(value || "");
    if (!v) {
      setDigits("");
      setCountry(defaultCode);
      return;
    }

    if (!v.startsWith("+")) v = `+${v}`;

    let matched = null;
    let foundDigits = "";
    const sortedCodes = codes
      .map((c) => c.code)
      .sort((a, b) => b.length - a.length);
    for (const c of sortedCodes) {
      if (v.startsWith(c)) {
        matched = c;
        foundDigits = v.slice(c.length).replace(/\D/g, "");
        break;
      }
    }
    if (!matched) {
      matched = defaultCode;
      foundDigits = v.replace(/\D/g, "");
      if (foundDigits.startsWith(matched.replace("+", ""))) {
        foundDigits = foundDigits.slice(matched.replace("+", "").length);
      }
    }
    setCountry(matched);
    setDigits(foundDigits);
  }, [value, codes, defaultCode]);

  const finalNumber = useMemo(() => {
    const cleanDigits = (digits || "").replace(/\D/g, "");
    return cleanDigits ? `${country}${cleanDigits}` : "";
  }, [country, digits]);

  useEffect(() => {
    if (value !== undefined) return;
    onChange(finalNumber);
  }, [finalNumber, onChange, value]);

  const handlePhoneInput = (e) => {
    let raw = String(e?.target?.value ?? "");
    raw = raw.replace(/\D/g, "");
    const maxDigits = 15;
    if (raw.length > maxDigits) raw = raw.slice(0, maxDigits);

    setDigits(raw);

    if (typeof inputProps.onChange === "function") {
      inputProps.onChange({ target: { name, value: `${country}${raw}` } });
    }
    if (value !== undefined && typeof onChange === "function") {
      onChange(`${country}${raw}`);
    } else if (value === undefined) {
      onChange(`${country}${raw}`);
    }
  };

  const handleCountryChange = (e) => {
    const newCountry = e?.target?.value ?? e;
    setCountry(newCountry);
    const cleanDigits = (digits || "").replace(/\D/g, "");
    const newFinal = cleanDigits ? `${newCountry}${cleanDigits}` : "";
    if (typeof selectProps.onChange === "function") {
      selectProps.onChange({ target: { name: `${name}_country`, value: newCountry } });
    }
    if (value !== undefined) {
      onChange(newFinal);
    } else {
      onChange(newFinal);
    }
  };

  const formatForDisplay = (rawDigits) => {
    const d = (rawDigits || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.length <= 2) return d;
    const parts = [];
    let pos = 0;
    parts.push(d.slice(pos, (pos += 2)));
    if (pos < d.length) {
      parts.push(d.slice(pos, (pos += 3)));
    }
    if (pos < d.length) {
      parts.push(d.slice(pos, (pos += 4)));
    }
    while (pos < d.length) {
      parts.push(d.slice(pos, (pos += 4)));
    }
    return parts.filter(Boolean).join(" ").trim();
  };

  const selectOptions = useMemo(
    () =>
      codes.map((c) => ({
        value: c.code,
        label: `(${c.code}) ${c.country}`,
      })),
    [codes]
  );

  useEffect(() => {
    if (value !== undefined && typeof onChange === "function") {
      onChange(value || "");
    }
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-[#0b1220]">
          {label} {required && <span aria-hidden className="text-red-500"> *</span>}
        </label>
      )}
      <div className="flex gap-3 items-start">
        <div className="w-50 min-w-45 mt-2">
          <Select
            label={selectProps.label ?? ""}
            name={selectProps.name ?? "countryCode"}
            value={country}
            onChange={handleCountryChange}
            options={selectOptions}
            placeholder={selectProps.placeholder ?? defaultCode}
            selectClass={selectProps.selectClass ?? ""}
            searchable={selectProps.searchable ?? true}
            {...selectProps}
          />
        </div>

        <div className="flex-1">
          <Input
            label={inputProps.label ?? ""}
            id={inputProps.id ?? "phoneNumberInput"}
            name={inputProps.name ?? name}
            type="tel"
            value={formatForDisplay(digits)}
            onChange={handlePhoneInput}
            placeholder={placeholder || "77 891 3874"}
            ariaLabel={inputProps.ariaLabel ?? "phone number"}
            inputClass={inputProps.inputClass ?? ""}
            {...inputProps}
          />
        </div>
      </div>
      {error && (
        <p id={`${uid}-help`} className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
