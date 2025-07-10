import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart3,
  Bug,
  Activity,
  FileText,
  Zap,
  Gauge,
  RefreshCw,
  Users,
  TrendingDown,
} from 'lucide-react';
import {
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  Treemap
} from 'recharts';
import { Tooltip as RechartsTooltip } from 'recharts';

const cardColors = [
  'from-yellow-100 to-yellow-200 text-yellow-700',
  'from-indigo-100 to-indigo-200 text-indigo-700',
  'from-pink-100 to-pink-200 text-pink-700',
  'from-green-100 to-green-200 text-green-700',
  'from-purple-100 to-purple-200 text-purple-700',
  'from-red-100 to-red-200 text-red-700',
  'from-sky-100 to-sky-200 text-sky-700',
  'from-orange-100 to-orange-200 text-orange-700',
];
const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7f50',
  '#00bcd4',
  '#ffbb28',
  '#ff8042',
  '#8dd1e1',
];


export default function AgentHealthPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  

  const fetchHealthData = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/tracker/agent-health');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching agent health:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };
  const explainedRolesData = data?.top_explained_roles?.map((role, index) => ({
    name: role.job_title,
    size: role.count,
    color: COLORS[index % COLORS.length],
  })) || [];
  
  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-pulse">
        <Activity className="mr-2 animate-spin" /> Fetching Agent Metrics...
      </div>
    );
  }

  const latencyData = [
    { type: 'JD → Resume', latency: data.latency_stats.jd_to_resume || 0 },
    { type: 'Resume → JD', latency: data.latency_stats.resume_to_jd || 0 },
    { type: 'One-to-One', latency: data.latency_stats.one_to_one || 0 },
  ];
  const verticalColorMap = {
    Banking: '#6366f1',
    Healthcare: '#10b981',
    Insurance: '#9333ea',
    GTT: '#f59e0b',
    HTPS: '#3b82f6',
    'GEN-AI': '#e11d48',
    Cloud: '#0ea5e9',
    Hexavarsity: '#ec4899',
    Others: '#64748b'
  };
  
  const verticalsData = data.top_verticals.map((v) => ({
    name: v.vertical,
    value: v.count, // 'value' is used in PieChart
    color: verticalColorMap[v.vertical] || '#a3a3a3'
  }));
  
  const agentLatencyData = [
    { agent: 'Comparison', latency: data.agent_latency.comparison_agent },
    { agent: 'Explanation', latency: data.agent_latency.explanation_agent },
    { agent: 'Email', latency: data.agent_latency.email_agent },
  ];

  const matchTypeUsage = [
    { name: 'JD → Resume', value: data.jd_to_resume },
    { name: 'Resume → JD', value: data.resume_to_jd },
    { name: 'One-to-One', value: data.one_to_one },
  ];

  const pieColors = ['#C084FC', '#60A5FA', '#FDBA74'];
  const latencyColors = ['#8B5CF6', '#0EA5E9', '#F97316'];


  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-purple-50 text-gray-800 p-8 font-sans">
      <div className="flex justify-between items-center mb-16">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-500 to-sky-600 animate-gradient-x">
          Agent Intelligence Overview
        </h1>
        <button
          onClick={fetchHealthData}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700"
        >
          <RefreshCw size={16} className="animate-spin-slow" /> Refresh Now
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <MetricCard icon={Zap} title="Total Matches" value={data.total_matches} index={0} />
        <MetricCard icon={FileText} title="JDs Uploaded" value={data.jd_uploaded} index={1} />
        <MetricCard icon={FileText} title="Resumes Uploaded" value={data.resumes_uploaded} index={2} />
        <MetricCard icon={Gauge} title="Avg Match Score" value={data.avg_match_score} suffix="/ 1.0" index={3} />
        <MetricCard icon={Bug} title="Total Errors" value={data.total_errors} index={4} />
        <MetricCard icon={Users} title="Explainers Viewed" value={data.match_explainers} index={5} />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <ChartCard icon={Gauge} title="Latency by Match Type (sec)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={latencyData}>
            <XAxis
        dataKey="type"
        angle={-15}
        textAnchor="end"
        interval={0}
        height={50}
      />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="latency">
                {latencyData.map((entry, index) => (
                  <Cell key={index} fill={entry.latency > 3 ? '#f87171' : latencyColors[index % latencyColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Activity} title="Daily Agent Usage">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.daily_usage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="matches" stroke="#0EA5E9" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard icon={Gauge} title="Latency by Agent (sec)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={agentLatencyData}>
            <XAxis dataKey="agent" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="latency">
              {agentLatencyData.map((entry, index) => (
                <Cell key={index} fill={latencyColors[index % latencyColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard icon={BarChart3} title="Most Used Match Types">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={matchTypeUsage} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {matchTypeUsage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
     


<ChartCard icon={Users} title="Top Explained Roles">
  <ResponsiveContainer width="100%" height={320}>
    <Treemap
      data={explainedRolesData}
      dataKey="size"
      nameKey="name"
      stroke="#fff"
      content={({ depth, x, y, width, height, name, size, color }) => {
        // Dynamic font size based on box size
        const fontSize = Math.min(14, Math.max(8, Math.min(width / name.length, height / 2)));

        // Show label only if box is reasonably big
        const showLabel = width > 40 && height > 30;

        return (
          <g>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={color}
              stroke="#fff"
              strokeWidth={2}
              rx={6}
              ry={6}
            />
            {showLabel && (
              <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize={fontSize}
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {name.length * fontSize > width ? name.slice(0, Math.floor(width / fontSize) - 1) + '…' : name}
              </text>
            )}
            {/* Invisible rect to handle tooltip hover */}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill="transparent"
              cursor="pointer"
            >
              <title>{`${name}: ${size}`}</title>
            </rect>
          </g>
        );
      }}
    />
  </ResponsiveContainer>
</ChartCard>


      <ChartCard icon={Bug} title="Agent Error Insights">
        
        <p className="text-gray-600">Total Count: <strong className="text-red-600">{data.unresolved_errors}</strong></p>
        <p className="text-gray-600 mt-2">
          Most Common: <span className="font-semibold text-purple-700">{data.most_common_error}</span>
          {' '}({data.most_common_error_count})
        </p>
      </ChartCard>

      <ChartCard icon={BarChart3} title="Top Verticals">
  <ResponsiveContainer width="100%" height={320}>
    <PieChart>
      <Pie
        data={verticalsData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={100}
        innerRadius={60}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
      >
        {verticalsData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</ChartCard>



      <div className="text-center text-sm text-gray-500 mt-10">
        Last refreshed every <strong>30 seconds</strong>. Powered by RadarX Intelligence Engine.
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, suffix, index }) {
  const colorClass = `bg-gradient-to-br ${cardColors[index % cardColors.length]}`;
  return (
    <div className="relative group flex items-center gap-4 p-5 rounded-xl bg-white/80 shadow border border-gray-200 font-sans">
      <div className={`p-3 rounded-full ${colorClass} relative`}>
        <Icon />
      </div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <h3 className="text-xl font-bold text-gray-900">
          {value} {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
        </h3>
      </div>
    </div>
  );
}

function ChartCard({ icon: Icon, title, children }) {
  return (
    <div className="p-6 rounded-3xl bg-white/70 shadow-md border border-gray-200 backdrop-blur-xl mb-10">
      <div className="flex items-center gap-3 mb-4">
        <Icon />
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}
