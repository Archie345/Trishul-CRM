import Layout from "../components/layout/Layout";
import { useState } from "react";

export default function AI() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");

  const askAI = () => {
    if (!question.trim()) return;

    setResponse(
      "AI Suggestion: Follow up with qualified leads and prioritize high-priority pending tasks."
    );
  };

  return (
    <Layout>
      <h1 className="text-4xl font-bold text-white mb-8">
        AI Assistant
      </h1>

      <div className="bg-slate-900 rounded-xl p-6">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the CRM Assistant..."
          className="w-full h-40 bg-slate-800 text-white p-4 rounded-lg outline-none"
        />

        <button
          onClick={askAI}
          className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-semibold"
        >
          Ask AI
        </button>

        {response && (
          <div className="mt-6 bg-slate-800 p-4 rounded-lg text-white">
            {response}
          </div>
        )}
      </div>
    </Layout>
  );
}