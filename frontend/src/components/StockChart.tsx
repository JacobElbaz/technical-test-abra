import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import type { StockDataPoint } from '../types/stock.types';

interface StockChartProps {
  data: StockDataPoint[];
  selectedStocks: string[];
  loading?: boolean;
  error?: string | null;
}

const COLORS = [
  '#1976d2',
  '#d32f2f',
  '#388e3c',
  '#f57c00',
  '#7b1fa2',
  '#0288d1',
  '#c2185b',
  '#5d4037',
];

export default function StockChart({
  data,
  selectedStocks,
  loading,
  error,
}: StockChartProps) {
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={1.5}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  // Get all available stock symbols from data (excluding 'date')
  const availableStocks = selectedStocks.filter((symbol) =>
    data.some((point) => point[symbol] !== undefined),
  );

  if (availableStocks.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <Typography variant="body2" color="text.secondary">
          No data available for selected stocks
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '350px', mt: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <Legend />
          {availableStocks.map((symbol, index) => (
            <Line
              key={symbol}
              type="monotone"
              dataKey={symbol}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
