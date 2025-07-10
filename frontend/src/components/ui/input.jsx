export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border focus:outline-none focus:ring-2 ${className}`}
      {...props}
    />
  );
}