import { cn } from "../../lib/utils";

function Select({ className, value, onChange, options, placeholder, ...props }) {
  return (
    <select
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      value={value}
      onChange={onChange}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export { Select };
