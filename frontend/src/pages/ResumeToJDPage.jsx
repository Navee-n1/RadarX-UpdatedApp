import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MatchCard from '../components/MatchCard';
import { UserSearch, UploadCloud, LoaderCircle, VoteIcon } from 'lucide-react';

export default function ResumeMatchSection() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);



  const runMatch = async () => {
    if (!resumeId && !selectedProfile) return;
    setLoading(true);
    setMatches([]);
    setExpandedIndex(null);

    try {
      const res = await axios.post('http://127.0.0.1:5000/match/resume-to-jds', {
        ...(resumeId ? { resume_id: resumeId } : {}),
        ...(selectedProfile ? { profile_id: selectedProfile.id } : {}),
      });

      const seen = new Set();
      const unique = [];

      for (const m of res.data.top_matches) {
        const id = m.jd_id || m.jd_file;
        if (!seen.has(id)) {
          seen.add(id);
          unique.push(m);
        }
      }

      setMatches(unique);
    } catch (error) {
      console.error(error);
      alert('❌ Matching failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-16 text-gray-800">
      {/* Header */}
      <div className="text-center space-y-6 mb-10">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute animate-ping-slow inline-flex h-16 w-16 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-30 blur-2xl"></div>
          <div className="animate-pulse rounded-full p-4 bg-gradient-to-br from-purple-100 to-purple-200 shadow-inner">
            <UserSearch size={35} className="text-purple-600 drop-shadow-[0_0_10px_rgba(147,51,234,0.6)]" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-sky-500 animate-gradient-x">
          Resume → JD Matching
        </h1>
      </div>

      

      

      {/* Upload & Match Controls */}
      <div className="w-full max-w-xl space-y-4">
        <label className="block bg-white-200 hover:bg-purple-100 border border-purple-300 text-gray-700 font-medium px-6 py-4 rounded-xl cursor-pointer text-center transition-all">
          <UploadCloud className="inline-block mr-2 mb-1 text-purple-500" size={20} />
          Upload Resume File
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

              setResumeFile(file.name);
              setMatches([]);
              setResumeId(null);
              setExpandedIndex(null);
              setSelectedProfile(null);

              const formData = new FormData();
              formData.append('file', file);
              formData.append('name', file.name);

              axios
                .post('http://127.0.0.1:5000/upload-resume', formData)
                .then((res) => setResumeId(res.data.resume_id))
                .catch((error) => {
                  console.error(error);
                  alert('❌ Resume upload failed.');
                });
            }}
          />
        </label>

        {resumeFile && (
          <p className="text-sm text-center text-purple-700 font-medium">
            ✅ {resumeFile}
          </p>
        )}

        <button
          onClick={runMatch}
          disabled={(!resumeId && !selectedProfile) || loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
        >
          {loading ? (
            <>
              <LoaderCircle className="animate-spin-slow" size={18} /> Matching...
            </>
          ) : (
            <>
              <UserSearch size={18} /> Match Resume to JDs
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {matches.length > 0 && (
        <div className="mt-16 w-full max-w-6xl px-4">
          <h3 className="mt-12 text-3xl font-extrabold text-center tracking-tight text-gray-900 flex items-center justify-center gap-3">
            <VoteIcon className="w-8 h-8 text-sky-500 drop-shadow-md" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-sky-500 to-purple-500 animate-gradient-x drop-shadow-sm">
              TOP 3 JD MATCHES
            </span>
          </h3>
          <br /><br />
          <div className="space-y-4">
            {matches.map((match, i) => (
              <MatchCard
                key={i}
                match={{ ...match, rank: i + 1 }}
                isExpanded={expandedIndex === i}
                onToggleExplain={() =>
                  setExpandedIndex((prev) => (prev === i ? null : i))
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
