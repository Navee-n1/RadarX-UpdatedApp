export function Card({ children, className = "" }) {
  return <div className={`rounded-xl p-6 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h2 className={`text-xl font-bold ${className}`}>{children}</h2>;
}

export function CardDescription({ children, className = "" }) {
  return <p className={`text-sm text-gray-300 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`mt-4 ${className}`}>{children}</div>;
}