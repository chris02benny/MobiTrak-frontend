# mobiTrak - Vehicle Fleet Management Platform Setup Guide

## Overview
mobiTrak is a comprehensive Vehicle Fleet Management and Tracking platform built with React.js, Tailwind CSS, Framer Motion, and Supabase.

## Tech Stack
- **Frontend**: React.js with Vite (JavaScript)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Supabase
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Routing**: React Router DOM

## Theme Colors
- **Primary Accent**: #fabb24
- **Dark Gray**: #1c1c1c
- **Background Black**: #0c0c0c

## Step-by-Step Setup Instructions

### 1. Create React + Vite Project

```bash
# Create new Vite project with React template
npm create vite@latest mobitrak-app -- --template react

# Navigate to project directory
cd mobitrak-app

# Install dependencies
npm install
```

### 2. Install Required Dependencies

```bash
# Install Tailwind CSS and PostCSS
npm install -D tailwindcss@^3.4.0 postcss autoprefixer @vitejs/plugin-react

# Install Framer Motion for animations
npm install framer-motion

# Install Supabase client
npm install @supabase/supabase-js

# Install React Router for navigation
npm install react-router-dom
```

### 3. Configure Tailwind CSS

Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#fabb24',
        darkGray: '#1c1c1c',
        bgBlack: '#0c0c0c',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

Create `postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Create `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
})
```

### 4. Update CSS File

Replace content in `src/style.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: #0c0c0c;
  color: white;
  overflow-x: hidden;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1c1c1c;
}

::-webkit-scrollbar-thumb {
  background: #fabb24;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #e6a61a;
}
```

### 5. Set Up Supabase Project

1. **Create Supabase Account**:
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up or log in

2. **Create New Project**:
   - Click "New Project"
   - Enter project name: "mobitrak"
   - Set database password (save securely)
   - Choose region
   - Click "Create new project"

3. **Get Project Credentials**:
   - Go to Settings → API
   - Copy "Project URL" and "anon public" key

4. **Create Environment File**:
   Create `.env` in project root:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 6. Configure Database Tables

In Supabase SQL Editor, run:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('business', 'driver', 'customer')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer'); -- default role
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 7. Configure Google OAuth (Optional)

1. **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing
   - Enable Google+ API
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Set authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`

2. **Supabase Configuration**:
   - Go to Authentication → Providers in Supabase
   - Enable Google provider
   - Add Google Client ID and Secret

### 8. Project Structure

```
src/
├── components/
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── dashboards/
│   │   ├── BusinessDashboard.jsx
│   │   ├── DriverDashboard.jsx
│   │   └── CustomerDashboard.jsx
│   └── LandingPage.jsx
├── utils/
│   └── supabase.js
├── hooks/
├── App.jsx
├── main.jsx
└── style.css
```

### 9. Run the Application

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features Implemented

### Landing Page
- Responsive design with dark theme
- Smooth scroll navigation
- Hero section with Framer Motion animations
- Features showcase
- About and Contact sections

### Authentication System
- Email/Password login and registration
- Google OAuth integration
- Role-based user registration (Business, Driver, Customer)
- Protected routes based on user roles

### Dashboard System
- Business Dashboard: Fleet management overview
- Driver Dashboard: Trip assignments and performance
- Customer Dashboard: Bookings and trip history

## User Roles

1. **Business**: Fleet owners and managers
   - Access to fleet overview
   - Trip statistics and analytics
   - Maintenance alerts and scheduling

2. **Driver**: Vehicle operators
   - Assigned trips and schedules
   - Route optimization
   - Performance tracking

3. **Customer**: Service users
   - Active bookings management
   - Trip history
   - Vehicle information access

## Next Steps

1. Implement detailed dashboard functionality
2. Add real-time vehicle tracking
3. Integrate mapping services
4. Add notification system
5. Implement trip booking system
6. Add reporting and analytics features

## Support

For issues or questions, contact: contact@mobitrak.com
