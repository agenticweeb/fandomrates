"use client";

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ScoreChartPoint {
  date: string;
  [key: string]: number | string;
}

interface ScoreChartProps {
  data: ScoreChartPoint[];
  seriesKeys: string[];
  seriesLabels: { [key: string]: string };
  colors: { [key: string]: string };
}

export default function ScoreChart({ data, seriesKeys, seriesLabels, colors }: ScoreChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center border border-border rounded-xl bg-surface">
        <p className="text-sm text-text-secondary">No historical scoring data available to chart.</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full p-4 border border-border rounded-xl bg-surface">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
          <CartesianGrid stroke="#1f1f2e" strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            stroke="#5c5c7a" 
            tick={{ fill: '#8a8a9a', fontSize: 11 }}
            tickLine={{ stroke: '#2a2a3a' }}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#5c5c7a"
            tick={{ fill: '#8a8a9a', fontSize: 11 }}
            tickLine={{ stroke: '#2a2a3a' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#12121a',
              borderColor: '#2a2a3a',
              borderRadius: '8px',
              color: '#e8e8f0',
              fontSize: '12px'
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            formatter={(value) => <span className="text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer">{seriesLabels[value] || value}</span>}
          />
          {seriesKeys.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[key] || '#7c3aed'}
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
