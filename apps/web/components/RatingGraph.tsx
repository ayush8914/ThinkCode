'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function RatingGraph({ userId }: { userId: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

const fetchHistory = async () => {
  try {
    const res = await fetch(`/api/user/${userId}/rating-history`);
    const data = await res.json();
    console.log('API Response:', data); 
    
    if (data.success && data.history && Array.isArray(data.history)) {
      const validHistory = data.history.map((h: any) => ({
        rating: h.rating || h.newRating || 800, // Handle both formats
        change: h.change || 0,
        createdAt: h.createdAt || new Date().toISOString(),
        contest: h.contest || null,
      })).filter((h: any) => typeof h.rating === 'number' && !isNaN(h.rating));
      
      console.log('Processed history:', validHistory); 
      setHistory(validHistory);
    } else {
      setHistory([]);
    }
  } catch (error) {
    console.error('Failed to fetch rating history:', error);
    setHistory([]);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white/5 rounded">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-white/5 rounded text-white/40">
        <p>No rating history yet. Participate in contests!</p>
      </div>
    );
  }

  const ratings = history.map(h => h.rating).filter(r => !isNaN(r));
  const current = ratings[ratings.length - 1] || 800;
  const max = Math.max(...ratings, 800);
  const min = Math.min(...ratings, 800);

  const chartData = {
  labels: history.map(h => {
    try {
      const date = new Date(h.createdAt);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }),
  datasets: [
    {
      label: 'Rating',
      data: history.map(h => h.rating),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: history.map(h => 
        (h.change || 0) > 0 ? '#10b981' : (h.change || 0) < 0 ? '#ef4444' : '#8b5cf6'
      ),
    },
  ],
};

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        min: Math.max(0, min - 50),
        max: max + 50,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.6)' },
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.6)' },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-white/5 rounded">
          <p className="text-white/40 text-xs">Current</p>
          <p className="text-2xl font-bold text-white">{current}</p>
        </div>
        <div className="text-center p-3 bg-white/5 rounded">
          <p className="text-white/40 text-xs">Max</p>
          <p className="text-2xl font-bold text-emerald-400">{max}</p>
        </div>
        <div className="text-center p-3 bg-white/5 rounded">
          <p className="text-white/40 text-xs">Min</p>
          <p className="text-2xl font-bold text-rose-400">{min}</p>
        </div>
      </div>
      
      <div className="h-64 bg-white/5 rounded p-4">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}