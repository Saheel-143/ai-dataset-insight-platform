import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface DynamicChartProps {
  chartType: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  meta?: Record<string, any>;
  height?: number;
}

const PALETTE = [
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#84cc16', // Lime
  '#f97316', // Orange
];

export const DynamicChart: React.FC<DynamicChartProps> = ({
  chartType,
  data,
  xAxis,
  yAxis,
  meta,
  height = 360,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No chart data available for this configuration.
      </div>
    );
  }

  const type = chartType.toLowerCase();

  // 1. CORRELATION HEATMAP
  if (type === 'heatmap') {
    const columns = meta?.columns || Object.keys(data[0] || {}).filter((k) => k !== 'variable');
    return (
      <div className="overflow-x-auto p-2">
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-slate-400 font-semibold border-b border-slate-800 text-left">
                Feature
              </th>
              {columns.map((col: string) => (
                <th key={col} className="p-2 text-slate-300 font-medium border-b border-slate-800">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: number) => (
              <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition">
                <td className="p-2 text-left font-medium text-slate-300">{row.variable}</td>
                {columns.map((col: string) => {
                  const val = row[col] !== undefined ? Number(row[col]) : 0;
                  // Color scale: red for negative, dark for zero, green/indigo for positive
                  const isPos = val >= 0;
                  const intensity = Math.min(Math.abs(val), 1);
                  const bgColor = isPos
                    ? `rgba(99, 102, 241, ${intensity * 0.75 + 0.1})`
                    : `rgba(239, 68, 68, ${intensity * 0.75 + 0.1})`;

                  return (
                    <td
                      key={col}
                      className="p-2 font-mono text-[11px]"
                      style={{ backgroundColor: bgColor }}
                    >
                      <span className="font-semibold text-white drop-shadow-sm">
                        {val.toFixed(2)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 2. BOX PLOT (Visualized via range bar & metrics)
  if (type === 'boxplot') {
    return (
      <div className="p-4 space-y-3">
        {data.map((item: any, idx: number) => {
          const min = Number(item.min || 0);
          const max = Number(item.max || 1);
          const range = max - min || 1;
          const q25Pct = ((Number(item.q25) - min) / range) * 100;
          const medianPct = ((Number(item.median) - min) / range) * 100;
          const q75Pct = ((Number(item.q75) - min) / range) * 100;

          return (
            <div key={idx} className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-200">{item.category}</span>
                <span className="text-slate-400 font-mono">
                  Median: <b className="text-primary-400">{item.median}</b> | IQR: [{item.q25} - {item.q75}]
                </span>
              </div>
              {/* Range bar */}
              <div className="relative h-6 bg-slate-900 rounded-md border border-slate-700 flex items-center px-1">
                {/* Min-Max Whisker */}
                <div className="absolute left-2 right-2 h-0.5 bg-slate-600"></div>
                {/* IQR Box */}
                <div
                  className="absolute h-4 bg-primary-600/60 border border-primary-400 rounded-sm"
                  style={{
                    left: `${Math.max(2, Math.min(95, q25Pct))}%`,
                    width: `${Math.max(4, Math.min(95 - q25Pct, q75Pct - q25Pct))}%`,
                  }}
                ></div>
                {/* Median Line */}
                <div
                  className="absolute h-5 w-1 bg-amber-400 z-10 rounded"
                  style={{ left: `${Math.max(2, Math.min(98, medianPct))}%` }}
                  title={`Median: ${item.median}`}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>Min: {item.min}</span>
                <span>Max: {item.max}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 3. PIE & DONUT CHARTS
  if (type === 'pie' || type === 'donut') {
    const isDonut = type === 'donut';
    const nameKey = xAxis || Object.keys(data[0])[0];
    const valKey = yAxis || Object.keys(data[0])[1] || 'count';

    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={valKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={isDonut ? 65 : 0}
            outerRadius={105}
            paddingAngle={3}
            label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // 4. SCATTER PLOT
  if (type === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            type="number"
            dataKey="x"
            name={xAxis}
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            tickLine={{ stroke: '#334155' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yAxis}
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            tickLine={{ stroke: '#334155' }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
            }}
          />
          <Scatter name="Observations" data={data} fill="#818cf8" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  // 5. HISTOGRAM
  if (type === 'histogram') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="bin"
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            angle={-25}
            textAnchor="end"
            interval={0}
          />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
            }}
          />
          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // 6. LINE & AREA CHARTS
  if (type === 'line' || type === 'area') {
    const xKey = xAxis || Object.keys(data[0])[0];
    const keys = Object.keys(data[0]).filter((k) => k !== xKey);
    const primaryY = yAxis || keys[0] || 'value';

    return (
      <ResponsiveContainer width="100%" height={height}>
        {type === 'area' ? (
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={xKey} stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
            />
            <Area
              type="monotone"
              dataKey={primaryY}
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorArea)"
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={xKey} stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            {keys.map((k, idx) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={PALETTE[idx % PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: PALETTE[idx % PALETTE.length] }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    );
  }

  // 7. DEFAULT: BAR CHART (Grouped or Single)
  const xKey = xAxis || Object.keys(data[0])[0];
  const keys = Object.keys(data[0]).filter((k) => k !== xKey);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey={xKey}
          stroke="#64748b"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={data.length > 8 ? -25 : 0}
          textAnchor={data.length > 8 ? 'end' : 'middle'}
        />
        <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#f8fafc',
          }}
        />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />}
        {keys.map((k, idx) => (
          <Bar
            key={k}
            dataKey={k}
            fill={PALETTE[idx % PALETTE.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

