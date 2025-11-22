# 📈 Stock Trading Learning Platform

> An interactive, gamified platform for mastering stock trading through hands-on learning, AI-powered coaching, and real-time market simulations.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple)](https://vitejs.dev/)

## 🌟 Overview

A comprehensive financial education platform that transforms complex stock trading concepts into engaging, interactive learning experiences. Built with modern web technologies and powered by AI, this platform combines educational content, real time market data, and gamification to help users become confident investors.

## ✨ Key Features

### 📚 Interactive Learning System
- **Story-Based Lessons**: Bite-sized, narrative-driven lessons that make complex concepts digestible
- **Quiz & Scenarios**: Interactive assessments and real-world trading scenarios
- **Practice Trading Mode**: Historical market simulations with actual stock data
- **Progress Tracking**: Comprehensive user progress monitoring with XP and levels

### 💹 Virtual Trading Simulator
- **Real-Time Market Data**: Live stock quotes from Finnhub and Yahoo Finance APIs
- **Paper Trading**: Risk-free trading environment with virtual portfolio management
- **Stock Search & Charts**: Advanced stock search with interactive price charts
- **Transaction History**: Complete trade logging and performance analytics

### 🤖 AI-Powered Financial Coach
- **Personalized Guidance**: Context-aware coaching based on user progress and portfolio
- **Natural Conversations**: Chat interface for financial advice and strategy discussions
- **Learning Recommendations**: AI-driven lesson and challenge suggestions

### 🎮 Gamification & Engagement
- **Achievement System**: Unlock badges and rewards for milestones
- **Mission System**: Time-limited objectives with XP rewards
- **Daily Streaks**: Activity tracking to build consistent learning habits
- **Leaderboards**: Competitive challenges with community rankings

### ⚡ Rapid Test Game
- **ML-Powered Predictions**: XGBoost model for stock price movement predictions
- **Real-Time Scoring**: Instant feedback on prediction accuracy
- **Streak Tracking**: Challenge yourself to maintain winning streaks

### 👥 Community Features
- **Challenges**: Join time-based trading and learning challenges
- **Rankings**: Compete with other learners on the leaderboard
- **Progress Comparison**: See how you stack up against the community

### 👤 User Profile & Stats
- **Comprehensive Dashboard**: View learning progress, trading history, and achievements
- **Profile Customization**: Personalize your profile with avatars and bio
- **Performance Analytics**: Detailed statistics on trading performance and learning journey

## 🏗️ Technology Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 5.4** - Build tool and dev server
- **React Router 6.30** - Client-side routing
- **TanStack Query** - Server state management
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **Radix UI** - Accessible component primitives
- **React Three Fiber** - 3D graphics with Three.js
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend (Supabase)
- **PostgreSQL** - Primary database
- **Supabase Auth** - User authentication
- **Row Level Security** - Data access policies
- **Edge Functions** - Serverless API endpoints
- **Realtime Subscriptions** - Live data updates

### External APIs & Services
- **Finnhub API** - Real-time stock market data
- **Yahoo Finance API** - Historical stock data and quotes
- **Lovable AI Gateway** - AI model access for coaching features

### Machine Learning
- **Python 3.13** - ML model runtime
- **XGBoost** - Stock prediction model
- **Flask** - ML model serving
- **scikit-learn** - Data preprocessing

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin dashboard components
│   │   ├── gl/             # 3D graphics components
│   │   ├── lessons/        # Learning module components
│   │   ├── profile/        # User profile components
│   │   ├── rapid-test/     # Rapid test game components
│   │   ├── simulator/      # Trading simulator components
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── utils/              # Utility functions
│   ├── integrations/       # Third-party integrations
│   │   └── supabase/       # Supabase client & types
│   └── index.css           # Global styles & design tokens
│
├── supabase/
│   ├── functions/          # Edge functions
│   │   ├── ai-coach-chat/           # AI coaching endpoint
│   │   ├── collect-market-data/     # Market data collection
│   │   ├── fetch-stock-data/        # Real-time stock quotes
│   │   ├── fetch-historical-data/   # Historical price data
│   │   ├── search-stocks/           # Stock symbol search
│   │   ├── rapid-test-prediction/   # ML predictions
│   │   └── finnhub-webhook/         # Webhook handler
│   ├── migrations/         # Database migrations
│   └── config.toml         # Supabase configuration
│
├── mint_ml_model/          # Python ML model
│   ├── app.py             # Flask server
│   ├── get_data.py        # Data fetching utilities
│   ├── news_server.py     # News data server
│   └── xgb_stock_model.json  # Trained XGBoost model
│
└── public/                 # Static assets
```

## 🗄️ Database Schema

### Core Tables

#### `profiles`
User profile information
- `id`, `username`, `avatar_url`, `bio`, `created_at`, `updated_at`

#### `user_stats`
User engagement and progress metrics
- `user_id`, `xp`, `level`, `streak_days`, `total_lessons_completed`, `total_missions_completed`, `last_activity_date`

#### `lessons`
Educational content
- `id`, `title`, `description`, `content`, `category`, `difficulty`, `xp_reward`, `quiz_questions`, `scenario_data`, `practice_stocks`, `practice_start_date`

#### `user_progress`
Lesson completion tracking
- `user_id`, `lesson_id`, `completed`, `score`, `completed_at`

#### `achievements`
Achievement definitions
- `id`, `title`, `description`, `icon`, `requirement_type`, `requirement_value`, `xp_reward`

#### `missions`
Time-limited objectives
- `id`, `title`, `description`, `mission_type`, `target_value`, `xp_reward`, `expires_at`

#### `challenges`
Community challenges
- `id`, `title`, `description`, `challenge_type`, `target_value`, `start_date`, `end_date`, `xp_reward`

#### `challenge_participants`
Challenge participation tracking
- `challenge_id`, `user_id`, `progress`, `rank`, `streak_count`, `completed`

### Trading Simulator Tables

#### `simulator_portfolios`
User virtual portfolios
- `user_id`, `cash`, `created_at`, `updated_at`

#### `simulator_holdings`
Stock positions
- `user_id`, `symbol`, `stock_name`, `quantity`, `purchase_price`, `current_price`, `purchase_date`

#### `simulator_trades`
Trade history
- `user_id`, `symbol`, `stock_name`, `trade_type`, `quantity`, `price`, `total`, `traded_at`

#### `practice_sessions`
Lesson practice trading sessions
- `user_id`, `lesson_id`, `practice_date`, `initial_cash`, `final_cash`, `total_value`, `gain_loss_amount`, `gain_loss_percent`, `completed`

#### `practice_trades`
Trades within practice sessions
- `session_id`, `symbol`, `stock_name`, `trade_type`, `quantity`, `price_at_trade`, `price_at_completion`, `gain_loss_amount`, `gain_loss_percent`

### Market Data Tables

#### `monitored_stocks`
Stocks tracked by the system
- `symbol`, `name`, `exchange`, `is_active`, `last_updated`

#### `stock_quotes_realtime`
Real-time stock quotes
- `symbol`, `name`, `price`, `change`, `change_percent`, `open`, `high`, `low`, `volume`, `market_cap`, `source`, `timestamp`

#### `stock_historical_data`
Historical price data
- `symbol`, `timestamp`, `open`, `high`, `low`, `close`, `volume`, `period`

#### `company_fundamentals`
Company information
- `symbol`, `name`, `description`, `sector`, `industry`, `market_cap`, `employees`, `website`, `logo_url`

### Other Tables

#### `rapid_test_scores`
Rapid test game scores
- `user_id`, `score`, `streak`, `created_at`

#### `data_collection_log`
API data collection logs
- `symbol`, `data_type`, `source`, `success`, `error_message`, `records_count`

#### `platform_stats`
Platform-wide statistics
- `stat_name`, `stat_value`, `updated_at`

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.13+ (for ML model)
- **Supabase Account** (or self-hosted Supabase instance)
- **Finnhub API Key** (free tier available at [finnhub.io](https://finnhub.io))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Python ML model** (optional, for rapid test predictions)
   ```bash
   cd mint_ml_model
   pip install flask pandas scikit-learn xgboost yfinance
   ```

4. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   # Supabase (get from Supabase project settings)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Configure Supabase Edge Function secrets**

   In your Supabase dashboard, add these secrets:
   ```
   FINNHUB_API_KEY=your_finnhub_api_key
   LOVABLE_API_KEY=your_lovable_ai_key (optional, for AI coach)
   FINNHUB_WEBHOOK_SECRET=your_webhook_secret (optional)
   ```

6. **Set up the database**

   - Run migrations in your Supabase project (migrations are in `supabase/migrations/`)
   - Or use the Supabase CLI:
     ```bash
     npx supabase db push
     ```

7. **Deploy Edge Functions**
   ```bash
   npx supabase functions deploy --project-ref your_project_ref
   ```

### Running the Application

**Development mode:**
```bash
npm run dev
```

**Run ML model server** (optional, in separate terminal):
```bash
cd mint_ml_model
python app.py
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## 🔐 Authentication

The platform uses Supabase Auth with support for:
- Email/Password authentication
- Magic link authentication
- OAuth providers (configurable in Supabase)

Row Level Security (RLS) policies ensure users can only access their own data.

## 🎯 Key Workflows

### Learning Flow
1. User signs up/logs in
2. Browses available lessons by category/difficulty
3. Completes lesson content (story, quiz, or scenario)
4. Practice mode: trades with historical data from lesson's specified date
5. Earns XP and unlocks achievements
6. Progresses through levels

### Trading Simulator Flow
1. User starts with $100,000 virtual cash
2. Searches for stocks using real-time data
3. Views stock details and price charts
4. Executes buy/sell trades
5. Monitors portfolio performance
6. Reviews transaction history

### Challenge Flow
1. User joins an active challenge
2. Tracks progress on leaderboard
3. Completes challenge objectives
4. Earns rewards and XP
5. Compares performance with peers

## 🔧 Configuration

### Design System
The app uses a comprehensive design system defined in:
- `src/index.css` - CSS custom properties (color tokens, fonts, animations)
- `tailwind.config.ts` - Tailwind configuration extending design tokens

All colors use HSL format for easy theming. Dark mode is enforced throughout.

### Edge Functions Configuration
Configure function settings in `supabase/config.toml`:
- JWT verification settings
- CORS headers
- Function-specific configurations

## 📊 Admin Features

Admin users can access `/admin` to:
- Create and edit lessons
- Build quizzes with the quiz builder
- Design trading scenarios
- Manage achievements and missions
- Add/remove challenges
- Monitor platform statistics

## 🧪 Testing & Development

**Linting:**
```bash
npm run lint
```

**Type checking:**
```bash
npx tsc --noEmit
```

## 📈 Market Data Collection

The platform collects real-time market data through:
1. **Scheduled collection**: Edge function runs periodically
2. **Finnhub webhooks**: Real-time updates for subscribed stocks
3. **Yahoo Finance fallback**: Secondary data source

Data is stored in `stock_quotes_realtime` and automatically cleaned after 30 days.

## 🤖 AI Coach Architecture

The AI coach uses:
- **Lovable AI Gateway**: OpenAI-compatible API
- **Context awareness**: User progress, portfolio, and lesson data
- **Conversation history**: Maintained in session
- **File upload support**: Can analyze uploaded documents

## 🔒 Security

- **Row Level Security**: All tables have RLS policies
- **User roles**: Admin and user roles with appropriate permissions
- **API key management**: Secrets stored securely in Supabase
- **Input validation**: Zod schemas for form validation
- **SQL injection prevention**: Parameterized queries

## 🚀 Deployment

### Frontend (Lovable Platform)
1. Click "Publish" in Lovable editor
2. Your app is live at `yourapp.lovable.app`
3. Configure custom domain in project settings (paid plans)

### Self-Hosting
1. Build the project: `npm run build`
2. Deploy `dist/` folder to any static hosting:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - AWS S3 + CloudFront

### Edge Functions
Edge functions deploy automatically via Supabase CLI or through Supabase dashboard.

### ML Model
Deploy the Python ML model to:
- Heroku
- Google Cloud Run
- AWS Lambda
- Railway
- Render

Update the rapid test edge function with your deployed ML model URL.

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This project is currently not open for external contributions.

## 📧 Support

For issues or questions, please contact the development team.

## 🙏 Acknowledgments

- **shadcn/ui** - Component library
- **Supabase** - Backend platform
- **Finnhub** - Market data provider
- **Yahoo Finance** - Historical data
- **Lovable** - Development platform

---

Built with ❤️ using [Lovable](https://lovable.dev)
