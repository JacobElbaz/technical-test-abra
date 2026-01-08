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
import ReactMarkdown from 'react-markdown';
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
    <Paper elevation={2} sx={{ p: 2, mt: 0 }}>
      <Typography variant="subtitle1" gutterBottom>
        AI Stock Agent
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Ask AI-powered questions about your stock data
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Pre-defined Questions:
        </Typography>
        {PREDEFINED_QUESTIONS.map((question) => (
          <Box key={question.id} sx={{ mb: 1 }}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => handleQuestionClick(question.text)}
              disabled={loading || selectedStocks.length === 0}
              sx={{
                textAlign: 'left',
                justifyContent: 'flex-start',
                py: 1,
                px: 1.5,
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
          sx={{ py: 2 }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2" sx={{ ml: 1.5 }}>
            Analyzing stock data...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {answer && !loading && (
        <Box>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            AI Response:
          </Typography>
          {selectedQuestion && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.5, fontStyle: 'italic' }}
            >
              Question: {selectedQuestion}
            </Typography>
          )}
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              backgroundColor: 'grey.50',
              wordBreak: 'break-word',
              '& p': {
                margin: '0.5em 0',
                '&:first-of-type': {
                  marginTop: 0,
                },
                '&:last-of-type': {
                  marginBottom: 0,
                },
              },
              '& ul, & ol': {
                margin: '0.5em 0',
                paddingLeft: '1.5em',
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                margin: '0.75em 0 0.5em 0',
                fontWeight: 'bold',
                '&:first-of-type': {
                  marginTop: 0,
                },
              },
              '& code': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                padding: '0.2em 0.4em',
                borderRadius: '3px',
                fontFamily: 'monospace',
                fontSize: '0.9em',
              },
              '& pre': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                padding: '1em',
                borderRadius: '4px',
                overflow: 'auto',
                '& code': {
                  backgroundColor: 'transparent',
                  padding: 0,
                },
              },
              '& blockquote': {
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                paddingLeft: '1em',
                margin: '1em 0',
                fontStyle: 'italic',
                color: 'text.secondary',
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                margin: '1em 0',
                '& th, & td': {
                  border: '1px solid',
                  borderColor: 'divider',
                  padding: '0.5em',
                },
                '& th': {
                  backgroundColor: 'action.hover',
                  fontWeight: 'bold',
                },
              },
            }}
          >
            <ReactMarkdown>{answer}</ReactMarkdown>
          </Paper>
        </Box>
      )}
    </Paper>
  );
}
