import { useState } from "react";
import axios from "axios";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [candidateId, setCandidateId] = useState("123");
  const [result, setResult] = useState<string>("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("candidateId", candidateId);
    const res = await axios.post("http://localhost:8080/api/resumes", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setResult(JSON.stringify(res.data));
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Upload CV</h2>
      <form onSubmit={submit}>
        <label>Candidate ID</label>
        <input value={candidateId} onChange={e => setCandidateId(e.target.value)} />
        <br/><br/>
        <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <br/><br/>
        <button type="submit">Envoyer</button>
      </form>
      <pre>{result}</pre>
    </div>
  );
  // ... après le composant Upload CV
function CreateJob() {
  const [title,setTitle]=useState(""); const [description,setDescription]=useState("");
  const [job,setJob]=useState<any>(null); const [top,setTop]=useState<any[]>([]);

  const create = async () => {
    const {data} = await axios.post("http://localhost:8080/api/jobs",{title,description});
    setJob(data);
  };
  const index = async () => {
    await axios.post(`http://localhost:8080/api/jobs/${job.id}/index`);
    alert("Indexed");
  };
  const topn = async () => {
    const {data} = await axios.get(`http://localhost:8080/api/match/jobs/${job.id}/top?limit=5`);
    setTop(data);
  };

  return (
    <div style={{marginTop:24}}>
      <h2>Créer une offre & Top-N CVs</h2>
      <input placeholder="Titre" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
      <div>
        <button onClick={create}>Créer</button>
        <button onClick={index} disabled={!job}>Indexer</button>
        <button onClick={topn} disabled={!job}>Top-N</button>
      </div>
      {top.length>0 && <pre>{JSON.stringify(top,null,2)}</pre>}
    </div>
  );
}


}
