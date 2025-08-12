# mobiTrak - Vehicle Fleet Management Platform

A comprehensive, dark-themed responsive web application for vehicle fleet management and tracking.

## 🚀 Features

### Landing Page
- **Responsive Design**: Fully responsive across desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion powered animations and transitions
- **Dark Theme**: Professional dark theme with accent colors
- **Smooth Scroll Navigation**: Seamless navigation between sections

### Authentication System
- **Email/Password Authentication**: Secure login and registration
- **Google OAuth Integration**: One-click Google sign-in
- **Role-Based Registration**: Three user types (Business, Driver, Customer)
- **Protected Routes**: Role-based access control

### Dashboard System
- **Business Dashboard**: Fleet overview, trip analytics, maintenance alerts
- **Driver Dashboard**: Trip assignments, schedule management, performance tracking
- **Customer Dashboard**: Booking management, trip history, loyalty status

## 🛠 Tech Stack

- **Frontend**: React.js with Vite (JavaScript)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Supabase
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Routing**: React Router DOM

## 🎨 Design System

### Theme Colors
- **Primary Accent**: `#fabb24` (Golden yellow)
- **Dark Gray**: `#1c1c1c` (Component backgrounds)
- **Background Black**: `#0c0c0c` (Main background)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

## 📁 Project Structure

```
src/
├── components/
│   ├── DashboardLayout.jsx      # Reusable dashboard layout
│   ├── DashboardCard.jsx        # Dashboard card component
│   └── ProtectedRoute.jsx       # Route protection component
├── contexts/
│   └── AuthContext.jsx          # Authentication context
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx        # Login page
│   │   └── RegisterPage.jsx     # Registration page
│   ├── dashboards/
│   │   ├── BusinessDashboard.jsx # Business dashboard
│   │   ├── DriverDashboard.jsx   # Driver dashboard
│   │   └── CustomerDashboard.jsx # Customer dashboard
│   └── LandingPage.jsx          # Landing page
├── utils/
│   ├── supabase.js              # Supabase configuration
│   └── navigation.js            # Navigation utilities
├── App.jsx                      # Main app component
├── main.jsx                     # App entry point
└── style.css                    # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mobitrak-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   Run the SQL commands from `SETUP_GUIDE.md` in your Supabase SQL editor.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 User Roles

### Business Owner/Manager
- Fleet management overview
- Trip statistics and analytics
- Maintenance scheduling and alerts
- Driver performance monitoring
- Revenue tracking

### Driver
- Trip assignments and schedules
- Real-time trip status
- Performance metrics
- Earnings tracking
- Vehicle information

### Customer
- Ride booking interface
- Trip history and receipts
- Real-time trip tracking
- Loyalty program status
- Saved locations and preferences

## 🌟 Key Components

### DashboardLayout
Reusable layout component with:
- Collapsible sidebar navigation
- Top navigation bar
- User profile section
- Responsive design

### DashboardCard
Flexible card component featuring:
- Customizable content
- Trend indicators
- Hover animations
- Click handlers

### AuthContext
Comprehensive authentication management:
- User session handling
- Role-based permissions
- Automatic redirects
- Error handling

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🎭 Animations

Framer Motion animations include:
- Page transitions
- Component hover effects
- Loading states
- Smooth scrolling
- Sidebar animations

## 🔒 Security Features

- Row Level Security (RLS) in Supabase
- Protected routes based on user roles
- Secure authentication flow
- Environment variable protection

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard

## 📚 Documentation

For detailed setup instructions, see `SETUP_GUIDE.md`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Email: contact@mobitrak.com
- Documentation: See `SETUP_GUIDE.md`

## 🔮 Future Enhancements

- Real-time GPS tracking
- Push notifications
- Advanced analytics dashboard
- Mobile app development
- Integration with mapping services
- Payment processing
- Multi-language support
