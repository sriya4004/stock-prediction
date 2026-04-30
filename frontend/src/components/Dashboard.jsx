import React, { useState, useEffect } from 'react';
import { 
  LineChart, PieChart as PieIcon, Activity, TrendingUp, AlertTriangle, 
  MessageCircle, BarChart2 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = "http://localhost:8000";

const Dashboard = () => {
  const [ticker, setTicker] = useState("AAPL");
  const [modelType, setModelType] = useState("LSTM");
  const [predictData, setPredictData] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [risk, setRisk] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, [ticker, modelType]);

  const fetchDashboardData = async () => {
    try {
      setError("");
      const simulatedHeadlines = [
        `${ticker} announces quarterly business update and forward guidance`,
        `${ticker} attracts investor attention on earnings outlook`,
        `Analysts discuss valuation outlook for ${ticker}`
      ];

      const predRes = await axios.post(`${API_BASE}/predict`, { ticker, model_type: modelType });
      setPredictData(predRes.data);

      const historyRes = await axios.get(`${API_BASE}/history/${ticker}?days=30`);
      setHistory(historyRes.data);

      const portRes = await axios.get(`${API_BASE}/portfolio`);
      setPortfolio(portRes.data);

      const recRes = await axios.post(`${API_BASE}/recommend`, { ticker, headlines: simulatedHeadlines });
      setRecommendation(recRes.data);

      const riskRes = await axios.post(`${API_BASE}/risk`, { ticker });
      setRisk(riskRes.data);
      const sentimentRes = await axios.post(`${API_BASE}/sentiment`, { headlines: simulatedHeadlines });
      setSentiment(sentimentRes.data);

      const simRes = await axios.post(`${API_BASE}/simulate`, { ticker, initial_capital: 10000 });
      setSimulation(simRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
      setError(err?.response?.data?.detail || "Unable to fetch dashboard data");
    }
  };

  const lineData = {
    labels: [...(history?.dates?.map((d) => d?.slice?.(0, 10)) || []), 'Predicted'],
    datasets: [
      {
        label: `${ticker} Price Trend`,
        data: [...(history?.close_prices || []), predictData?.predicted_price],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const pieData = {
    labels: portfolio ? Object.keys(portfolio.weights) : [],
    datasets: [
      {
        data: portfolio ? Object.values(portfolio.weights) : [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <Activity className="w-10 h-10 text-cyan-400" />
          <h1 className="text-3xl font-bold tracking-tight">StockAI Dashboard</h1>
        </div>
        <select 
          className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        >
          <option value="AAPL">AAPL (Apple)</option>
          <option value="TSLA">TSLA (Tesla)</option>
          <option value="INFY">INFY (Infosys)</option>
        </select>
        <select
          className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 ml-3"
          value={modelType}
          onChange={(e) => setModelType(e.target.value)}
        >
          <option value="LSTM">LSTM</option>
          <option value="GRU">GRU</option>
        </select>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<TrendingUp className="text-emerald-400" />} title="Prediction" value={`$${predictData?.predicted_price?.toFixed(2)}`} sub={`${predictData?.trend} (${predictData?.model_type_used || modelType})`} />
        <StatCard icon={<AlertTriangle className="text-amber-400" />} title="Risk Level" value={risk?.risk_level} sub={`${((risk?.annualized_volatility ?? 0) * 100).toFixed(1)}% Volatility`} />
        <StatCard icon={<PieIcon className="text-purple-400" />} title="Portfolio Sharpe" value={portfolio?.sharpe_ratio?.toFixed(2)} sub="Optimized" />
        <StatCard icon={<BarChart2 className="text-cyan-400" />} title="Signal" value={recommendation?.signal} sub={`${recommendation?.confidence} Confidence | Risk ${recommendation?.risk_score ?? "N/A"}`} />
      </div>
      
      {error && (
        <div className="mb-8 rounded-lg border border-rose-500/40 bg-rose-900/20 px-4 py-3 text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-cyan-400" /> Price Trend & Prediction
          </h2>
          <div className="h-80">
            <Line data={lineData} options={{ maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} />
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-purple-400" /> Portfolio Weights
          </h2>
          <div className="h-64 flex justify-center">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
           <MessageCircle className="w-5 h-5 text-emerald-400" /> Strategy Recommendation
        </h2>
        <p className="text-slate-400 leading-relaxed">{recommendation?.reason}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Sentiment Analysis</h2>
          <p className="text-slate-300">Overall: <span className="font-semibold">{sentiment?.sentiment || "N/A"}</span></p>
          <p className="text-slate-400">Score: {sentiment?.score ?? "N/A"}</p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Strategy Simulator</h2>
          <p className="text-slate-300">ROI: <span className="font-semibold">{simulation?.roi_percent ?? "N/A"}%</span></p>
          <p className="text-slate-400">P/L: ${simulation?.profit_loss?.toFixed?.(2) ?? "N/A"}</p>
          <p className="text-slate-400">Trades: {simulation?.total_trades ?? "N/A"}</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, sub }) => (
  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all">
    <div className="flex justify-between items-start mb-4">
      {icon}
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
    </div>
    <div className="text-2xl font-bold mb-1">{value || "---"}</div>
    <div className={`text-sm ${sub?.includes('Up') || sub?.includes('Buy') ? 'text-emerald-400' : sub?.includes('Down') || sub?.includes('Sell') ? 'text-rose-400' : 'text-slate-500'}`}>
      {sub || "Calculating..."}
    </div>
  </div>
);

export default Dashboard;
