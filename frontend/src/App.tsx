import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import StockChart from './components/StockChart';
import StockSelector from './components/StockSelector';
import DateRangePicker from './components/DateRangePicker';
import AIStockAgent from './components/AIStockAgent';
import { stockService } from './services/stock.service';
import type { StockDataPoint, DateRange } from './types/stock.types';

function App() {
  const [selectedStocks, setSelectedStocks] = useState<string[]>(['SPY']);
  const [dateRange, setDateRange] = useState<DateRange>(
    stockService.getDefaultDateRange(),
  );
  const [stockData, setStockData] = useState<StockDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = useCallback(async () => {
    if (selectedStocks.length === 0) {
      setStockData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await stockService.getStockData(selectedStocks, dateRange);
      setStockData(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch stock data';
      setError(errorMessage);
      setStockData([]);
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStocks, dateRange]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  const handleStocksChange = (stocks: string[]) => {
    // Ensure SPY is always included
    if (!stocks.includes('SPY')) {
      setSelectedStocks(['SPY', ...stocks]);
    } else {
      setSelectedStocks(stocks);
    }
  };

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Stock Market Trends
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Compare stock performance over time
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <StockSelector
          selectedStocks={selectedStocks}
          onChange={handleStocksChange}
        />
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <DateRangePicker dateRange={dateRange} onChange={handleDateRangeChange} />
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Stock Performance Chart
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <StockChart
          data={stockData}
          selectedStocks={selectedStocks}
          loading={loading}
          error={error}
        />
      </Paper>

      <AIStockAgent
        selectedStocks={selectedStocks}
        dateRange={dateRange}
      />
    </Container>
  );
}

export default App;
