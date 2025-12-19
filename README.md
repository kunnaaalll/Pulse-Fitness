# Pulse Fitness (Local Setup)

This version of Pulse Fitness is designed to run locally on your machine without Docker.

## Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher) running locally.
- **npm** (comes with Node.js)

## 1. Database Setup

1.  Make sure your local PostgreSQL server is running.
2.  Create a database named `sparkyfitness` (or whatever you set in `server/.env`).
    ```bash
    createdb sparkyfitness
    ```
    *(If using a GUI like pgAdmin, create a new DB named `sparkyfitness`)*.

3.  Ensure you have a Postgres user that matches the credentials in `server/.env` (Default: user `postgres`, password `password`).

## 2. Server Setup

Navigate to the `server` directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

*The server will run on [http://localhost:3010](http://localhost:3010).*
*On first run, it will automatically attempt to run database migrations.*

## 3. Client Setup

Open a new terminal and navigate to the `client` directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

*The application will be available at [http://localhost:8080](http://localhost:8080).*

## 4. Services (Optional)

### Garmin Integration
If you need Garmin integration, navigating to `services/garmin` and run the Python service (requires Python installed):

```bash
cd services/garmin
pip install -r requirements.txt
python main.py
```

## Troubleshooting

- **Database Connection Error**: Check `server/.env` and ensure your local Postgres credentials match.
- **Port Conflicts**: If ports 3010 or 8080 are taken, change them in `.env` and `vite.config.ts`.
