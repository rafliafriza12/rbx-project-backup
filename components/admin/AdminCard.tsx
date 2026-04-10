interface AdminCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function AdminCard({ children, title, className = "" }: AdminCardProps) {
  return (
    <div className={`admin-card ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-slate-100">{title}</h3>
      )}
      {children}
    </div>
  );
}

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function AdminStatsCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
}: AdminStatsCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-400";
      case "down":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="admin-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="admin-text-muted text-sm">{title}</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
          {subtitle && (
            <p className="admin-text-muted text-xs mt-1">{subtitle}</p>
          )}
        </div>
        {trendValue && (
          <div className={`text-sm ${getTrendColor()}`}>
            {trend === "up" && "↗"}
            {trend === "down" && "↘"}
            {trend === "neutral" && "→"}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

interface AdminButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function AdminButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
}: AdminButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return "btn-secondary";
      case "danger":
        return "btn-danger";
      default:
        return "";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-sm px-3 py-2";
      case "lg":
        return "text-lg px-6 py-3";
      default:
        return "text-base px-4 py-2";
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${getVariantClasses()} ${getSizeClasses()} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}

interface AdminTableProps {
  headers: string[];
  children: React.ReactNode;
}

export function AdminTable({ headers, children }: AdminTableProps) {
  return (
    <div className="admin-card p-0 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="text-left">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function AdminTableRow({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>;
}

export function AdminTableCell({ children }: { children: React.ReactNode }) {
  return <td>{children}</td>;
}
