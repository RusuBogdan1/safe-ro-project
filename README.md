# 🛡️ SAFE-RO - Disaster Management Platform

SAFE-RO is a national-scale software solution that integrates Earth observation data with geospatial analytics to support both the public and authorities in disaster management. The system combines satellite monitoring, data processing, and alert delivery into one accessible platform.

This repository contains the frontend application for the SAFE-RO platform, built with React, Vite, and Supabase.

## ✨ Features

- **User Authentication**: Secure login and registration for volunteers and authorities using Supabase Auth.
- **Interactive Hazard Map**: A map-based interface (`Leaflet`) to visualize disaster-related information and announcements.
- **Role-Based Dashboards**: Separate dashboard views for the public, registered volunteers, and administrators.
- **Announcement System**: Functionality for authorized users to create, view, and manage public safety announcements.
- **Volunteer Management**: Panels for volunteers to view specific announcements and manage their status.
- **Real-time Data**: Integration with Supabase for real-time database updates.

## 🚀 Tech Stack

- **Frontend**: [React](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database**: [Supabase](https://supabase.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)
- **Mapping**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## ⚙️ Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Supabase](https://supabase.com/) project for the backend and database.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd safe-ro-project
```

### 2. Install Dependencies

You can use `npm`, `yarn`, or `bun`.

```bash
npm install
```

or

```bash
bun install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of the project by copying the example file:

```bash
cp .env .env.example
```

You'll need to add your Supabase project URL and anon key to the `.env` file. You can find these in your Supabase project's API settings.

```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 4. Run the Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`.

## 📂 Project Structure

Here is a high-level overview of the `src` directory:

```
src/
├── assets/         # Static assets like images and logos
├── components/     # Reusable UI components
│   ├── auth/       # Authentication-related components
│   ├── dashboard/  # Components for the main dashboard
│   ├── layout/     # Layout components (Header, Sidebar)
│   └── ui/         # Core UI elements from shadcn/ui
├── hooks/          # Custom React hooks
├── integrations/   # Supabase client and type definitions
├── lib/            # Utility functions and API helpers
├── pages/          # Top-level page components for each route
└── types/          # Global TypeScript type definitions
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
You can find the repository at: https://github.com/RusuBogdan1/safe-ro-project.git

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
