# SpendSmart — Frontend

> A clean, responsive expense tracking web app with interactive charts and category-based filtering.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap)](https://getbootstrap.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chartdotjs&logoColor=white)](https://chartjs.org)

---

## Live Demo

**App URL:** https://spendsmart-frontend-5q27.onrender.com/login.html

> **Note:** Backend is on Render free tier and may take 30–60 seconds to respond on first load.

### Demo Credentials
You can register a new account directly on the app — registration is open.

---

## Screenshots


---

## Features

- **Secure Login & Registration** — JWT-based authentication, passwords never stored in plain text
- **Add Expenses** — Amount, category, date, and description
- **Edit & Delete** — Manage any expense directly from the dashboard table
- **Category Filter** — Filter expenses by category (Food, Transport, Bills, Health, etc.)
- **Date Range Filter** — View expenses between any two dates
- **Monthly Summary Cards** — Total spent this month, highest category, number of transactions
- **Interactive Bar Chart** — Visual breakdown of spending by category using Chart.js
- **Responsive Design** — Works on desktop and mobile browsers

---

## Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| Bootstrap 5.3 | Responsive layout and UI components |
| Vanilla JavaScript (ES6+) | App logic, API calls, DOM manipulation |
| Chart.js | Bar chart for category spending |
| Fetch API | Communication with FastAPI backend |
| JWT (localStorage) | Maintaining user session |

---

## Project Structure

```
spendsmart-frontend/
├── login.html         # Login page
├── register.html      # Registration page
├── dashboard.html     # Main app — expenses table, chart, filters
├── style.css          # Custom styles
└── app.js             # API calls and dashboard logic
```

---

## Pages

### Login Page (`login.html`)
- Username and password fields
- On success: stores JWT token, redirects to dashboard
- Link to registration page

### Register Page (`register.html`)
- Email, username, name, phone number, password fields
- Password confirmation validation
- On success: redirects to login

### Dashboard (`dashboard.html`)
- Summary cards at the top (total, highest category, count)
- Bar chart — spending by category this month
- Full expenses table with Edit and Delete buttons
- Add Expense button with form
- Filter bar for category and date range

---

## How It Works

1. User registers or logs in
2. JWT token is stored in `localStorage`
3. All API requests include the token in the `Authorization: Bearer` header
4. Expenses are fetched from the FastAPI backend and rendered in the table
5. Chart updates dynamically based on the monthly summary endpoint

---

## Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/kranandv/spendsmart-frontend.git
cd spendsmart-frontend

# 2. Update the API base URL in app.js
# Change: const API_URL = "https://spendsmart-backend.onrender.com"
# To:     const API_URL = "http://localhost:8000"

# 3. Open login.html in your browser
# (or use VS Code Live Server extension for best experience)
```

Make sure the backend is running locally before testing. See the backend repo for setup instructions.

---

## Backend Repository

The REST API for this project is available at:
https://github.com/kranandv/spendsmart-backend

---

## Author

**Anand** — IT Professional | Python & FastAPI Developer
- GitHub: [@kranandv](https://github.com/kranandv)
