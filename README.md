# 🚀 SmartTaskAI
### AI-Powered Task & Productivity Management Application

SmartTaskAI is a full-stack, AI-powered productivity application designed to help users manage tasks, habits, and journals more intelligently.  
It combines a modern React frontend, a secure Node.js backend, and optional local AI model training support.

This project is built with scalability, security, and real-world deployment in mind.

---

## ✨ Features

- 📝 Task creation, update, and management  
- 🔁 Habit tracking  
- 📔 Personal journaling  
- 🤖 AI assistant for smart task suggestions  
- 🔐 Secure authentication using JWT  
- 🌙 Light & Dark mode support  
- ⚡ Fast and responsive UI  
- 🔒 Environment-based configuration (no secrets in code)  

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Context API
- Axios

### Backend
- Node.js
- Express.js
- RESTful APIs
- JWT Authentication

### AI / Machine Learning
- Python
- PyTorch
- Hugging Face Transformers
- Custom dataset support

---

## 📂 Project Structure

```text
SmartTaskAI/
├── backend/
│   ├── index.js            # Express server
│   ├── db.js               # Database connection
│   ├── routes/             # API routes
│   ├── models/             # Database models & ML scripts
│   └── middleware/         # Auth & security middleware
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── context/        # Global state management
│   │   └── utils/          # API utilities
│   └── public/
│
└── README.md
```
## 🔐 Security Practices

- All sensitive data is stored using **environment variables**
- `.env` files are excluded from version control
- JWT-based authentication
- No secrets or API keys committed to GitHub
- AI model weights are intentionally excluded from the repository



## ⚙️ Environment Variables

### Backend (`backend/.env`)

PORT=5000
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_api_key
DATABASE_URL=your_database_url


### Frontend (`frontend/.env`)

VITE_API_URL=http://localhost:5000


## ▶️ Running the Project Locally

### Backend

cd backend
npm install
npm start

### Frontend
cd frontend
npm install
npm run dev


## 🚀 Deployment

SmartTaskAI is deployment-ready and can be hosted on:

- AWS (EC2, Amplify, Elastic Beanstalk)
- Render
- Vercel or Netlify (Frontend)
- Docker-based environments

AI models should be loaded dynamically or from cloud storage in production.


## 📈 Use Cases

- Personal productivity management
- AI-assisted task planning
- Habit tracking applications
- Full-stack & AI portfolio project


## 👤 Author

**Zalak Rajvanshi **  
AI & Full-Stack Developer


## 📄 License

This project is licensed under the **MIT License**.



