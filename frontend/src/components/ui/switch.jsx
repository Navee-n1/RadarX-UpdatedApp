import { useCallback } from "react";

export function Switch({ checked, onCheckedChange, className = "" }) {
  const toggle = useCallback(() => onCheckedChange(!checked), [checked, onCheckedChange]);

  return (
    <div
      onClick={toggle}
      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${checked ? "bg-red-500" : "bg-gray-500"} ${className}`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${checked ? "translate-x-6" : "translate-x-0"}`}
      ></div>
    </div>
  );
}