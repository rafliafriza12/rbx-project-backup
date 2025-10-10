// src/components/admin/StatsCard.tsx
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  color,
}: StatsCardProps) {
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center">
        <div
          className={`${color} rounded-lg p-3 text-white text-2xl shadow-md`}
        >
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-[#94a3b8] text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-[#f1f5f9] mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}
