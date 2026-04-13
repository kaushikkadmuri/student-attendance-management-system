# Student Attendance Management System

A full-stack attendance platform with a Django REST backend and a React + Vite frontend.

## Overview

This project is a student attendance management system built around four roles: Admin, Analyst, Counsellor, and Student.

Admins handle the overall platform setup by managing operational users such as Analysts and Counsellors, and by maintaining Centres. Analysts manage batches and the structural data needed to organize students. Counsellors manage student records and oversee the students assigned to them. Students use their own dashboard to interact with the attendance system directly.

Attendance is marked by students through the student dashboard. A student performs check-in and check-out from the frontend, and the system verifies attendance using the configured flow, including face verification and location validation where required. After marking attendance, students can view their daily status, attendance history, monthly attendance, and time-related statistics, while staff roles manage the data and structure that support this attendance process.

## Tech Stack

- Backend: Django, Django REST Framework, Simple JWT, MySQL
- Frontend: React, Vite, React Router, Axios, Tailwind CSS
- Face tools: OpenCV, MediaPipe Tasks Vision

## Project Structure

```text
student-attendance-system/
|-- attendance-backend/
|   |-- apps/
|   |   |-- accounts/
|   |   |-- attendance/
|   |   |-- audit_logs/
|   |   |-- batches/
|   |   |-- centers/
|   |   `-- students/
|   |-- config/
|   |-- .env.example
|   `-- manage.py
|-- attendance-frontend/
|   |-- public/
|   |-- src/
|   `-- package.json
`-- requirements.txt
```

## Backend API Areas

- `api/auth/`
- `api/batches/`
- `api/centers/`
- `api/students/`
- `api/attendance/`
- `api/audit-logs/`

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/kaushikkadmuri/student-attendance-management-system.git
cd student-attendance-management-system
```

### 2. Create the backend virtual environment

```bash
python -m venv venv312
venv312\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure backend environment variables

Copy `attendance-backend/.env.example` to `attendance-backend/.env` and fill in your real values.

Required keys include:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`

### 4. Run the backend

```bash
cd attendance-backend
python manage.py migrate
python manage.py runserver
```

The backend runs at `http://127.0.0.1:8000/`.

### 5. Run the frontend

Open a second terminal:

```bash
cd attendance-frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173/`.

## Notes

- `attendance-backend/.env` is intentionally not committed.
- `venv312/`, `node_modules/`, and build outputs are ignored.
- The frontend ships MediaPipe model assets under `attendance-frontend/public/`.

## Future Improvements

- Add deployment instructions
- Add screenshots for each user role
- Add automated tests for API and UI flows
- Add a fuller root architecture diagram
