export default function FinancialCard({ title, value, icon: Icon, subtext, color = "blue" }) {
    const colors = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        green: "bg-green-50 text-green-700 border-green-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200",
    };

    return (
        <div className={`card border ${colors[color] || colors.blue} p-6`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-sm font-medium opacity-80 uppercase tracking-wide">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                {Icon && <Icon size={24} className="opacity-50" />}
            </div>
            {subtext && <p className="text-xs opacity-70 mt-2">{subtext}</p>}
        </div>
    );
}
