import React, { useState } from 'react';
import axios from 'axios';
import { LockKeyhole, LogIn } from 'lucide-react';
import { jwtDecode } from "jwt-decode";

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://127.0.0.1:5000/login',{ email, password });
      const token = res.data.access_token;
      const decoded = jwtDecode(token);
      const userRole = decoded.sub.role.toLowerCase(); // from token
      
   
      // ✅ Check if selected role matches DB role
      if (userRole !== 'admin') {
        window.location.href = '/login';
        return;
      }
      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);
  localStorage.setItem("email", decoded.sub.email);
   
  
   
      window.location.href = '/admin-dashboard'; // Redirect to admin dashboard
    } catch (err) {
      setError('Invalid credentials or not authorized as Admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-sky-50 px-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full border border-gray-200 text-gray-800">
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 to-sky-500 text-white">
            <LockKeyhole size={26} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Admin Console Login</h2>
          <p className="text-sm text-gray-500">Secure access to RadarX system configuration</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-purple-500 focus:border-purple-500"
              placeholder="admin@radarx.ai"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter password"
            />
          </div>

          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-white rounded-xl font-semibold transition-all duration-300 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600'
            }`}
          >
            <LogIn size={18} />
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
