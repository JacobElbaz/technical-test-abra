import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Box, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import type { DateRange } from '../types/stock.types';

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (dateRange: DateRange) => void;
}

export default function DateRangePicker({
  dateRange,
  onChange,
}: DateRangePickerProps) {
  const handleStartDateChange = (date: Dayjs | null) => {
    if (date) {
      const newStart = date.format('YYYY-MM-DD');
      const endDate = dayjs(dateRange.end);
      const monthsDiff = endDate.diff(date, 'month', true);

      if (monthsDiff > 36) {
        // If range exceeds 36 months, adjust end date
        const maxEnd = date.add(36, 'month');
        onChange({
          start: newStart,
          end: maxEnd.format('YYYY-MM-DD'),
        });
      } else {
        onChange({
          ...dateRange,
          start: newStart,
        });
      }
    }
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    if (date) {
      const newEnd = date.format('YYYY-MM-DD');
      const startDate = dayjs(dateRange.start);
      const monthsDiff = date.diff(startDate, 'month', true);

      if (monthsDiff > 36) {
        // If range exceeds 36 months, adjust start date
        const minStart = date.subtract(36, 'month');
        onChange({
          start: minStart.format('YYYY-MM-DD'),
          end: newEnd,
        });
      } else if (date.isBefore(startDate)) {
        // End date cannot be before start date
        onChange({
          ...dateRange,
          end: dateRange.start,
        });
      } else {
        onChange({
          ...dateRange,
          end: newEnd,
        });
      }
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Date Range
      </Typography>
      <Box display="flex" gap={1.5} mt={0.5}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Start Date"
            value={dayjs(dateRange.start)}
            onChange={handleStartDateChange}
            maxDate={dayjs(dateRange.end)}
            slotProps={{
              textField: {
                variant: 'outlined',
                fullWidth: true,
                size: 'small',
              },
            }}
          />
          <DatePicker
            label="End Date"
            value={dayjs(dateRange.end)}
            onChange={handleEndDateChange}
            minDate={dayjs(dateRange.start)}
            maxDate={dayjs()}
            slotProps={{
              textField: {
                variant: 'outlined',
                fullWidth: true,
                size: 'small',
              },
            }}
          />
        </LocalizationProvider>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        Maximum range: 36 months
      </Typography>
    </Box>
  );
}
