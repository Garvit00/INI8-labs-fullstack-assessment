# Patient Documents Portal — Design Document

## 1. Tech Stack Choices

**Q1. Frontend framework:** React  
**Why:** Widely used, component based, fast to scaffold (Create React App), good ecosystem, easy to build forms and stateful lists required by this assignment.

**Q2. Backend framework:** Express (Node.js)  
**Why:** Lightweight, minimal boilerplate for REST APIs, native JS compatibility with frontend, excellent middleware (e.g., multer for file uploads), easy to run locally.

**Q3. Database:** SQLite  
**Why:** Zero-config, file-based, ideal for local development and small scale applications. Stores metadata in a single file (e.g., `db.sqlite3`) and requires no separate DB server fits assignment constraints.

**Q4. Supporting 1,000 users, changes to consider:**  
- Add authentication + per user isolation (user_id in documents table).  
- Move file storage from local filesystem to cloud object storage (S3, GCP Storage) for scalability and durability.  
- Use a managed relational DB (Postgres) or a horizontally scalable DB.  
- Add caching (Redis) and a CDN for downloading files.  
- Add background workers for heavy tasks and virus scanning on uploads.  
- Add rate limiting, request throttling, and monitoring (Prometheus/Grafana).

---

## 2. Architecture Overview

Flow (simple):
[React Frontend] <--REST--> [Express Backend] <---> [SQLite DB file]
|
+--> Local filesystem uploads/ (stores files)

- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:5000`
- Frontend uploads files with a `multipart/form-data` POST to `/documents/upload`
- Backend saves file to `uploads/`, writes metadata to `documents` table in SQLite, and returns metadata to frontend.

---

## 3. API Specification

**Common metadata fields:** `id`, `filename`, `filepath`, `filesize`, `created_at`

### 1) Upload a PDF
- **URL:** `POST /documents/upload`
- **Headers:** `Content-Type: multipart/form-data`
- **Body:** `file` (form field): PDF only
- **Success Response (201):**

### 2) List all documents

- **URL:** `GET /documents`
- **Response (200):**
```json
[
  {
    "id": 1,
    "filename": "report.pdf",
    "filepath": "uploads/2025-12-09_1234_report.pdf",
    "filesize": 124512,
    "created_at": "2025-12-09T10:30:45.000Z"
  },
]
```
### 3) Download a file

- **URL:** `GET /documents/:id`

- **Description:** `Returns file as attachment.`

- **Success:** `200 with Content-Disposition: attachment; filename="report.pdf" and file stream.`

- **Errors:** `404 if not found.`

### 4) Delete a file

- **URL:** `DELETE /documents/:id`

### 5) View a file

- **URL:** `GET /documents/view/:id`

### Data Flow Description

- **Upload process (step-by-step):**

- Frontend sends POST /documents/upload with multipart/form-data with file field.

- Backend middleware (Multer) receives the file, validates MIME type and extension (PDF only).

- Backend stores file in uploads/

- Backend inserts a record into documents table with fields: filename, filepath, filesize, created_at.

- Backend responds with the saved metadata.

- Frontend displays success and refreshes the list.

- **Download process:**

- Frontend requests GET /documents/:id.

- Backend queries DB for metadata. If exists, it streams the file from disk and sets Content-Disposition to attachment filename="<original filename>".

- Browser prompts to download.

- **Deletion process:**

- Frontend sends DELETE /documents/:id.

- Backend fetches metadata, removes file from filesystem, deletes DB record, returns success.

### Assumptions:

- Single user system (no auth).

- File type limited to PDF, validation checks both MIME and .pdf extension.

- File-size limit: default 10 MB (configurable).

- Files stored locally under uploads/. Database is a single SQLite file in project root: db.sqlite.

- No virus scanning is implemented.

- No encryption of files at rest.