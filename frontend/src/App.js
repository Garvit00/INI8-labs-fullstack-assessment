// frontend/src/App.js
import React, { useEffect, useState, useRef } from 'react';
import {ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./index.css"

const API_BASE = 'http://localhost:5000';

function App() {
  const [file, setFile] = useState(null);
  const [docs, setDocs] = useState([]);
  const fileInputRef = useRef(null);
  const fetchDocs = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      const data = await res.json();
      setDocs(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load documents");
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Select a PDF file first');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files allowed');
      return;
    }
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      toast.success('Upload successful');
      setFile(null);
      // Reset the file input field
      if (fileInputRef.current) {
      fileInputRef.current.value = null;
}
      // refresh list
      fetchDocs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDownload = (id) => {
    // open download in new tab (browser will prompt)
    if(!window.confirm("Do you want to download this document?")) return;
    window.open(`${API_BASE}/documents/${id}`, '_blank');
    toast.info("Downloading document...");
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are sure to delete this document?')) return;
    try {
      const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await res.json();
      toast.success("Document deleted");
      fetchDocs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 className='main-heading'>Patient Medical Documents Portal</h1>
      <ToastContainer position="top-right" autoClose={2000} />

      <form onSubmit={handleUpload} style={{ marginBottom: '1rem' }}>
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button type="submit" style={{ marginLeft: 10 }}>Upload Doc</button>
      </form>

      <h2 className='sub-heading' >Uploaded Documents</h2>
      {docs.length === 0 ? (
        <p>No documents yet.</p>
      ) : (
        <table border="2" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Filename</th>
              <th>Size (KB)</th>
              <th>Uploaded At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map(d => (
              <tr key={d.id}>
                <td>{d.filename}</td>
                <td>{Math.round((d.filesize || 0) / 1024)}</td>
                <td>{new Date(d.created_at).toLocaleString()}</td>
                <td>
                  <button className='download' onClick={() => handleDownload(d.id)}>Download</button>
                  <button className='delete'  onClick={() => handleDelete(d.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
