import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import api from "../api/api";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [leads, setLeads] = useState([]);

  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const [content, setContent] = useState("");
  const [leadId, setLeadId] = useState("");

  useEffect(() => {
    fetchNotes();
    fetchLeads();
  }, []);

  // =========================
  // FETCH NOTES
  // =========================

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

  // =========================
  // FETCH LEADS
  // =========================

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/leads", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLeads(response.data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  // =========================
  // ADD NOTE
  // =========================

  const handleAddNote = async (e) => {
    e.preventDefault();

    if (!content.trim() || !leadId) {
      alert("Please select a lead and enter a note.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await api.post(
        `/notes/${leadId}`,
        {
          content: content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setContent("");
      setLeadId("");
      setShowAddModal(false);

      fetchNotes();
    } catch (error) {
      console.error("Error adding note:", error);
      console.error(error.response?.data);
      alert("Failed to add note.");
    }
  };

  // =========================
  // EDIT NOTE
  // =========================

  const handleEditNote = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert("Note cannot be empty.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await api.put(
        `/notes/${editingNote.id}`,
        {
          content: content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditingNote(null);
      setContent("");

      fetchNotes();
    } catch (error) {
      console.error("Error updating note:", error);
      console.error(error.response?.data);
      alert("Failed to update note.");
    }
  };

  // =========================
  // DELETE NOTE
  // =========================

  const handleDeleteNote = async (noteId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      await api.delete(`/notes/${noteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      console.error(error.response?.data);
      alert("Failed to delete note.");
    }
  };

  // =========================
  // START EDITING
  // =========================

  const startEditing = (note) => {
    setEditingNote(note);
    setContent(note.content);
  };

  // =========================
  // FIND LEAD NAME
  // =========================

  const getLeadName = (leadId) => {
    const lead = leads.find((lead) => lead.id === leadId);

    return lead
      ? `${lead.name} (${lead.company})`
      : `Lead #${leadId}`;
  };

  // =========================
  // SEARCH
  // =========================

  const filteredNotes = notes.filter((note) => {
    const leadName = getLeadName(note.lead_id);

    return (
      note.content.toLowerCase().includes(search.toLowerCase()) ||
      leadName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <Layout>
      <div className="p-8">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">

          <h1 className="text-4xl font-bold text-white">
            Notes
          </h1>

          <button
            onClick={() => {
              setContent("");
              setLeadId("");
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg text-white font-semibold transition"
          >
            + Add Note
          </button>

        </div>

        {/* SEARCH */}

        <div className="mb-6">

          <input
            type="text"
            placeholder="🔍 Search notes or leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 bg-slate-800 text-white px-4 py-3 rounded-lg outline-none"
          />

        </div>

        {/* NOTES */}

        <div className="grid grid-cols-1 gap-6">

          {filteredNotes.length > 0 ? (

            filteredNotes.map((note) => (

              <div
                key={note.id}
                className="bg-slate-900 rounded-xl p-6 shadow-lg hover:bg-slate-800 transition"
              >

                {/* NOTE CONTENT */}

                <p className="text-white text-lg mb-5">
                  {note.content}
                </p>

                {/* NOTE DETAILS */}

                <div className="text-slate-400 text-sm space-y-2">

                  <p>
                    <span className="text-slate-300 font-semibold">
                      Lead:
                    </span>{" "}
                    {getLeadName(note.lead_id)}
                  </p>

                  <p>
                    <span className="text-slate-300 font-semibold">
                      User ID:
                    </span>{" "}
                    {note.user_id}
                  </p>

                  <p>
                    <span className="text-slate-300 font-semibold">
                      Created:
                    </span>{" "}
                    {new Date(note.created_at).toLocaleString()}
                  </p>

                </div>

                {/* ACTION BUTTONS */}

                <div className="flex gap-3 mt-5">

                  <button
                    onClick={() => startEditing(note)}
                    className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg text-white font-semibold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-semibold"
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))

          ) : (

            <div className="bg-slate-900 rounded-xl p-8 text-center">

              <p className="text-gray-400">
                No notes found.
              </p>

            </div>

          )}

        </div>

        {/* ================================= */}
        {/* ADD NOTE MODAL */}
        {/* ================================= */}

        {showAddModal && (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">

            <div className="bg-slate-900 rounded-xl p-6 w-full max-w-lg shadow-2xl">

              <div className="flex justify-between items-center mb-6">

                <h2 className="text-2xl font-bold text-white">
                  Add Note
                </h2>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>

              </div>

              <form onSubmit={handleAddNote}>

                {/* LEAD */}

                <label className="block text-gray-300 mb-2">
                  Select Lead
                </label>

                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  required
                  className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none mb-5"
                >

                  <option value="">
                    Select a lead
                  </option>

                  {leads.map((lead) => (

                    <option
                      key={lead.id}
                      value={lead.id}
                    >
                      {lead.name} - {lead.company}
                    </option>

                  ))}

                </select>

                {/* CONTENT */}

                <label className="block text-gray-300 mb-2">
                  Note
                </label>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note..."
                  required
                  className="w-full h-32 bg-slate-800 text-white px-4 py-3 rounded-lg outline-none resize-none"
                />

                {/* BUTTONS */}

                <div className="flex justify-end gap-3 mt-6">

                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white font-semibold"
                  >
                    Add Note
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {/* ================================= */}
        {/* EDIT NOTE MODAL */}
        {/* ================================= */}

        {editingNote && (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">

            <div className="bg-slate-900 rounded-xl p-6 w-full max-w-lg shadow-2xl">

              <div className="flex justify-between items-center mb-6">

                <h2 className="text-2xl font-bold text-white">
                  Edit Note
                </h2>

                <button
                  onClick={() => {
                    setEditingNote(null);
                    setContent("");
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>

              </div>

              <form onSubmit={handleEditNote}>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full h-40 bg-slate-800 text-white px-4 py-3 rounded-lg outline-none resize-none"
                />

                <div className="flex justify-end gap-3 mt-6">

                  <button
                    type="button"
                    onClick={() => {
                      setEditingNote(null);
                      setContent("");
                    }}
                    className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white font-semibold"
                  >
                    Save Changes
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>
    </Layout>
  );
}