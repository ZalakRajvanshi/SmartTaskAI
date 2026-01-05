🚀 SmartTaskAI – AI-Powered Task & Productivity Manager

SmartTaskAI is a full-stack AI-powered productivity application designed to help users manage tasks, habits, and journals more intelligently.
It integrates a modern React frontend, a secure Node.js backend, and optional local AI model support to deliver smart task assistance and productivity insights.

Built with scalability, security, and real-world deployment in mind.

🌟 Key Features

📝 Task creation, updates, and management

🔁 Habit tracking system

📔 Personal journaling

🤖 AI assistant for intelligent task suggestions

🔐 Secure authentication using JWT

🌙 Light & Dark mode support

⚡ Fast and responsive UI

🔒 Environment-based configuration (no secrets in code)

🧠 Optional local AI model training support

🧱 Technology Stack
Frontend

React (Vite)

Tailwind CSS

Context API

Axios

Backend

Node.js

Express.js

JWT Authentication

RESTful APIs

AI & Machine Learning

Python

PyTorch

Hugging Face Transformers

Custom dataset support

📂 Project Structure
SmartTaskAI/
│
├── backend/
│   ├── index.js            # Express server
│   ├── db.js               # Database connection
│   ├── routes/             # API routes
│   ├── models/             # DB models & ML scripts
│   └── middleware/         # Auth & security middleware
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # App pages
│   │   ├── context/        # Global state management
│   │   └── utils/          # API utilities
│   └── public/
│
└── README.md

🔐 Security Practices

All sensitive values are stored in environment variables

.env files are excluded from version control

JWT-based authentication

No AI model weights or secrets committed to GitHub

CORS and API access controls configured for production

⚙️ Environment Variables
Backend (backend/.env)
PORT=5000
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_api_key
DATABASE_URL=your_database_url

Frontend (frontend/.env)
VITE_API_URL=http://localhost:5000

▶️ Run Locally
1️⃣ Backend
cd backend
npm install
npm start

2️⃣ Frontend
cd frontend
npm install
npm run dev

🚀 Deployment

SmartTaskAI is deployment-ready and can be hosted on:

AWS (EC2, Amplify, Elastic Beanstalk)

Render

Vercel / Netlify (frontend)

Docker-based environments

AI models are intentionally excluded from GitHub and should be loaded dynamically or from cloud storage in production.

📈 Use Cases

Personal productivity management

Habit tracking applications

AI-assisted planning tools

Portfolio / learning project for full-stack & AI development

🧑‍💻 Author

Zalak
Full-Stack & AI Developer

📄 License

This project is licensed under the MIT License.
