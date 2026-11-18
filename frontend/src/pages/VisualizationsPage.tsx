import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  LineChart,
  AreaChart,
  ScatterChart,
  Sparkles,
  Download,
  Filter,
  RefreshCw,
  Layers,
  Sliders,
  Check
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { api } from '../services/api';
import { ChartRecommendation, ChartDataRequest, ChartDataResponse } from '../types';
import { DynamicChart } from '../charts/DynamicChart';

export const VisualizationsPage: React.FC = () => {
  const { activeDataset, activeOverview } = useDataset();

  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [chartType, setChartType] = useState<string>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [groupBy, setGroupBy] = useState<string>('');
  const [aggregation, setAggregation] = useState<string>('sum');
  const [bins, setBins] = useState<number>(10);
  const [limit, setLimit] = useState<number>(15);

  // Filter
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterOperator, setFilterOperator] = useState<string>('==');
  const [filterValue, setFilterValue] = useState<string>('');

  const [chartResponse, setChartResponse] = useState<ChartDataResponse | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fetch AI Recommendations when dataset changes
  useEffect(() => {
    if (!activeDataset) return;
    const fetchRecs = async () => {
      setIsLoadingRecs(true);
      try {
        const recs = await api.getRecommendations(activeDataset.id);
        setRecommendations(recs);
        if (recs.length > 0) {
          applyRecommendation(recs[0]);
        }
      } catch (err) {
        console.error('Failed to get recommendations:', err);
      } finally {
        setIsLoadingRecs(false);
      }
    };
    fetchRecs();
  }, [activeDataset?.id]);

  const applyRecommendation = (rec: ChartRecommendation) => {
    setChartType(rec.chart_type);
    if (rec.x_axis) setXAxis(rec.x_axis);
    if (rec.y_axis) setYAxis(rec.y_axis);
    if (rec.group_by) setGroupBy(rec.group_by);
    if (rec.aggregation) setAggregation(rec.aggregation);
  };

  // Re-fetch chart data whenever parameters change
  useEffect(() => {
    if (!activeDataset) return;
    const fetchChart = async () => {
      setIsLoadingChart(true);
      setErrorMsg('');
      try {
        const req: ChartDataRequest = {
          dataset_id: activeDataset.id,
          chart_type: chartType,
          x_axis: xAxis || undefined,
          y_axis: yAxis || undefined,
          group_by: groupBy || undefined,
          aggregation: aggregation,
          bins: bins,
          limit: limit,
          filter_column: filterColumn || undefined,
          filter_operator: filterColumn && filterValue ? filterOperator : undefined,
          filter_value: filterColumn && filterValue ? filterValue : undefined,
        };
        const resp = await api.getChartData(req);
        setChartResponse(resp);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to render chart.');
        setChartResponse(null);
      } finally {
        setIsLoadingChart(false);
      }
    };
    fetchChart();
  }, [activeDataset?.id, chartType, xAxis, yAxis, groupBy, aggregation, bins, limit, filterColumn, filterOperator, filterValue]);

  if (!activeDataset || !activeOverview) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
        <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Dataset Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Select or upload a dataset to generate visual analytics and interactive charts.
        </p>
      </div>
    );
  }

  const { columns, numeric_columns, categorical_columns } = activeOverview;

  const chartTypes = [
    { id: 'bar', label: 'Bar Chart' },
    { id: 'line', label: 'Line Chart' },
    { id: 'area', label: 'Area Chart' },
    { id: 'pie', label: 'Pie Chart' },
    { id: 'donut', label: 'Donut Chart' },
    { id: 'histogram', label: 'Histogram' },
    { id: 'scatter', label: 'Scatter Plot' },
    { id: 'boxplot', label: 'Box Plot' },
    { id: 'heatmap', label: 'Heatmap' },
  ];

  const downloadChartDataJson = () => {
    if (!chartResponse) return;
    const blob = new Blob([JSON.stringify(chartResponse.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chartResponse.title.replace(/\s+/g, '_')}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Interactive Data Visualizations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic chart engine with Recharts across 9 visualizations for <b className="text-slate-200">{activeDataset.name}</b>.
          </p>
        </div>

        {chartResponse && (
          <button
            onClick={downloadChartDataJson}
            className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition flex items-center space-x-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Chart Data</span>
          </button>
        )}
      </div>

      {/* AI Smart Recommendations Carousel */}
      {recommendations.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Automated AI Chart Recommendations</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recommendations.map((rec, i) => (
              <button
                key={i}
                onClick={() => applyRecommendation(rec)}
                className={`text-left p-3 rounded-lg border transition ${
                  chartType === rec.chart_type && xAxis === rec.x_axis && yAxis === rec.y_axis
                    ? 'bg-primary-500/10 border-primary-500/50 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 truncate pr-2">{rec.title}</span>
                  <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                    {rec.chart_type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                  {rec.reason}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Studio: Controls + Live Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-primary-400" />
            <span>Chart Builder</span>
          </div>

          {/* Chart Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Chart Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {chartTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setChartType(t.id)}
                  className={`py-1.5 px-2 text-[11px] rounded-lg font-medium transition text-center ${
                    chartType === t.id
                      ? 'bg-primary-600 text-white font-bold shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* X Axis */}
          {chartType !== 'heatmap' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {chartType === 'histogram' ? 'Distribution Variable' : 'X-Axis / Category'}
              </label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Select column...</option>
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.semantic_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Y Axis */}
          {!['heatmap', 'histogram'].includes(chartType) && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Y-Axis / Metric
              </label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">(Optional - Frequency count if unselected)</option>
                {numeric_columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Grouping Column for Bar/Line */}
          {['bar', 'line'].includes(chartType) && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Group By (Pivot Multi-Series)
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">None (Single Series)</option>
                {categorical_columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Aggregation Function */}
          {!['heatmap', 'scatter', 'histogram', 'boxplot'].includes(chartType) && yAxis && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Aggregation
              </label>
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
              >
                <option value="sum">Sum</option>
                <option value="avg">Average (Mean)</option>
                <option value="count">Count of records</option>
                <option value="max">Maximum</option>
                <option value="min">Minimum</option>
              </select>
            </div>
          )}

          {/* Histogram Bins */}
          {chartType === 'histogram' && (
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Bins: {bins}</span>
              </div>
              <input
                type="range"
                min={5}
                max={25}
                value={bins}
                onChange={(e) => setBins(Number(e.target.value))}
                className="w-full accent-primary-500"
              />
            </div>
          )}

          {/* Data Filter */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary-400" />
              <span>Data Filter</span>
            </span>
            <select
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="">No Filter Applied</option>
              {columns.map((c) => (
                <option key={c.name} value={c.name}>
                  Filter by {c.name}
                </option>
              ))}
            </select>
            {filterColumn && (
              <div className="flex space-x-1.5">
                <select
                  value={filterOperator}
                  onChange={(e) => setFilterOperator(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white w-20"
                >
                  <option value="==">==</option>
                  <option value="!=">!=</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value="contains">contains</option>
                </select>
                <input
                  type="text"
                  placeholder="Filter value..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Visualization Canvas */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl min-h-[460px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {chartResponse?.title || 'Interactive Visualization Canvas'}
                </h3>
                <p className="text-xs text-slate-400">
                  {chartResponse?.x_axis ? `X: ${chartResponse.x_axis}` : ''}
                  {chartResponse?.y_axis ? ` • Y: ${chartResponse.y_axis}` : ''}
                </p>
              </div>

              {isLoadingChart && (
                <div className="flex items-center text-xs text-primary-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Computing chart...</span>
                </div>
              )}
            </div>

            {errorMsg ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-amber-400 space-y-2">
                <p className="text-sm font-semibold">{errorMsg}</p>
                <p className="text-xs text-slate-500">Try adjusting the X or Y axis selections in the builder.</p>
              </div>
            ) : chartResponse ? (
              <div className="pt-2">
                <DynamicChart
                  chartType={chartResponse.chart_type}
                  data={chartResponse.data}
                  xAxis={chartResponse.x_axis}
                  yAxis={chartResponse.y_axis}
                  meta={chartResponse.meta}
                  height={380}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                Select your columns and chart type on the left to render visualization.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Powered by Recharts SVG vector rendering</span>
            <span>Dataset: {activeDataset.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

