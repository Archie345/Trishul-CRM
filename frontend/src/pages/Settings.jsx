import Layout from "../components/layout/Layout";

export default function Settings() {
  return (
    <Layout>
      <h1 className="text-4xl font-bold text-white mb-8">
        Settings
      </h1>

      <div className="bg-slate-900 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-gray-400">Name</h2>
          <p className="text-white">Admin User</p>
        </div>

        <div>
          <h2 className="text-gray-400">Email</h2>
          <p className="text-white">archie@example.com</p>
        </div>

        <div>
          <h2 className="text-gray-400">Role</h2>
          <p className="text-white">Administrator</p>
        </div>

        <button
          className="mt-6 bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-white"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </div>
    </Layout>
  );
}