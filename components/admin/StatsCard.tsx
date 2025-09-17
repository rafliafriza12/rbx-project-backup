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
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${color} rounded-lg p-3 text-white text-2xl`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
