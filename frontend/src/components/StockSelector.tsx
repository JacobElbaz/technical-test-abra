import { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { stockSearchService } from '../services/stock-search.service';
import type { StockSearchResult } from '../types/stock.types';

interface StockSelectorProps {
  selectedStocks: string[];
  onChange: (stocks: string[]) => void;
}

export default function StockSelector({
  selectedStocks,
  onChange,
}: StockSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchStocks = async () => {
      if (searchQuery.trim().length < 1) {
        setSearchResults([]);
        setShowDropdown(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setShowDropdown(true);
      try {
        const results = await stockSearchService.searchStocks(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching stocks:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchStocks, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSelectStock = (stock: StockSearchResult) => {
    if (!selectedStocks.includes(stock.symbol)) {
      onChange([...selectedStocks, stock.symbol]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleRemoveStock = (symbol: string) => {
    if (symbol !== 'SPY') {
      onChange(selectedStocks.filter((s) => s !== symbol));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchQuery.trim().length > 0) {
      // Try to add the symbol directly if it looks like a valid symbol
      const symbol = searchQuery.trim().toUpperCase();
      if (/^[A-Z0-9.]+$/.test(symbol) && !selectedStocks.includes(symbol)) {
        onChange([...selectedStocks, symbol]);
        setSearchQuery('');
        setShowDropdown(false);
      }
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Select Stocks
      </Typography>
      <Box ref={containerRef} position="relative" sx={{ mt: 0.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search for stocks (e.g., AAPL, MSFT) or type symbol and press Enter"
          variant="outlined"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchQuery.trim().length > 0 || searchResults.length > 0) {
              setShowDropdown(true);
            }
          }}
          InputProps={{
            endAdornment: loading ? (
              <CircularProgress color="inherit" size={20} />
            ) : null,
          }}
        />
        {showDropdown && (searchResults.length > 0 || loading) && (
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              maxHeight: 300,
              overflow: 'auto',
              mt: 0.5,
              boxShadow: 3,
            }}
          >
            {loading ? (
              <Box p={2} display="flex" justifyContent="center">
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List dense>
                {searchResults.map((stock) => (
                  <ListItem key={stock.symbol} disablePadding>
                    <ListItemButton
                      onClick={() => handleSelectStock(stock)}
                      disabled={selectedStocks.includes(stock.symbol)}
                    >
                      <ListItemText
                        primary={stock.symbol}
                        secondary={stock.name}
                      />
                      {selectedStocks.includes(stock.symbol) && (
                        <Typography variant="caption" color="text.secondary">
                          (Selected)
                        </Typography>
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
                {searchResults.length === 0 && searchQuery.trim().length > 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No results found"
                      secondary="Try typing a symbol and pressing Enter"
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Paper>
        )}
      </Box>
      {selectedStocks.length > 0 && (
        <Box mt={1} display="flex" flexWrap="wrap" gap={0.5}>
          {selectedStocks.map((symbol) => (
            <Chip
              key={symbol}
              label={symbol}
              size="small"
              onDelete={
                symbol === 'SPY' ? undefined : () => handleRemoveStock(symbol)
              }
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
