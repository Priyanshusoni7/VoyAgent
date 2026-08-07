# 🚀 VoyAgent

> **Your AI-Powered Travel Concierge**

VoyAgent is a full-stack AI-powered travel planning platform that helps users create personalized travel itineraries using AI. Users simply describe their travel plans in natural language, and VoyAgent generates a complete itinerary including budget estimation, day-wise plans, packing suggestions, and travel tips.

The project is designed with a scalable architecture using **Next.js**, a **Spring Boot** backend, and a dedicated **FastAPI AI service** powered by **LangGraph** and **LangChain**.

---

## ✨ Features

- 🔐 Secure JWT Authentication
- 👤 User Dashboard
- ✍️ Natural Language Trip Planning
- 🤖 AI-Powered Itinerary Generation
- 📅 Day-wise Travel Plan
- 💰 Budget Estimation
- 🎒 Packing Recommendations
- 💡 Travel Tips
- 🗂 Save & View Trip History

---

## 🏗️ System Architecture

```text
                 Next.js Frontend
                        │
                        ▼
              Spring Boot Backend
                        │
            REST API Communication
                        │
                        ▼
             FastAPI AI Microservice
                        │
          LangGraph + LangChain
        (intent → planner → 3 parallel
         specialists → critic → composer)
                        │
                        ▼
                 Gemini API
```

---

## 🛠️ Tech Stack

### Frontend

- Next.js
- React
- Tailwind CSS

### Backend

- Java 17
- Spring Boot 3 (Spring Web, Spring Data MongoDB)
- Maven (via the Maven Wrapper)
- MongoDB Atlas
- JWT Authentication (HTTP-only cookie)

### AI Service

- Python
- FastAPI
- LangGraph
- LangChain
- Google Gemini API

## 📂 Project Structure

```text
voyagent/
│
├── frontend/
│
├── backend/            # Spring Boot API
│   ├── mvnw / mvnw.cmd
│   ├── pom.xml
│   └── src/main/java/com/voyagent/backend/
│       ├── config/     # app properties, CORS, Jackson, password encoder
│       ├── controller/ # REST endpoints
│       ├── service/    # business logic + AI service client
│       ├── repository/ # Spring Data MongoDB repositories
│       ├── model/      # User, Trip documents
│       ├── dto/        # request/response payloads
│       ├── security/   # JWT + auth interceptor
│       └── exception/  # API errors
│
├── ai-service/
│
├── .gitignore
└── README.md
```


---

## ▶️ Running Locally

Start all three services in separate terminals.

### 1. AI service (FastAPI)

```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env      # fill in GOOGLE_API_KEY / SERPAPI_KEY
uvicorn app:app --reload --port 8000
```

### 2. Backend (Spring Boot)

Requires **JDK 17**. Maven does **not** need to be installed - the Maven Wrapper
downloads it on first use.

```bash
cd backend
cp .env.example .env      # fill in MONGO_DB_URI and JWT_SECRET
./mvnw clean install
./mvnw spring-boot:run
```

On Windows `cmd`/PowerShell, use `mvnw.cmd` instead of `./mvnw`.

The API listens on `http://localhost:5000`, the same address the frontend
already points at.

### 3. Frontend (Next.js)

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

---

## ⚙️ Configuration

### Backend Configuration

`backend/src/main/resources/application.properties` reads everything from
environment variables, and also imports `backend/.env` when that file exists
(handy for local development). No secrets are committed.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGO_DB_URI` | yes | - | MongoDB connection string |
| `JWT_SECRET` | yes | - | HS256 signing key, **at least 32 characters** |
| `PORT` | no | `5000` | HTTP port |
| `NODE_ENV` | no | `development` | `production` switches auth cookies to `Secure` + `SameSite=None` |
| `JWT_EXPIRATION` | no | `7d` | Token/cookie lifetime |
| `AI_SERVICE_URL` | no | `http://localhost:8000` | FastAPI AI service base URL |
| `FRONTEND_URL` / `CLIENT_URL` / `CORS_ORIGIN` | no | - | Extra allowed CORS origins (comma-separated); `localhost:3000` is always allowed |

---

## 🔌 API Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | - | Service banner |
| `GET` | `/health` | - | Health check |
| `POST` | `/api/auth/signup` | - | Register, sets the `token` cookie |
| `POST` | `/api/auth/login` | - | Log in, sets the `token` cookie |
| `POST` | `/api/auth/logout` | - | Clears the `token` cookie |
| `GET` | `/api/auth/me` | cookie | Current user |
| `POST` | `/api/trips/plan` | cookie | Plan / continue a trip thread via the AI service |
| `GET` | `/api/trips` | cookie | List the user's trips |
| `GET` | `/api/trips/{id}` | cookie | Fetch one trip |
| `DELETE` | `/api/trips/{id}` | cookie | Delete one trip |

---

## 🧪 Tests

`backend/src/test/.../ApiIntegrationTest.java` covers every endpoint above
against a real `mongod` (downloaded on first run by flapdoodle) with the AI
service stubbed.

```bash
cd backend
./mvnw test
```

If the machine cannot download the `mongod` binary, skip them with
`./mvnw clean install -DskipTests`.

---

Contributions, suggestions, and feedback are always welcome.

Feel free to fork the repository, open an issue, or submit a pull request.

---
