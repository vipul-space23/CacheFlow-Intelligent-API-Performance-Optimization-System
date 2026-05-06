import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, change, isPositive, colorClass, icon: Icon }) => {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-header">
        <span>{title}</span>
        {Icon && <Icon size={20} className={`text-${colorClass}-500`} />}
      </div>
      <div className="stat-value">{value}</div>
      <div className={`stat-change ${isPositive ? 'change-positive' : 'change-negative'}`}>
        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        <span>{Math.abs(change)}% from last hour</span>
      </div>
    </div>
  );
};

export default StatCard;
