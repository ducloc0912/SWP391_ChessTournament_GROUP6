import React from 'react';


const RankingChart = ({ data }) => {
  return (
    <div className="card chart-wrapper">
      <div style={{ marginBottom: '1rem' }}>
        <h3 className="font-bold" style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Ranking Progress
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 6 months performance</p>
      </div>
      
      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                padding={{ left: 10, right: 10 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line 
              type="monotone" 
              dataKey="rank" 
              stroke="#6366f1" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RankingChart;