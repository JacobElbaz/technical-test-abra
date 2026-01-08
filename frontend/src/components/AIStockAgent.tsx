import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { aiService } from '../services/ai.service';
import type { DateRange } from '../types/stock.types';

interface AIStockAgentProps {
  selectedStocks: string[];
  dateRange: DateRange;
}

const PREDEFINED_QUESTIONS = [
  {
    id: 1,
    text: 'Based on the trends presented in the graph - what are the most recommended stock to invest to in 2025',
  },
  {
    id: 2,
    text: 'Based on the trends presented in the graph - please predict the rates of presented stocks by the end of 2026',
  },
];

export default function AIStockAgent({
  selectedStocks,
  dateRange,
}: AIStockAgentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const handleQuestionClick = async (question: string) => {
    if (selectedStocks.length === 0) {
      setError('Please select at least one stock before asking a question.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);
    setSelectedQuestion(question);

    try {
      const response = await aiService.askQuestion(
        question,
        selectedStocks,
        dateRange,
      );
      setAnswer(response);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to get AI response. Please try again.';
      setError(errorMessage);
      console.error('Error fetching AI response:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        AI Stock Agent
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ask AI-powered questions about your stock data
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Pre-defined Questions:
        </Typography>
        {PREDEFINED_QUESTIONS.map((question) => (
          <Box key={question.id} sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleQuestionClick(question.text)}
              disabled={loading || selectedStocks.length === 0}
              sx={{
                textAlign: 'left',
                justifyContent: 'flex-start',
                py: 1.5,
                px: 2,
                textTransform: 'none',
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Question #{question.id}:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {question.text}
                </Typography>
              </Box>
            </Button>
          </Box>
        ))}
      </Box>

      {loading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ py: 4 }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Analyzing stock data...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {answer && !loading && (
        <Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            AI Response:
          </Typography>
          {selectedQuestion && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, fontStyle: 'italic' }}
            >
              Question: {selectedQuestion}
            </Typography>
          )}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: 'grey.50',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <Typography variant="body1">{answer}</Typography>
          </Paper>
        </Box>
      )}
    </Paper>
  );
}
