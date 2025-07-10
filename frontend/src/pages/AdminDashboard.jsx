import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Users, Edit, Trash2, LogOut, UserPenIcon ,User2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CONFIG_FIELDS = [
  { key: 'genai_key', label: 'GenAI API Key', type: 'text' },
  { key: 'genai_provider', label: 'GenAI Provider', type: 'select', options: ['openai', 'cohere', 'anthropic'] },
  { key: 'genai_enabled', label: 'Enable GenAI', type: 'toggle' },
  { key: 'genai_prompt', label: 'GenAI Prompt', type: 'select-dynamic' },
  { key: 'match_threshold', label: 'Match Threshold', type: 'number' }, // added here
];

function MatchThresholdSlider({ value, onChange, disabled }) {
  const sliderValue = Math.round(value * 100);

  const getSliderColor = (val) => {
    if (val <= 33) return '#ef4444'; // red
    if (val <= 66) return '#facc15'; // yellow
    return '#22c55e'; // green
  };

  const sliderColor = getSliderColor(sliderValue);

  return (
    <div className="mt-2">
      <label className="flex items-center justify-between font-semibold text-gray-700 mb-2 select-none">
        <span>Match Threshold: {sliderValue}%</span>
        <input
          type="range"
          min="1"
          max="100"
          value={sliderValue}
          onChange={(e) => onChange(e.target.value / 100)}
          disabled={disabled}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer ml-4"
          style={{
            background: `linear-gradient(to right, ${sliderColor} 0%, ${sliderColor} ${sliderValue}%, #ddd ${sliderValue}%, #ddd 100%)`
          }}
        />
      </label>
    </div>
  );
}

export default function AdminDashboard() {
  const [view, setView] = useState('settings');
  const [configs, setConfigs] = useState([]);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'admin' });
  const [editUser, setEditUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [configInputs, setConfigInputs] = useState({});
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState({ name: '', text: '' });

  // For match threshold slider
  const [matchThreshold, setMatchThreshold] = useState(0.4); // default 40%
  const [editingThreshold, setEditingThreshold] = useState(false);

  useEffect(() => {
    fetchConfigs();
    fetchUsers();
    fetchPrompts();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/admin/config');
      setConfigs(res.data);

      const initialInputs = {};
      res.data.forEach((c) => {
        initialInputs[c.key] = c.value;
      });
      setConfigInputs(initialInputs);

      // parse and set matchThreshold float from config, fallback 0.4
      const thresholdStr = res.data.find(c => c.key === 'match_threshold')?.value;
      const thresholdFloat = parseFloat(thresholdStr);
      setMatchThreshold(!isNaN(thresholdFloat) ? thresholdFloat : 0.4);
    } catch {
      toast.error('Failed to fetch configs');
    }
  };

  // Save match threshold separately, sync with configInputs
  const saveMatchThreshold = async () => {
    try {
      await axios.post('http://127.0.0.1:5000/admin/config', {
        key: 'match_threshold',
        value: matchThreshold.toString(),
      });
      toast.success('✅ Match threshold updated');
      setEditingThreshold(false);

      // Update configInputs to keep consistent
      setConfigInputs(prev => ({ ...prev, match_threshold: matchThreshold.toString() }));
    } catch {
      toast.error('❌ Failed to update match threshold');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/admin/users');
      setUsers(res.data);
    } catch {
      toast.error('Failed to fetch users');
    }
  };

  const fetchPrompts = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/admin/prompts');
      setPrompts(res.data);
    } catch {
      toast.error('Failed to fetch prompts');
    }
  };

  const handleConfigChange = (key, value) => {
    setConfigInputs({ ...configInputs, [key]: value });
  };

  const handleSaveAllConfigs = async () => {
    const allowedKeys = CONFIG_FIELDS.map((f) => f.key);
    for (const key of Object.keys(configInputs)) {
      if (!allowedKeys.includes(key)) continue;
      let value = configInputs[key];

      if (key === 'genai_prompt') {
        const selectedPrompt = prompts.find((p) => p.name === value);
        if (!selectedPrompt) {
          toast.error(`Prompt "${value}" not found`);
          continue;
        }
        value = selectedPrompt.text;
      }

      if (typeof value !== 'string' || value.trim() === '') continue;

      try {
        await axios.post('http://127.0.0.1:5000/admin/config', { key, value: value.trim() });
      } catch (err) {
        toast.error(`❌ Failed to save config ${key}: ${err.response?.data?.error || err.message}`);
      }
    }

    toast.success('✅ All configurations saved!');
    setIsEditingConfig(false);
  };

  const handlePromptAdd = async () => {
    if (!newPrompt.name || !newPrompt.text) return toast.error('Both name and text required');
    await axios.post('http://127.0.0.1:5000/admin/prompts', newPrompt);
    toast.success('✅ Prompt added');
    setNewPrompt({ name: '', text: '' });
    fetchPrompts();
  };

  const handlePromptDelete = async (id) => {
    await axios.delete(`http://127.0.0.1:5000/admin/prompts/${id}`);
    toast.success('🗑️ Prompt deleted');
    fetchPrompts();
  };

  const handleUserCreate = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:5000/admin/create-user', newUser);
      toast.success(res.data.message);
      setNewUser({ email: '', password: '', role: 'recruiter' });
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || '❌ Failed to create user.');
    }
  };

  const handleUserDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`http://127.0.0.1:5000/admin/user/${id}`);
      toast.success('❌ User deleted');
      fetchUsers();
    } catch {
      toast.error('❌ Failed to delete user');
    }
  };

  const handleUserUpdate = async () => {
    try {
      await axios.put(`http://127.0.0.1:5000/admin/user/${editUser.id}`, {
        email: editUser.email,
        role: editUser.role,
      });
      toast.success('✅ User updated');
      setEditUser(null);
      fetchUsers();
    } catch {
      toast.error('❌ Failed to update user');
    }
  };

  const filteredUsers = roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br font-sans from-white via-pink-50 to-purple-100 flex flex-col">
      <header className="flex justify-between items-center px-6 py-4 shadow bg-white">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red to-red-500">Radar</span>
          <span className="bg-gradient-to-r from-red-100 to-red-600 text-white shadow px-1">X</span>
          <span className="text-sm text-grey-200 font-medium ml-2">| Admin</span>
        </h1>
        <button
          onClick={() => (localStorage.clear(), (window.location.href = '/frontman'))}
          className="text-sm px-4 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-red-100 transition"
        >
          Logout
        </button>
      </header>

      <div className="flex justify-center my-6 space-x-4">
        <button
          onClick={() => setView('settings')}
          className={`px-6 py-2 rounded-full shadow text-sm font-semibold transition-all border ${
            view === 'settings' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Settings className="inline-block mr-2" size={16} /> Settings
        </button>
        <button
          onClick={() => setView('users')}
          className={`px-6 py-2 rounded-full shadow text-sm font-semibold transition-all border ${
            view === 'users' ? 'bg-pink-500 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Users className="inline-block mr-2" size={16} /> Users
        </button>
      </div>

      <main className="flex-1 px-6 pb-28">
        {view === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-8 font-sans">
            {/* GenAI Configurations Block */}
            <div className="backdrop-blur-xl bg-white/60 border border-purple-200 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6 border-b border-purple-200 pb-3">
                <h3 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  GenAI Configurations
                </h3>
                <button
                  onClick={() => setIsEditingConfig(!isEditingConfig)}
                  className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                >
                  <Edit size={16} /> {isEditingConfig ? 'Cancel Edit' : 'Edit Configurations'}
                </button>
              </div>

              <label className="flex items-center gap-3 mb-6">
                <span className="text-sm font-medium text-gray-700">Enable GenAI</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={configInputs['genai_enabled'] === 'true'}
                    onChange={(e) => {
                      const val = e.target.checked.toString();
                      handleConfigChange('genai_enabled', val);
                      toast.success(`🔁 GenAI ${val === 'true' ? 'Enabled' : 'Disabled'}`);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-300 rounded-full peer-checked:bg-purple-500 transition-colors duration-300" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 peer-checked:translate-x-6" />
                </div>
              </label>

              <div className="space-y-5">
                {CONFIG_FIELDS.filter((f) => f.key !== 'genai_enabled' && f.key !== 'match_threshold').map((field) => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">{field.label}</label>
                    {field.type === 'select-dynamic' ? (
                      <select
                        value={configInputs[field.key] || ''}
                        onChange={(e) => handleConfigChange(field.key, e.target.value)}
                        disabled={!isEditingConfig}
                        className="rounded-xl px-3 py-2 border border-pink-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition bg-white"
                      >
                        <option value="">-- Select Prompt --</option>
                        {Array.isArray(prompts) ? prompts.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        )) : null}
                      </select>
                    ) : field.type === 'text' ? (
                      <input
                        value={configInputs[field.key] || ''}
                        onChange={(e) => handleConfigChange(field.key, e.target.value)}
                        readOnly={!isEditingConfig}
                        className="rounded-xl px-3 py-2 border border-pink-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition bg-white"
                      />
                    ) : (
                      <select
                        value={configInputs[field.key] || ''}
                        onChange={(e) => handleConfigChange(field.key, e.target.value)}
                        disabled={!isEditingConfig}
                        className="rounded-xl px-3 py-2 border border-pink-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition bg-white"
                      >
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                {/* Save button for GenAI configs */}
                {isEditingConfig && (
                  <button
                    onClick={handleSaveAllConfigs}
                    className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-5 py-2 rounded-xl shadow-lg hover:shadow-xl transition"
                  >
                    Save Configurations
                  </button>
                )}
              </div>
            </div>

            {/* Match Threshold Slider Block */}
            <div className="backdrop-blur-xl bg-white/60 border border-pink-200 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-800">Match Threshold</h4>
                <button
                  onClick={() => setEditingThreshold(!editingThreshold)}
                  className="text-purple-600 hover:text-purple-800 transition"
                  aria-label={editingThreshold ? "Cancel Edit" : "Edit Threshold"}
                  title={editingThreshold ? "Cancel Edit" : "Edit Threshold"}
                >
                  <Edit2 size={20} />
                </button>
              </div>

              <MatchThresholdSlider value={matchThreshold} onChange={setMatchThreshold} disabled={!editingThreshold} />

              {editingThreshold && (
                <button
                  onClick={saveMatchThreshold}
                  className="mt-3 w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 rounded font-semibold hover:brightness-110 transition"
                >
                  Save Threshold
                </button>
              )}
            </div>

            {/* Manage Prompts Block */}
            <div className="backdrop-blur-xl bg-white/60 border border-pink-200 rounded-2xl shadow-xl p-6">
              <h4 className="text-xl font-bold text-pink-600 mb-4">Manage Prompts</h4>
              <div className="flex gap-2 mb-4">
                <input
                  placeholder="Prompt Name"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                  className="border px-3 py-2 rounded w-1/3 font-sans border-pink-300"
                />
                <input
                  placeholder="Prompt Text"
                  value={newPrompt.text}
                  onChange={(e) => setNewPrompt({ ...newPrompt, text: e.target.value })}
                  className="border px-3 py-2 rounded w-2/3 font-sans border-pink-300"
                />
                <button onClick={handlePromptAdd} className="bg-pink-500 text-white px-4 py-2 rounded font-semibold">
                  Add
                </button>
              </div>

              <ul className="space-y-3">
                {prompts.map((p) => (
                  <li
                    key={p.id}
                    className="bg-white/70 backdrop-blur px-4 py-3 rounded-xl shadow border border-pink-100 font-sans"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm font-semibold text-purple-600 truncate w-3/4">{p.name}</div>
                      <button onClick={() => handlePromptDelete(p.id)} className="text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-3">{p.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        
{view === 'users' && (
  <div className="max-w-5xl mx-auto px-4 py-10 font-sans text-gray-800">
    
    {/* Header */}
    <div className="text-center mb-10">
      <h2 className="text-3xl font-extrabold tracking-tight relative inline-block">
              <span className="relative z-10 flex items-center justify-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-sky-500 animate-gradient-x">
                <UserPenIcon size={34} className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
                USER DASHBOARD
              </span>
            </h2>
    </div>

    {/* Filter + Add Button */}
    <div className="flex justify-between items-center bg-white/70 backdrop-blur rounded-2xl shadow-md px-6 py-4 mb-8 border border-purple-100">
      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="border border-purple-300 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
      >
        <option value="all">All Roles</option>
        <option value="recruiter">Recruiters</option>
        <option value="ar">AR Requestors</option>
      </select>
      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-xl flex items-center gap-2"
      >
        <Plus size={16} /> Add User
      </button>
    </div>

    {/* User Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
  {filteredUsers.length === 0 ? (
    <div className="text-center text-gray-400 italic col-span-full">No users found.</div>
  ) : (
    filteredUsers.map((user) => {
      const roleStyles = {
        admin: {
          card: 'border-red-200 bg-white/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]',
          icon: 'text-red-500 bg-red-100',
        },
        recruiter: {
          card: 'border-purple-200 bg-white/60 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]',
          icon: 'text-purple-500 bg-purple-100',
        },
        ar: {
          card: 'border-pink-200 bg-white/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]',
          icon: 'text-pink-500 bg-pink-100',
        },
      };

      const { card, icon } = roleStyles[user.role] || roleStyles.ar;

      return (
        <div
          key={user.id}
          className={`rounded-2xl p-4 h-[120px] w-full shadow transition-all backdrop-blur border ${card} flex flex-col justify-between`}
        >
          {/* Icon + Email */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full shadow-inner ${icon}`}>
              <User2 size={18} />
            </div>
            <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
          </div>

          {/* Role + Date + Actions */}
          <div className="flex justify-between items-center text-xs">
            <span className={`px-2 py-0.5 rounded-full font-medium ${icon}`}>
              {user.role}
            </span>
            <span className="text-gray-400">{user.created_at}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setEditUser(user)}
                className="text-purple-600 hover:text-purple-800"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleUserDelete(user.id)}
                className="text-pink-600 hover:text-pink-800"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      );
    })
  )}
</div>

  </div>
)}

      </main>

 {editUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow space-y-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-purple-700">✏️ Edit User</h3>
            <input value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} className="w-full border border-pink-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })} className="w-full border border-pink-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="recruiter">Recruiter</option>
              <option value="ar">AR Requestor</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setEditUser(null)} className="text-gray-600">Cancel</button>
              <button onClick={handleUserUpdate} className="bg-purple-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow space-y-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-sky-700">➕ Add New User</h3>
            <input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full border border-pink-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full border border-pink-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full border border-pink-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="recruiter">Recruiter</option>
              <option value="ar">AR Requestor</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowCreateModal(false)} className="text-gray-600">Cancel</button>
              <button onClick={handleUserCreate} className="bg-purple-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      

      <footer className="fixed bottom-0 w-full bg-white border-t border-gray-200 text-center text-xs text-gray-500 py-2">
        © 2025 RadarX. All rights reserved.
      </footer>
    </div>
  );
}
