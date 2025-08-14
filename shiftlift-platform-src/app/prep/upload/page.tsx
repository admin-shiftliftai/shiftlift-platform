"use client";
import { useState } from 'react';

export default function UploadPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>('sales_15min');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus('Please select a file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/prep/upload?type=${type}`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setStatus('Upload successful');
      } else {
        const text = await res.text();
        setStatus(`Error: ${text}`);
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <h1>Upload Data CSV</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label>
          Select dataset:
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ marginLeft: '0.5rem' }}>
            <option value="sales_15min">sales_15min</option>
            <option value="menu_items">menu_items</option>
            <option value="recipes">recipes</option>
            <option value="waste_logs">waste_logs</option>
          </select>
        </label>
        <br />
        <br />
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <br />
        <button type="submit" style={{ marginTop: '1rem' }}>Upload</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}