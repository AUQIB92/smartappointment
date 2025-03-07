export default function DashboardCard({
  title,
  value,
  icon,
  color = "primary",
}) {
  const colorClasses = {
    primary: "bg-primary-500 text-white",
    secondary: "bg-blue-500 text-white",
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white",
    danger: "bg-red-500 text-white",
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className={`p-4 ${colorClasses[color]}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className="text-4xl opacity-80">{icon}</div>
        </div>
      </div>
    </div>
  );
}
