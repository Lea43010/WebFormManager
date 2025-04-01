import { ArrowDown, ArrowUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  changeValue: number;
  changeDirection: "up" | "down";
  changePeriod: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconColor,
  iconBgColor,
  changeValue,
  changeDirection,
  changePeriod
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className={`rounded-full ${iconBgColor} p-3`}>
          <span className={`material-icons ${iconColor}`}>{icon}</span>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center">
          <span className={`flex items-center text-sm font-medium ${
            changeDirection === 'up' ? 'text-success' : 'text-error'
          }`}>
            {changeDirection === 'up' ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-1" />
            )}
            <span>{changeValue}%</span>
          </span>
          <span className="text-sm text-neutral-500 ml-2">{changePeriod}</span>
        </div>
      </div>
    </div>
  );
}
