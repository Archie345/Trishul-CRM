import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import api from "../api/api";

export default function Notes() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/notes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotes(response.data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  return (
    <Layout>
      <h1 className="text-4xl font-bold text-white mb-8">
        Notes
      </h1>

      <div className="grid grid-cols-1 gap-6">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-slate-900 rounded-xl p-6 shadow-lg"
          >
            <p className="text-white text-lg mb-4">
              {note.content}
            </p>

            <div className="text-slate-400 text-sm space-y-1">
              <p>Lead ID: {note.lead_id}</p>
              <p>User ID: {note.user_id}</p>
              <p>
                Created:
                {" "}
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}