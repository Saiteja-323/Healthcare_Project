
## 🚀 Full-Stack Healthcare Management Platform

A secure, dual-portal web application for managing doctor-patient interactions — including appointments, medical records, prescriptions, billing, and real-time notifications.

---

## 🛠️ Tech Stack

**Backend:** Django, Django REST Framework, PostgreSQL, JWT (SimpleJWT), Gunicorn
**Frontend:** React, Vite, React Router, Axios
**Cloud Services:** AWS SNS (for notifications)

---

## ⚠️ Note

Sensitive directories like `healthcare_aws_credentials/` and files such as `.pem` or `.csv` containing secrets/credentials are **excluded via `.gitignore`** and must **never be committed** to version control.

---

## ✅ Prerequisites

* Python 3.8+ and pip
* Node.js and npm
* A running PostgreSQL instance

---

## 🔧 Backend Setup (Django)

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**

   * **macOS/Linux:**

     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   * **Windows:**

     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```

3. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**

   * Create a `.env` file inside the `backend/` directory.
   * Copy the template below and replace values accordingly.

5. **Run database migrations:**

   ```bash
   python manage.py migrate
   ```

---

## 🌐 Frontend Setup (React)

1. **Navigate to the frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install frontend dependencies:**

   ```bash
   npm install
   ```

   This will install all required packages listed in `package.json` (including React, Axios, etc.).

---

## 🔐 Environment Variables (`backend/.env`)

```env
# PostgreSQL Configuration
POSTGRES_DB=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Django Configuration
DJANGO_SECRET_KEY=your-strong-random-django-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# JWT Configuration
JWT_SIGNING_KEY=your-strong-random-jwt-signing-key

# AWS SNS Configuration (Optional)
# AWS_REGION=ap-south-1
# SNS_TOPIC_ARN=arn:aws:sns:ap-south-1:xxxxxxxxxxxx:YourTopicName
```

> **Note:** Do not commit `.env` or any credential-related files to version control.

---
