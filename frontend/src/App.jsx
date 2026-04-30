import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Search, Loader2, AlertCircle, BarChart3, ShieldCheck,
  ArrowUpRight, ArrowDownRight, PieChart as PieIcon, Activity,
  LineChart as LineIcon, History, Zap, MessageSquare, Info
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

const API_BASE = "http://localhost:8000";

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Data States
  const [predictData, setPredictData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ticker) {
        fetchAllData(ticker);
      }
    }, 800); // Debounce for 800ms

    return () => clearTimeout(timer);
  }, [ticker]);

  const fetchAllData = async (symbol) => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    const upperSymbol = symbol.toUpperCase();
    
    try {
      const endpoints = [
        { key: 'predict', url: `${API_BASE}/predict`, method: 'POST', body: { ticker: upperSymbol } },
        { key: 'history', url: `${API_BASE}/history/${upperSymbol}?days=30`, method: 'GET' },
        { key: 'portfolio', url: `${API_BASE}/portfolio?tickers=${upperSymbol},AAPL,TSLA,INFY`, method: 'GET' },
        { key: 'risk', url: `${API_BASE}/risk`, method: 'POST', body: { ticker: upperSymbol } },
        { key: 'recommend', url: `${API_BASE}/recommend`, method: 'POST', body: { ticker: upperSymbol } },
        { key: 'simulate', url: `${API_BASE}/simulate`, method: 'POST', body: { ticker: upperSymbol, initial_capital: 10000 } }
      ];

      const results = await Promise.allSettled(
        endpoints.map(async (endpoint) => {
          const options = {
            method: endpoint.method,
            headers: { 'Content-Type': 'application/json' },
          };
          if (endpoint.method === 'POST') {
            options.body = JSON.stringify(endpoint.body);
          }
          const response = await fetch(endpoint.url, options);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Failed to fetch ${endpoint.key}`);
          }
          return response.json();
        })
      );

      const [pRes, hRes, portRes, riskRes, recRes, simRes] = results;

      if (pRes.status === 'fulfilled') setPredictData(pRes.value);
      if (hRes.status === 'fulfilled') setHistoryData(hRes.value);
      if (portRes.status === 'fulfilled') setPortfolioData(portRes.value);
      if (riskRes.status === 'fulfilled') setRiskData(riskRes.value);
      if (recRes.status === 'fulfilled') setRecommendation(recRes.value);
      if (simRes.status === 'fulfilled') setSimulation(simRes.value);

      if (pRes.status === 'rejected') {
        setError(pRes.reason.message || "Failed to fetch data. Ensure backend is running.");
      }
    } catch (err) {
      setError(err.message || "Critical error loading system data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchAllData(ticker);
  };

  // Chart Configs
  const lineChartData = {
    labels: historyData ? [...historyData.dates.map(d => d.split(' ')[0]), 'PREDICTED'] : [],
    datasets: [{
      label: `${ticker} Price ($)`,
      data: historyData ? [...historyData.close_prices, predictData?.predicted_price || 0] : [],
      borderColor: '#22d3ee',
      backgroundColor: 'rgba(34, 211, 238, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: (context) => context.dataIndex === (historyData?.close_prices.length || 0) ? 6 : 2,
      pointBackgroundColor: (context) => context.dataIndex === (historyData?.close_prices.length || 0) ? '#f43f5e' : '#22d3ee'
    }]
  };

  const pieChartData = {
    labels: portfolioData ? Object.keys(portfolioData.weights) : [],
    datasets: [{
      data: portfolioData ? Object.values(portfolioData.weights) : [],
      backgroundColor: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'],
      borderWidth: 0,
    }]
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800/60 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500 rounded-xl">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              StockAI Terminal
            </h1>
          </div>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search ticker (e.g. TSLA)"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={handleSearch}
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Backend Online</span>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-6 md:p-8">
        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl w-fit mb-8 border border-slate-800/50">
          {['overview', 'portfolio', 'backtest'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="AI Target Price" 
                value={predictData?.predicted_price ? `$${predictData.predicted_price.toFixed(2)}` : '---'}
                sub={predictData?.trend ? `${predictData.trend.toUpperCase()} TREND` : 'Calculating...'}
                icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
                trend={predictData?.trend}
              />
              <StatCard 
                title="Risk Analysis" 
                value={predictData?.risk_score !== undefined ? predictData.risk_score : '---'}
                sub={predictData?.risk_level ? `${predictData.risk_level} Risk` : 'Analyzing...'}
                icon={<ShieldCheck className="w-5 h-5 text-purple-400" />}
                riskScore={predictData?.risk_score}
              />
              <StatCard 
                title="Market Sentiment" 
                value={recommendation?.sentiment_score !== undefined ? recommendation.sentiment_score : '---'}
                sub={recommendation?.sentiment_score !== undefined ? (recommendation.sentiment_score > 0 ? "BULLISH" : recommendation.sentiment_score < 0 ? "BEARISH" : "NEUTRAL") : 'Analyzing...'}
                icon={<MessageSquare className="w-5 h-5 text-emerald-400" />}
                trend={recommendation?.sentiment_score > 0 ? 'up' : 'down'}
              />
              <StatCard 
                title="AI Confidence" 
                value={recommendation?.confidence ? (typeof recommendation.confidence === 'number' ? `${recommendation.confidence}%` : recommendation.confidence) : '---%'}
                sub={recommendation?.signal || 'Pending...'}
                icon={<Zap className="w-5 h-5 text-amber-400" />}
                isSignal={true}
                signalType={recommendation?.signal}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Chart */}
              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/50 rounded-3xl p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <LineIcon className="w-5 h-5 text-cyan-400" /> Price Momentum & AI Forecast
                  </h3>
                  <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">30 Day Window</div>
                </div>
                <div className="h-[350px]">
                  {loading ? (
                    <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-700" /></div>
                  ) : (
                    <Line 
                      data={lineChartData} 
                      options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b' } },
                          x: { grid: { display: false }, ticks: { color: '#64748b', maxRotation: 0 } }
                        }
                      }} 
                    />
                  )}
                </div>
              </div>

              {/* Recommendation Details */}
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl h-full">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Strategy Insight
                  </h3>
                  {recommendation ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <div className="text-xs text-slate-400 mb-2 uppercase font-bold">Signal Verdict</div>
                        <div className={`text-2xl font-black ${
                          recommendation.signal?.toUpperCase() === 'BUY' ? 'text-emerald-400' : 
                          recommendation.signal?.toUpperCase() === 'SELL' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {recommendation.signal?.toUpperCase() || 'HOLD'}
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed italic">
                        "{recommendation.reason}"
                      </p>
                      <div className="pt-4 border-t border-slate-800/50 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Sentiment Score</div>
                          <div className="text-sm font-bold text-slate-300">{recommendation.sentiment_score}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Risk Score</div>
                          <div className="text-sm font-bold text-slate-300">{recommendation.risk_score}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-slate-600 italic text-sm text-center px-4">
                      Run search to generate strategy insight
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-purple-400" /> Optimal Capital Allocation
              </h3>
              <div className="h-[300px] flex justify-center">
                {portfolioData ? (
                  <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
                ) : (
                  <Loader2 className="w-8 h-8 animate-spin text-slate-700 self-center" />
                )}
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" /> Optimization Stats
              </h3>
              {portfolioData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-1">Exp. Return</div>
                      <div className="text-xl font-bold text-emerald-400">{(portfolioData.annualized_return * 100).toFixed(2)}%</div>
                    </div>
                    <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-1">Portfolio Risk</div>
                      <div className="text-xl font-bold text-rose-400">{(portfolioData.annualized_volatility * 100).toFixed(2)}%</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs text-slate-500 uppercase font-bold px-2">Weight Distribution</div>
                    {Object.entries(portfolioData.weights).map(([t, w]) => (
                      <div key={t} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                        <span className="font-bold text-slate-300">{t}</span>
                        <span className="font-mono text-cyan-400">{(w * 100).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-700 italic">No portfolio data available</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'backtest' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6">
                <div className="text-xs text-slate-500 font-bold uppercase mb-2">Backtest ROI</div>
                <div className={`text-4xl font-black ${simulation?.roi_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simulation ? `${simulation.roi_percent}%` : '---'}
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6">
                <div className="text-xs text-slate-500 font-bold uppercase mb-2">Total Trades</div>
                <div className="text-4xl font-black text-white">
                  {simulation ? simulation.total_trades : '---'}
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6">
                <div className="text-xs text-slate-500 font-bold uppercase mb-2">Profit / Loss</div>
                <div className={`text-4xl font-black ${simulation?.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simulation ? `$${simulation.profit_loss.toFixed(2)}` : '---'}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" /> Recent Trade History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/50 uppercase text-[10px] tracking-widest font-black">
                      <th className="pb-4">Day Index</th>
                      <th className="pb-4">Action</th>
                      <th className="pb-4 text-right">Price</th>
                      <th className="pb-4 text-right">Shares</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {simulation?.trades.slice(-5).reverse().map((trade, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-4 text-slate-400 font-mono">T-{30 - trade.day}</td>
                        <td className="py-4 font-bold">
                          <span className={`px-2 py-1 rounded text-[10px] ${trade.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {trade.action}
                          </span>
                        </td>
                        <td className="py-4 text-right font-mono">${trade.price.toFixed(2)}</td>
                        <td className="py-4 text-right font-mono">{trade.shares}</td>
                      </tr>
                    ))}
                    {!simulation && <tr><td colSpan="4" className="py-8 text-center text-slate-600 italic">No simulation data loaded</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-[1400px] mx-auto p-12 text-center border-t border-slate-900 mt-12">
        <div className="flex justify-center gap-4 mb-4">
          <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">{ticker} Engine v1.0</div>
          <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">{recommendation?.risk_level || '---'} Risk Core</div>
        </div>
        <p className="text-slate-600 text-xs">Developed for Advanced Stock Prediction & Portfolio Optimization. Use for educational purposes only.</p>
      </footer>
    </div>
  );
}

const StatCard = ({ title, value, sub, icon, trend, isSignal, signalType, riskScore }) => {
  const getTrendColor = () => {
    if (riskScore !== undefined) {
      if (riskScore < 30) return 'text-emerald-400';
      if (riskScore <= 60) return 'text-amber-400';
      return 'text-rose-400';
    }
    if (isSignal && signalType) {
      if (signalType.toUpperCase() === 'BUY') return 'text-emerald-400';
      if (signalType.toUpperCase() === 'SELL') return 'text-rose-400';
      return 'text-amber-400';
    }
    if (trend === 'up') return 'text-emerald-400';
    if (trend === 'down') return 'text-rose-400';
    return 'text-slate-500';
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl hover:border-slate-700/50 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-800/50 rounded-xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mt-2">{title}</span>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${getTrendColor()}`}>
        {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
        {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
        {sub}
      </div>
    </div>
  );
};

export default App;
