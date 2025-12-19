# Pulse Fitness

<div align="center">
  <img src="client/public/images/PulseFitness.png" alt="Pulse Fitness Logo" width="120" />
  <h1>Pulse Fitness</h1>
  <p><strong>Your Personal AI Fitness Companion</strong></p>
  <p>Values • Community • Health</p>
</div>

---

**PulseFitness** is a comprehensive health and fitness application designed for families. It combines nutrition tracking, workout management, and body measurement monitoring with the power of AI to provide personalized guidance.

## 🚀 Features

*   **🍎 Advanced Nutrition Tracking**: Log meals, scan barcodes (future), and track macros with ease.
*   **🤖 Pulse AI Coach**: Get real-time nutritional advice and meal analysis from your AI assistant.
*   **📊 Progress Monitoring**: Track weight, body measurements, and visualize your journey with interactive charts.
*   **🏋️ Workout Plans**: Manage exercise routines (coming soon).
*   **👨‍👩‍👧‍👦 Family Access**: Share access with family members to support each other's goals.
*   **🔒 Secure & Private**: Your health data is yours.

## 🛠️ Technology Stack

*   **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI
*   **Backend**: Node.js, Express
*   **Database**: PostgreSQL
*   **AI Integration**: OpenAI / Perplexity (Configurable)

## ⚡ Quick Start (Local Development)

### Prerequisites

*   **Node.js** (v18+)
*   **PostgreSQL** (v14+)
*   **npm**

### 1. Database Setup

Create a local PostgreSQL database named `pulse_db`:

```bash
createdb pulse_db
```

### 2. Server Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory (see `.env.example` if available) or use the defaults:
*(Note: The server will automatically use defaults if `.env` is missing, but creating one is recommended)*

Start the server:

```bash
npm start
```

*The server runs on [http://localhost:3010](http://localhost:3010).*

### 3. Client Setup

Open a new terminal, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

Start the frontend development server:

```bash
npm run dev
```

*Access the application at [http://localhost:8080](http://localhost:8080).*

## 🤝 Contributing

This project is currently for internal development.

## 📄 License

Proprietary. All rights reserved.
