import React from "react";
import { Users, Link, MessageCircle, CheckCircle } from "lucide-react";
import "./StatisticsDashboard.css";

const StatisticsDashboard = ({ 
    totalClients = 0,
    activeMappings = 0,
    totalSessions = 0,
    completionRate = 0
}) => {
    const stats = [
        {
            icon: <Users size={24} />,
            value: totalClients,
            label: "총 내담자",
            color: "primary"
        },
        {
            icon: <Link size={24} />,
            value: activeMappings,
            label: "활성 매칭",
            color: "success"
        },
        {
            icon: <MessageCircle size={24} />,
            value: totalSessions,
            label: "총 상담",
            color: "info"
        },
        {
            icon: <CheckCircle size={24} />,
            value: `${completionRate}%`,
            label: "완료율",
            color: "warning"
        }
    ];

  return (
        <div className="statistics-dashboard">
            {stats.map((stat, index) => (
                <div key={`stat-${index}`} className={`stat-card stat-card--${stat.color}`}>
                    <div className="stat-card__icon">
                        {stat.icon}
        </div>
                    <div className="stat-card__content">
                        <div className="stat-card__value">{stat.value}</div>
                        <div className="stat-card__label">{stat.label}</div>
        </div>
      </div>
            ))}
    </div>
  );
};

export default StatisticsDashboard;
