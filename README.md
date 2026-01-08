# Stock Market Trends - Stock Analysis Application

Full-stack web application for visualizing and analyzing stock market trends with AI assistance.

## 📋 Description

This application allows you to:
- Visualize multiple stocks' performance on an interactive chart
- Search and select stocks
- Analyze stock data with an AI agent (Google Gemini)
- Compare performance of different stocks over a given period

## ✨ Features

- **Stock Data Visualization**: Interactive chart with Recharts
- **Stock Search**: Real-time search via Twelve Data API
- **Date Range Selection**: Custom date range picker
- **AI Agent**: Intelligent data analysis with predefined questions
- **Modern UI**: Responsive interface with Material-UI
- **Multi-Stock Comparison**: Simultaneous visualization of multiple stocks

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **External API**: Twelve Data (stock data)
- **AI**: Google Gemini API
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI)
- **Charts**: Recharts
- **Styling**: Emotion, Tailwind CSS
- **Markdown**: react-markdown (for AI responses)

## 🚀 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- API Keys:
  - [Twelve Data API Key](https://twelvedata.com/)
  - [Google Gemini API Key](https://ai.google.dev/)

### Backend Installation

```bash
cd backend
npm install
```

### Frontend Installation

```bash
cd frontend
npm install
```

## ⚙️ Configuration

### Backend

Create a `.env` file in the `backend/` directory:

```env
TWELVE_DATA_API_KEY=your_twelve_data_api_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

**Notes**:
- Get your free Twelve Data API key at [https://twelvedata.com/](https://twelvedata.com/)
- Get your Gemini API key at [https://ai.google.dev/](https://ai.google.dev/) (Google AI Studio)
- `GEMINI_MODEL` is optional (defaults to `gemini-2.5-flash`). You can also use `gemini-2.5-pro` for more advanced analysis

### Frontend

Create a `.env` file in the `frontend/` directory (optional):

```env
VITE_API_BASE_URL=http://localhost:3000
```

**Notes**:
- `VITE_API_BASE_URL` is optional (defaults to `http://localhost:3000`)
- In Vite, environment variables must be prefixed with `VITE_` to be accessible in the client code
- If you change the backend port, update this variable accordingly

## 🏃 Running the Application

### Start the Backend

```bash
cd backend

# Development mode (with hot-reload)
npm run start:dev

# Production mode
npm run start:prod
```

The backend will be available at `http://localhost:3000`

### Start the Frontend

```bash
cd frontend

# Development mode
npm run dev
```

The frontend will be available at `http://localhost:5173` (or another port if 5173 is occupied)

## 📁 Project Structure

```
technical-test-abra/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── ai/              # AI Module (Gemini)
│   │   │   │   ├── ai.controller.ts
│   │   │   │   ├── ai.service.ts
│   │   │   │   └── dto/
│   │   │   └── stocks/          # Stocks Module (Twelve Data)
│   │   │       ├── stocks.controller.ts
│   │   │       ├── stocks.service.ts
│   │   │       ├── dto/
│   │   │       └── interface/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIStockAgent.tsx      # AI agent component
│   │   │   ├── DateRangePicker.tsx   # Date picker
│   │   │   ├── StockChart.tsx        # Stock chart
│   │   │   └── StockSelector.tsx     # Stock selector/search
│   │   ├── services/
│   │   │   ├── ai.service.ts         # AI API service
│   │   │   ├── stock.service.ts      # Stock API service
│   │   │   └── stock-search.service.ts
│   │   ├── types/
│   │   │   └── stock.types.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Backend

#### Stocks

- `GET /stocks?symbols=SPY,AAPL&start=2024-01-01&end=2024-12-31`
  - Retrieves stock data for the specified symbols
  - Parameters:
    - `symbols`: Comma-separated list of symbols (required)
    - `start`: Start date (format: YYYY-MM-DD)
    - `end`: End date (format: YYYY-MM-DD)

- `GET /stocks/search?query=AAPL`
  - Searches for stocks by name or symbol
  - Parameters:
    - `query`: Search term

#### AI

- `POST /stocks/ai-query`
  - Analyzes stock data with AI
  - Body:
    ```json
    {
      "question": "Which stock do you recommend?",
      "symbols": ["SPY", "AAPL"],
      "dateRange": {
        "start": "2024-01-01",
        "end": "2024-12-31"
      }
    }
    ```

## 🧪 Testing

### Backend

```bash
cd backend

# Unit tests
npm run test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Code coverage
npm run test:cov
```

### Frontend

```bash
cd frontend
npm run lint
```

## 🎯 Usage

1. **Select Stocks**: Use the stock selector to search and add stocks to compare. SPY is always included by default.

2. **Choose Date Range**: Use the date picker to set the analysis period.

3. **Visualize Data**: The chart automatically updates with the selected data.

4. **Ask AI Questions**: Use predefined questions or create your own to analyze trends.

## 🔧 Available Scripts

### Backend

- `npm run build`: Compile the project
- `npm run start`: Start the application
- `npm run start:dev`: Start in development mode (watch)
- `npm run start:debug`: Start in debug mode
- `npm run start:prod`: Start in production mode
- `npm run lint`: Lint the code
- `npm run format`: Format code with Prettier

### Frontend

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Lint the code

## 📝 Development Notes

- The backend uses CORS to allow requests from the frontend
- Data validation is handled by `class-validator`
- AI responses are formatted in Markdown and rendered with `react-markdown`
- The chart uses Recharts with a custom theme

## 📄 License

This project is a technical test.

## 👤 Author

Developed as part of a technical test by Jacob Elbaz.
