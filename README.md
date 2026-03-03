# Intrusion Monitoring System

A robust Security Monitor and Admin Dashboard built with React, FastAPI, and MongoDB. This system features real-time bypass detection using character morphing analysis and NLP integration.

## 🚀 Key Features

- **Advanced Bypass Detection**: Automatically detects login attempts using character substitutions (e.g., `adm1n` instead of `admin`) using Levenshtein distance and custom substitution rules.
- **Dynamic Access Restrictions**: Implements a 10-minute block for detected bypass attempts, with a live countdown timer on the dashboard.
- **Admin Dashboard**:
  - **Live Monitoring**: Real-time polling for new registration and restriction data.
  - **System Statistics**: Visual tracking of login attempts and bypass rates.
  - **Registered Users Management**: Sidebar view of all registered accounts.
  - **Active Restrictions Tracker**: Live status and countdowns for blocked identifiers.
- **AI & NLP Integration**:
  - **spaCy NLP Demo**: Named Entity Recognition (NER) and tokenization processing.
  - **TensorFlow.js Demo**: Real-time object detection and classification capabilities.
- **Secure Authentication**: JWT-based authentication with role-based access control (Admin vs. User).
- **Modern UI**: Fully responsive design with Dark Mode support and premium aesthetics.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State/Auth**: React Context API
- **API Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: MongoDB (via Motor async driver)
- **NLP**: spaCy (`en_core_web_sm`)
- **Security**: JWT (Jose), Passlib (Bcrypt)

## 📦 Setup & Installation

### Prerequisites
- Node.js & npm
- Python 3.10+
- MongoDB instance (Local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/DharaniKumarJK/INTRUSION-MONITORING.git
cd INTRUSION-MONITORING
```

### 2. Backend Setup
```bash
cd project/api
pip install -r requirements.txt
# Create a .env file with MONGODB_URI and JWT_SECRET
python -m uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd project
npm install
npm run dev
```

## 🔐 Security Policy

Administrators are exempt from restrictions to ensure system controllability. Bypass detection specifically targets character-level morphing to prevent unauthorized probing of existing usernames.

## 📄 License

This project is licensed under the MIT License.
