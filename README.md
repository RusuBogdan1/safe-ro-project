🛡️ safeRo
AI-Powered Environmental Risk & Disaster Response Platform

safeRo este o platformă inteligentă pentru monitorizarea mediului, evaluarea riscurilor și generarea automată de rapoarte AI.
Creată pentru fermieri, instituții, autorități și companii, safeRo oferă o analiză rapidă și accesibilă asupra impactului dezastrelor naturale și asupra terenurilor din România.

📖 Overview

safeRo oferă utilizatorilor acces instant la insight-uri generate cu inteligență artificială:

✔️ Analiză AI a riscurilor asupra terenurilor
✔️ Evaluare rapidă a dezastrelor naturale
✔️ Scoring de risc pentru agricultură și infrastructură
✔️ Generare automată de rapoarte PDF
✔️ Dashboard interactiv cu hărți și statistici

Platforma a fost concepută pentru a aduce transparență, viteză și claritate în evaluările de mediu.

🚀 Key Features
🧠 AI Environmental Insights

Analiză asistată de modele AI moderne (Groq + LLaMA):

Impact asupra culturilor agricole

Riscuri în ecosistemele naturale

Analiză climatică și meteorologică

Evaluări asupra zonelor locuite

🌪️ Natural Disaster Assessment

Evaluarea impactului dezastrelor:

Inundații

Incendii

Secetă

Alunecări de teren

📄 Automated PDF Reports

safeRo generează rapoarte profesioniste cu:

Evaluări AI structurate

Hărți și modele de risc

Analiză tehnică + recomandări

🗺️ Interactive Geographic Dashboard

Hărți intuitive pentru:

Marcarea zonelor analizate

Vizualizare impact

Reevaluarea zonelor istorice

🔒 Modern Authentication

Stack Auth

Token-based secure sessions

Ready for production deployments

🏗️ Tech Stack
Frontend

Next.js 16

TypeScript

Tailwind CSS

Leaflet Maps

shadcn/ui & Radix

Recharts

Backend

FastAPI

Python 3.11+

Neon PostgreSQL

Stack Auth (secure backend authentication)

AI Layer

Groq API

LLaMA 3.3 (70B)

Markdown → PDF Parser

📂 Project Structure
safeRo/
├── backend/          # FastAPI AI & PDF services
├── frontend/         # Next.js 16 web interface
└── README.md         # Project documentation

🔧 Installation & Setup
1️⃣ Clone repo
git clone https://github.com/<user>/safeRo.git
cd safeRo

🖥️ Backend Setup (FastAPI)
cd backend
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload


Setează variabile precum:

GROQ_API_KEY

DATABASE_URL

STACK_SECRET_SERVER_KEY

🌐 Frontend Setup (Next.js)
cd frontend
npm install
cp .env.example .env.local
npm run dev


Variabile necesare:

NEXT_PUBLIC_API_URL

NEXT_PUBLIC_STACK_PROJECT_ID

NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY

📊 Core Workflow

Utilizatorul selectează o zonă/teren

AI procesează riscurile și impactul

Platforma generează statistici + hărți

Este creat un raport PDF profesional

Dashboard-ul afișează scorurile de risc

🗄️ Simplified Database Model
users
areas
analyses
reports
risk_scores


Legături optimizate pentru evaluări rapide.

🧪 Example API Endpoints
🔍 POST /api/analyze
{
  "location": "46.783, 23.623",
  "type": "flood"
}

📄 GET /api/report/{id}

Returnează PDF generat automat.

🎨 UI Pages

/ — Landing Page safeRo

/dashboard — Hartă + scoruri

/analysis — Analiză nouă

/reports — Istoric rapoarte

/auth — Autentificare

🐛 Known Issues
Problemă	Soluție
Diacritice PDF	Normalizare Unicode → ASCII
Timeout AI	Folosire Groq pentru viteză mare
Layer hărți	Fallback OpenStreetMap
🚧 Roadmap

📡 Integrare sateliți (Sentinel)

🔥 Real-time disaster alerts

🇬🇧 Limbi multiple (RO/EN)

📱 safeRo Mobile App

📈 Analiză istorică multi-anuală

🤖 AI damage classification

🌍 API public pentru instituții

📄 License

MIT License — vezi fișierul LICENSE.

👥 Team

Dezvoltat la hackathoane & proiecte de cercetare.
Cu pasiune pentru tehnologie, AI și reziliență climatică.

📬 Contact

Pentru suport: deschide un Issue pe GitHub.