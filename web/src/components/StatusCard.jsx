import React from 'react';

const StatusCard = ({ label, value, unit, icon: Icon, colorClass = "bg-gray-200" }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 abb-shadow relative overflow-hidden group">
    <div className={`absolute top-0 left-0 w-1 h-full bg-gray-200 group-hover:bg-abb-red transition-colors`}></div>
    <div className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5 font-bold">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black text-gray-800 font-mono">{value}</span>
      <span className="text-[10px] font-bold text-abb-red font-mono">{unit}</span>
    </div>
    <Icon className={`absolute bottom-3 right-3 text-gray-100 w-6 h-6 group-hover:text-red-50 transition-colors`} />
  </div>
);

export default StatusCard;
