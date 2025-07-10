export function Label({ htmlFor, children, className = "" }) {
  return (
    <label htmlFor={htmlFor} className={`block mb-1 ${className}`}>
      {children}
    </label>
  );
}