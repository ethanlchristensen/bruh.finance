# bruh.finance

A modern personal finance tracking application.

<img src="README/app.png">

## 🛠 Tech Stack

### Backend
- **Framework:** [Django 5](https://www.djangoproject.com/)
- **API:** [Django Ninja](https://django-ninja.rest-framework.com/) (FastAPI-like schemas)
- **Language:** Python 3.13
- **Database:** SQLite
- **Authentication:** JWT (via Django Ninja JWT)
- **Server:** Daphne (ASGI)
- **Package Manager:** Poetry

### Frontend
- **Library:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Routing:** [TanStack Router](https://tanstack.com/router)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query)
- **UI Components:** Radix UI primitives

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- *Optional (for local dev):* Python 3.13+, Node.js 20+, Poetry

### Configuration Setup

Before running the application, you need to create the necessary configuration files.

1. **Root Environment (Docker):**
   Create a `.env.container` file in the root directory:
   ```bash
   cp .env-sample .env.container
   ```

2. **Backend Configuration:**
   Create a `config.json` file in the `backend/` directory:
   ```bash
   cp backend/sample.config.json backend/config.json
   ```

3. **Frontend Environment:**
   Create a `.env` file in the `frontend/` directory:
   ```bash
   cp frontend/.env-sample frontend/.env
   ```

### Using Docker Compose (Recommended)

The easiest way to get up and running is with Docker Compose.

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd bruh-finance
   ```

2. **Start the services:**
   ```bash
   docker-compose up --build
   ```

    This will spin up:
   - **Backend API:** Accessible at `http://localhost:8002`
   - **API Documentation:** Accessible at `http://localhost:8002/api/docs`
   - **Frontend App:** Accessible at `http://localhost:5177`
   - **Database:** SQLite volume (persisted)

   *Note: The first run might take a moment as it builds the images and applies database migrations.*

### Manual Local Development

If you prefer to run services individually without Docker:

#### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install Python dependencies using Poetry:
   ```bash
   poetry install
   ```

3. Apply database migrations:
   ```bash
   poetry run python manage.py migrate
   ```

4. Create an admin user:
   ```bash
   poetry run python manage.py createsuperuser
   ```

5. Start the server:
   ```bash
   # Using Makefile
   make run
   
   # OR directly via Poetry
   poetry run daphne -b 0.0.0.0 -p 8000 config.asgi:application
   ```

#### Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will typically run on `http://localhost:5173` (or the port shown in your terminal).

## 📂 Project Structure

```
.
├── backend/               # Django API
│   ├── api/               # Main application logic
│   │   └── features/      # Domain-specific modules (finance, users)
│   ├── config/            # Django project settings
│   └── manage.py
├── frontend/              # React Application
│   ├── src/
│   │   ├── features/      # Frontend features matching backend domains
│   │   ├── components/    # Shared UI components
│   │   └── routeTree.ts   # TanStack Router configuration
└── docker-compose.yaml    # Container orchestration
```

## 📊 CSV Import Guide

You can import recurring bills via a CSV file. The file **must** have a header row and follow this specific column order:

| Column | Description | Example |
| :--- | :--- | :--- |
| **Description** | Name of the bill | `Rent`, `Netflix` |
| **Due Date** | Date the bill is due (MM/DD/YYYY) | `01/26/2026`, `01/13/2026` |
| **Monthly Cost** | Amount to pay | `1200.00`, `15.99` |
| **Remaining** | *(Optional)* Total remaining balance on loan/debt | `5000.00` |

**Example CSV Content:**
```csv
Description,Due Date,Monthly Cost,Remaining
Rent,01/01/2026,1200.00,
Car Loan,01/15/2026,350.00,12000.00
Spotify,01/20/2026,10.99,
```

## 🔐 Environment Variables

The application uses environment variables for configuration.
- **Backend:** See `.env-sample` in the backend directory (or `docker-compose.yaml` environment section).
- **Frontend:** API URLs can be configured via `VITE_APP_BACKEND_API_URL`.

## 📄 License

MIT