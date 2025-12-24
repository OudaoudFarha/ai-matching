import axios from 'axios';
import { useState } from 'react';

export default function UploadCV() {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);
    await axios.post('http://localhost:8080/api/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    alert('CV uploaded!');
  };

  return (
    <div>
      <h2>Upload CV</h2>
      <input type="file" onChange={e => setFile(e.target.files[0])}/>
      <button onClick={handleUpload}>Send</button>
    </div>
  );
}
