import React, { useState, useEffect } from 'react';
import { Activity, Database, Zap, Clock } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import StatCard from './StatCard';

const mockData = [
  { time: '10:00', hits: 120, misses: 30, latency: 45 },
  { time: '10:05', hits: 180, misses: 25, latency: 40 },
  { time: '10:10', hits: 250, misses: 40, latency: 42 },
  { time: '10:15', hits: 310, misses: 20, latency: 38 },
  { time: '10:20', hits: 400, misses: 15, latency: 35 },
  { time: '10:25', hits: 480, misses: 10, latency: 30 },
  { time: '10:30', hits: 550, misses: 5, latency: 28 },
];

const Dashboard = () => {
  return (
    <div className="main-content">
      <div className="header">
        <h1>Cache Overview</h1>
        <p>Real-time analytics and performance metrics for CacheFlow.</p>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Total Requests" 
          value="24.5k" 
          change={12.5} 
          isPositive={true} 
          colorClass="blue" 
          icon={Activity} 
        />
        <StatCard 
          title="Cache Hit Ratio" 
          value="94.2%" 
          change={2.1} 
          isPositive={true} 
          colorClass="green" 
          icon={Zap} 
        />
        <StatCard 
          title="Avg Latency" 
          value="32ms" 
          change={15.4} 
          isPositive={false} 
          colorClass="purple" 
          icon={Clock} 
        />
        <StatCard 
          title="Cache Size" 
          value="1.2 GB" 
          change={5.2} 
          isPositive={true} 
          colorClass="red" 
          icon={Database} 
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Hits vs Misses (Last 30 Mins)</h2>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMisses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#131b2c', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="hits" stroke="#10b981" fillOpacity={1} fill="url(#colorHits)" />
                <Area type="monotone" dataKey="misses" stroke="#ef4444" fillOpacity={1} fill="url(#colorMisses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">API Latency (ms)</h2>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#131b2c', borderColor: '#1e293b', borderRadius: '8px' }}
                />
                <Bar dataKey="latency" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
