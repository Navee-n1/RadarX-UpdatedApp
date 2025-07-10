import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import LiveTracker from '../components/LiveTracker';
import TopMatchCard from '../components/TopMatchCard';
import EmailModal from '../components/EmailModal';
import { useNavigate } from 'react-router-dom';
import ARDashboardLayout from '../layouts/ARDashboardLayout';
import { Send, Rocket, RefreshCw, UploadCloud ,Medal,FileText} from 'lucide-react';


export default function UploadJDPage() {
  const [jdFile, setJdFile] = useState(null);
  const [jdId, setJdId] = useState(null);
  const [jdTitle, setJdTitle] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ compared: false, ranked: false, emailed: false });
  const [topMatches, setTopMatches] = useState([]);
  const [cc, setCc] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isMatchRequested, setIsMatchRequested] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Fetch all profiles
  useEffect(() => {
    axios
      .get('http://127.0.0.1:5000/profiles/all')
      .then(res => {
        setProfiles(res.data);
        setFilteredProfiles(res.data);
      })
      .catch(() => alert("❌ Failed to load profiles"));
  }, []);


  const userEmail = localStorage.getItem('email');
  const navigate = useNavigate();

  const axiosAuth = axios.create({
    baseURL: 'http://127.0.0.1:5000',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setJdFile(file);
    setJdTitle(file?.name.replace(/\.[^/.]+$/, '') || 'HEX-JD-BULK');
  };

  const uploadJD = async () => {
    if (!jdFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', jdFile);
    formData.append('job_title', jobTitle);
    formData.append('uploaded_by', userEmail || 'ar@hexaware.com');
    formData.append('project_code', jdTitle);
   
    try {
      const res = await axiosAuth.post('/upload-jd', formData);
      const newJdId = res.data.jd_id;
      setJdId(newJdId);
      setProgress((p) => ({ ...p, compared: true }));
      runMatching(newJdId);
    } catch (err) {
      if (err?.response?.status === 400 && err.response.data?.error === "Empty JD content") {
        alert("❌ JD file is empty! Please upload a valid, readable file.");
      } else {
        alert('❌ JD upload failed');
      }
    } finally {
      setLoading(false);
    }
  };
   

  const runMatching = async (jdId) => {
    if (isMatchRequested) return; // prevent repeated triggers

  setIsMatchRequested(true);
    try {
      const res = await axiosAuth.post('/match/jd-to-resumes', { jd_id: jdId });
     if (Array.isArray(res.data.top_matches)) {
  setTopMatches(res.data.top_matches);
  setProgress((p) => ({ ...p, ranked: true }));
  if (res.data.top_matches.length === 0) {
    console.warn('⚠️ No matches found, but received empty array from API.');
  }
} else {
  alert('❌ Unexpected response format from backend');
}
      console.log('📊 Top matches:', res.data.top_matches);
    } catch (err) {
      if (err?.response?.status === 401) navigate('/');
      alert('❌ Matching failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = useCallback(async () => {
    const goodMatches = topMatches.filter((m) => m.score >= 0.5);
    try {
      const res = await axiosAuth.post('/send-email/manual', {
        jd_id: jdId,
        to_email: userEmail,
        cc_list: cc.split(',').map((e) => e.trim()).filter(Boolean),
        attachments: goodMatches.map((m) => m.resume_path || m.file_path || ''),
        subject: `Top Matches for ${jobTitle}`,
        top_matches: goodMatches,
      });

      alert(res.data.message);
      setEmailSent(true);
      setProgress((p) => ({ ...p, emailed: true }));
      setShowEmailModal(false);
    } catch (err) {
      if (err?.response?.status === 401) navigate('/');
      console.error('❌ Auto Email Error:', err.response?.data?.error || err.message);
    }
  }, [axiosAuth, jdId, userEmail, cc, topMatches, jobTitle, navigate]);

  const resetUpload = () => {
    setJdId(null);
    setJdFile(null);
    setTopMatches([]);
    setEmailSent(false);
    setProgress({ compared: false, ranked: false, emailed: false });
  };

  useEffect(() => {
    if (!emailSent && topMatches.length > 0) {
      const allBelowThreshold = topMatches.every((m) => m.score < 0.5);
      if (allBelowThreshold) {
        console.log('📤 Auto-sending "no good matches" email...');
        handleSendEmail();
      } else {
        console.log('🟢 Found at least one match ≥ 50%. Showing manual send option.');
      }
    }
  }, [topMatches, emailSent, handleSendEmail]);

  return (
    <ARDashboardLayout>
      <div className="text-gray-800 px-4 sm:px-8">
        {!jdId ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
            <h2 className="text-3xl font-extrabold tracking-tight relative inline-block">
              <span className="relative z-10 flex items-center justify-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-sky-500 animate-gradient-x">
                <UploadCloud size={34} className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
                Upload Job Description
              </span>
            </h2>

            <div className="w-full max-w-md space-y-4 text-left">
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Enter Job Title (e.g., Frontend Developer)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
             <label className="block bg-white-200 hover:bg-pink-100 border border-pink-300 text-gray-700 font-medium px-6 py-4 rounded-xl cursor-pointer text-center transition-all">
          <div className="flex items-center justify-center gap-2">
            <FileText size={18} className="text-pink-700" />
            Upload JD File
          </div>
         

         <input
      type="file"
      className="hidden"
      accept=".pdf,.doc,.docx"
      onChange={(e) => {
        const file = e.target.files[0];
        if (!file) return;
 
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const maxSize = 3 * 1024 * 1024; // 3MB
 
        if (!allowedTypes.includes(file.type)) {
          alert('❌ Invalid file type. Only PDF, DOC, DOCX are allowed.');
          return;
        }
 
        if (file.size === 0) {
          alert('❌ File is empty!! Please upload a valid, non-empty JD file.');
          setJdFile(null); // prevents triggering upload
          return;
        }
 
        if (file.size > maxSize) {
          alert('❌ File too large. Must be under 3MB.');
          return;
        }
 
        setJdFile(file);
        setJdTitle(file?.name.replace(/\.[^/.]+$/, '') || 'HEX-JD-BULK');
      }}
    />
</label>

              {jdFile && (
                <div className="text-sm mt-2 text-left space-y-1">
                  <p className="text-green-600 font-medium">✅ JD ready: {jdFile.name}</p>
                  <p className="text-gray-500">You can preview the content after upload inside JD view tab.</p>
                </div>
              )}
            </div>
            

            <button
              onClick={uploadJD}
              disabled={!jdFile || loading}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Rocket className="animate-spin-slow" size={18} /> Matching...
                </>
              ) : (
                <>
                  <Rocket size={18} /> Start AI Matching
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            <LiveTracker jobTitle={jobTitle} jdId={jdId} />


            <div className="text-sm text-gray-500 text-center mt-4">
              Matching powered by <strong className="text-purple-600">RadarX Engine</strong>{' '}
              <span className="ml-2 text-green-500">✅ Healthy</span>
            </div>

            <div className="flex justify-center gap-6 mt-10 flex-wrap">
              {!emailSent && topMatches.some(m => m.score >= 0.5) && (
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Send size={18} /> Send Email
                </button>
              )}
            </div>

          {progress.ranked && (progress.recommended || topMatches.length > 0)  && (
              <div className="mt-10 space-y-6">
                <h3 className="mt-12 text-3xl font-extrabold text-center tracking-tight text-gray-900 flex items-center justify-center gap-3">
  <Medal className="w-8 h-8 text-sky-500 drop-shadow-md" />
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-sky-500 to-purple-500 animate-gradient-x drop-shadow-sm">
    TOP 3 CONSULTANTS
  </span>
</h3>
                <div className="space-y-4">
  {topMatches.map((match, i) => (
    <TopMatchCard
      key={i}
      match={{ ...match, rank: i + 1 }}
      isExpanded={expandedIndex === i}
      onToggleExplain={() => setExpandedIndex(prev => (prev === i ? null : i))}
    />
  ))}
</div>

                <div className="flex justify-center mt-10">
                  <button
                    onClick={resetUpload}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <RefreshCw size={18} className="animate-spin-slow" /> Upload New JD
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {showEmailModal && (
          <EmailModal
            toEmail={userEmail}
            cc={cc}
            setCc={setCc}
            onSend={handleSendEmail}
            onClose={() => setShowEmailModal(false)}
          />
        )}
      </div>
    </ARDashboardLayout>
  );
}
