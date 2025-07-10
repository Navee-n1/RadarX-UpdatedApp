import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ResumeToJDPage from './ResumeToJDPage';
import OneToOneMatchSection from '../components/OneToOneMatchSection';
import ViewJDMatches from '../components/ViewJDMatches';
import SearchResultsCard from '../components/SearchResultsCard';
import { motion, AnimatePresence } from 'framer-motion';
import AgentHealthPage from './AgentHealthPage';
import {
  PlusCircle,
  Search,
  Filter,
  Users,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import { useMotionValue, useTransform, animate } from 'framer-motion';
import { Outlet } from 'react-router-dom';

const verticalOptions = [
  'Banking', 'Healthcare', 'Insurance', 'GTT', 'HTPS', 'GEN-AI', 'Cloud', 'Hexavarsity', 'Others'
];

export default function RecruiterDashboard() {
  const [activeSection, setActiveSection] = useState('search');
  const [profileFile, setProfileFile] = useState(null);
  const [empId, setEmpId] = useState('');
  const [name, setName] = useState('');
  const [vertical, setVertical] = useState('');
  const [experience, setExperience] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmpId, setSearchEmpId] = useState('');
  const [searchVertical, setSearchVertical] = useState('');
  const [searchSkills, setSearchSkills] = useState('');
  const [minExp, setMinExp] = useState('');
  const [maxExp, setMaxExp] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [status, setStatus] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [summary, setSummary] = useState({ profiles: 0, jds: 0, matches: 0 });
  const [agentHealth, setAgentHealth] = useState('Checking...');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
 useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = '/';

  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  fetchSummary(); // Only runs once on initial load

  axios.get('http://127.0.0.1:5000/match/health')
    .then((res) => setAgentHealth(res.data.status))
    .catch(() => setAgentHealth('❌ Engine not responding'));
}, []);



const fetchSummary = () => {
  axios.get('http://127.0.0.1:5000/recruiter/summary')
    .then((res) => setSummary(res.data))
    .catch(() => {});
};

const handleResumeUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const maxSize = 3 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    alert('❌ Invalid file type. Only PDF, DOC, DOCX allowed.');
    return;
  }

  if (file.size > maxSize) {
    alert('❌ File too large. Must be under 3MB.');
    return;
  }

  setProfileFile(file);
};


  const uploadProfile = async () => {
    if (!empId || !name || !profileFile || !vertical) return alert('Fill all fields.');
    const formData = new FormData();
    formData.append('file', profileFile);
    formData.append('emp_id', empId);
    formData.append('name', name);
    formData.append('vertical', vertical);
    formData.append('experience_years', experience);
    formData.append('email',email);
    formData.append('role',role);
    formData.append('status',profileStatus)
    try {
      await axios.post('http://127.0.0.1:5000/upload-profile', formData);
      setStatus('✅ Profile uploaded successfully');
      setShowUploadModal(false);
      fetchSummary();
    } catch {
      setStatus('❌ Upload failed');
    }
  };

  const handleSearch = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/profiles/search', {
        params: {
          name: searchName,
          emp_id: searchEmpId,
          status :status,
          vertical: searchVertical,
          skills: searchSkills,
          min_exp: minExp,
          max_exp: maxExp
        },
      });
      setSearchResults(res.data);
    } catch {
      alert('❌ Failed to fetch profiles.');
    }
  };

 
  

  const AnimatedCount = ({ target }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.floor(latest).toLocaleString());
    useEffect(() => {
      const controls = animate(count, target, { duration: 2 });
      return controls.stop;
    }, [target]);
    return <motion.span>{rounded}</motion.span>;
  };

  const navTabs = [
    { key: 'search', label: 'Profiles' },
    { key: 'resume', label: 'Resume → JD' },
    { key: 'onetoone', label: 'One-to-One' },
    { key: 'jds', label: 'View JDs' },
    { key: 'health', label: 'Agent Health' }  // ✅ new
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-white via-gray-50 to-purple-50 text-gray-900 font-sans">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red to-red-300">Radar</span>
          <span className="bg-gradient-to-r from-red-100 to-red-600 text-white shadow px-1">X</span>
          <span className="text-sm text-grey-200 font-medium ml-2">| Recruiter</span>
        </h1>
        <nav className="flex gap-6 items-center">
          {navTabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`group relative text-sm font-semibold px-2 py-1 transition-all duration-200 ${
                activeSection === item.key ? 'text-purple-700' : 'text-gray-600 hover:text-purple-700'
              }`}
            >
              <span className="relative">
                {item.label}
                <span
                  className={`absolute left-0 -bottom-1 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ${
                    activeSection === item.key ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </span>
            </button>
          ))}
          <button onClick={() => localStorage.clear() || (window.location.href = '/')} className="text-sm px-4 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-red-100 transition">
            Logout
          </button>
        </nav>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pb-16">
        <AnimatePresence mode="wait">
          {activeSection === 'search' && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-10">
                {[{
                  icon: Users,
                  label: 'Consultants',
                  value: summary.profiles,
                  from: '#6B21A8',
                  to: '#9333EA',
                }, {
                  icon: FileText,
                  label: 'Job Descriptions',
                  value: summary.jds,
                  from: '#2563EB',
                  to: '#3B82F6',
                }, {
                  icon: ClipboardCheck,
                  label: 'Matches',
                  value: summary.matches,
                  from: '#059669',
                  to: '#10B981',
                }].map(({ icon: Icon, label, value, from, to }, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="relative rounded-3xl p-6 backdrop-blur-lg bg-white/30 shadow-lg border border-white/30"
                  >
                    <div
                      className="absolute inset-0 z-0 rounded-3xl pointer-events-none"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})`, opacity: 0.05 }}
                    />
                    <div className="relative z-10 flex flex-col items-center space-y-3 text-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-white/50 to-white/10 backdrop-blur border border-white/30 shadow-inner hover:scale-105 transition"
                        style={{ boxShadow: `0 0 15px -5px ${to}` }}
                      >
                        <Icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <p className="text-base font-semibold text-gray-700 tracking-wide">{label}</p>
                      <h3 className="text-4xl font-extrabold text-gray-900">
                        <AnimatedCount target={value} />
                      </h3>
                    </div>
                  </motion.div>
                ))}
              </div>

             {/* Search and Upload UI */}
<div className="flex justify-between items-center mt-2 mb-4">
  <h2 className="text-2xl font-bold tracking-wide text-center flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-sky-500">
    <Search size={28} className="text-purple-600" />
    Search Consultant Profiles
  </h2>
  <button
    onClick={() => setShowUploadModal(true)}
    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl shadow hover:scale-105 transition"
  >
    <PlusCircle size={20} />
    Upload Profile
  </button>
</div>

{showUploadModal && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center font-sans">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-8 space-y-6">
      <h3 className="text-2xl font-bold text-purple-700">Upload Consultant Profile</h3>

      {/* GRID Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Emp ID</label>
          <input
            placeholder="10-digit Employee ID"
            value={empId}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d{0,10}$/.test(val)) setEmpId(val); // max 10 digits only
            }}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
          />
          {empId && empId.length !== 10 && (
            <p className="text-xs text-red-500 mt-1">Employee ID must be exactly 10 digits.</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Full Name</label>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Experience (Years)</label>
          <input
            type="number"
            placeholder="e.g., 3"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
          >
            <option value="">-- Select Role --</option>
            <option value="Trainee">Trainee</option>
            <option value="Associate Software Engineer">Associate Software Engineer</option>
            <option value="Software Engineer">Software Engineer</option>
            <option value="Senior Software Engineer">Senior Software Engineer</option>
            <option value="Lead Engineer">Lead Engineer</option>
            <option value="Technical Lead">Technical Lead</option>
            <option value="Module Lead">Module Lead</option>
            <option value="Technical Specialist">Technical Specialist</option>
            <option value="Senior Technical Specialist">Senior Technical Specialist</option>
            <option value="Architect">Architect</option>
            <option value="Senior Architect">Senior Architect</option>
            <option value="Technical Architect">Technical Architect</option>
            <option value="Senior Technical Architect">Senior Technical Architect</option>
            <option value="Delivery Lead">Delivery Lead</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Senior Project Manager">Senior Project Manager</option>
            <option value="Program Manager">Program Manager</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
          <select
            value={profileStatus}
            onChange={(e) => setProfileStatus(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
          >
            <option value="">-- Select Status --</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Rolling Off">Rolling Off</option>
            <option value="Training">Training</option>
            <option value="Released">Released</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Vertical</label>
          <select
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select Vertical</option>
            {verticalOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">Upload Resume</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeUpload}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={() => setShowUploadModal(false)}
          className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={uploadProfile}
          disabled={empId.length !== 10}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Upload
        </button>
      </div>

      {status && <p className="text-sm text-center text-gray-600">{status}</p>}
    </div>
  </div>
)}



              {/* Search Inputs */}
              <div className="grid md:grid-cols-5 gap-4">
                <input placeholder="Name or Emp ID" onChange={(e) => { setSearchName(e.target.value); setSearchEmpId(e.target.value); }} className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm" />
                <input placeholder="Skills" onChange={(e) => setSearchSkills(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm" />
                <select onChange={(e) => setSearchVertical(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm">
                  <option value="">Select Vertical</option>
                  {verticalOptions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <input placeholder="Min Exp" type="number" onChange={(e) => setMinExp(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl" />
                <input placeholder="Max Exp" type="number" onChange={(e) => setMaxExp(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl" />
              </div>
              <div className="flex items-center justify-between mt-4">
                <button onClick={handleSearch} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl shadow hover:scale-105 transition">
                  <Filter className="inline mr-2" size={16} /> Run Search
                </button>
                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="text-sm text-purple-700 hover:underline">
                  Switch to {viewMode === 'grid' ? 'List' : 'Grid'} View
                </button>
              </div>
              {searchResults.length > 0 && <SearchResultsCard results={searchResults} viewMode={viewMode} />}
            </motion.div>
          )}

          {activeSection === 'resume' && (
            <motion.div key="resume" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResumeToJDPage />
            </motion.div>
          )}

          {activeSection === 'onetoone' && (
            <motion.div key="onetoone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-12">
              <OneToOneMatchSection />
            </motion.div>
          )}

          {activeSection === 'jds' && (
            <motion.div key="jds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ViewJDMatches />
            </motion.div>
          )}
       {activeSection === 'health' && (
  <motion.div
    key="health"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="w-full text-center mt-8"
  >
    <h2 className="text-xl font-semibold text-purple-700 mb-4">Agent Status</h2>
    <p className="text-lg text-gray-700">{agentHealth}</p>
    <AgentHealthPage />
  </motion.div>
)}


        </AnimatePresence>
      </main>

      <footer className="border-t border-gray-200 bg-white text-center py-3 text-sm text-gray-500 mt-auto">
        © 2025 RadarX. All rights reserved by House of Starks.
      </footer>
    </div>
  );
}
