"use client";

export function StepHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      )}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ChipGroup<T extends string>({
  options,
  labels,
  selected,
  onChange,
}: {
  options: readonly T[];
  labels: Record<string, string>;
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  function toggle(value: T) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              active
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"
            }`}
          >
            {labels[option] ?? option}
          </button>
        );
      })}
    </div>
  );
}

export function RadioPills<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<string, string>;
  value: T | null;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              active
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"
            }`}
          >
            {labels[option] ?? option}
          </button>
        );
      })}
    </div>
  );
}

export function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
          value === true
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"
        }`}
      >
        예
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
          value === false
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"
        }`}
      >
        아니요
      </button>
    </div>
  );
}

export function SliderField({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue,
}: {
  min: number;
  max: number;
  step?: number;
  value: number | null;
  onChange: (next: number) => void;
  formatValue?: (value: number) => string;
}) {
  const current = value ?? Math.round((min + max) / 2);
  return (
    <div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-neutral-900"
      />
      <div className="mt-1 text-sm text-neutral-500">
        {formatValue ? formatValue(current) : current}
      </div>
    </div>
  );
}

export function TextListInput({
  values,
  onChange,
  placeholder,
  addLabel = "+ 추가",
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  function updateAt(index: number, next: string) {
    const copy = [...values];
    copy[index] = next;
    onChange(copy);
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => updateAt(index, e.target.value)}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => removeAt(index)}
            className="rounded-lg border border-neutral-300 px-3 text-sm text-neutral-500 hover:bg-neutral-50"
          >
            삭제
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 hover:border-neutral-400"
      >
        {addLabel}
      </button>
    </div>
  );
}
