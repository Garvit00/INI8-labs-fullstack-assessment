# Patient Document Management Portal  
A full-stack web application that allows a patient (single user) to upload, manage, view, download, and delete medical documents (PDF files).

This project is built for the INI8 Labs Full Stack Developer assignment.

## Features

### Frontend (React)
- Upload PDF files (with validation)
- List all uploaded documents
- View PDFs in browser with preview mode
- Download documents
- Delete documents
- Toast notifications for success/error
- Auto-renamed duplicates (e.g., file.pdf, file(1).pdf)

### Backend (Express + Multer + SQLite)
- REST APIs for upload, list, view, download, and delete
- Stores files in `uploads/` folder locally
- Stores metadata (filename, size, created_at) in SQLite DB
- Auto-rename duplicate files
- Strong validation (PDF-only, file existence checks)

---

## Tech Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | React + Fetch API + React-Toastify |
| Backend   | Node.js + Express |
| File Upload | Multer |
| Database  | SQLite (File-based DB) |

---

## Folder Structure

project-root/
│
├── backend/
│ ├── server.js
│ ├── db.sqlite3
│ ├── uploads/
│ └── package.json
│
└── frontend/
├── src/
├── public/
└── package.json

# How to Run the Project Locally

- 1) **Clone the repository**

```bash
git clone <your-repo-url>
cd <your-repo-folder>
```

- 2) **start Backend:**
```bash
cd backend
npm install
node server.js
```
- 3) **start frontend(React)**(another terminal):
```bash
cd frontend
npm install
npm start
``` 