import React, { useState } from 'react';
import axios from 'axios';
import {
  Rocket,
  Link2,
  ActivitySquare,
  Activity,
  FileText,
  Paperclip,
  AlertTriangle,
  CheckCircle,
  GanttChartIcon,
  BadgeCentIcon,
  SparkleIcon
} from 'lucide-react';

export default function OneToOneMatchPage() {
  const [jdFile, setJdFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [jdId, setJdId] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const userEmail = localStorage.getItem("user_email") || "";

  const uploadJD = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const maxSize = 3 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    alert('❌ Invalid JD file type. Only PDF, DOC, DOCX allowed.');
    return;
  }

  if (file.size > maxSize) {
    alert('❌ JD file too large. Must be under 3MB.');
    return;
  }

  setJdFile(file);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploaded_by', userEmail);
  formData.append('project_code', '1-1-MATCH');

  try {
    const res = await axios.post('http://127.0.0.1:5000/upload-jd', formData);
    if (res.data.jd_id) {
      setJdId(res.data.jd_id);
    } else {
      alert("❌ JD upload failed. File may be empty or unreadable.");
    }
  } catch (err) {
    alert("🚫 JD upload error: " + err.message);
  }
};

const uploadResume = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const maxSize = 3 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    alert('❌ Invalid resume type. Only PDF, DOC, DOCX allowed.');
    return;
  }

  if (file.size > maxSize) {
    alert('❌ Resume file too large. Must be under 3MB.');
    return;
  }

  setResumeFile(file);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);

  try {
    const res = await axios.post('http://127.0.0.1:5000/upload-resume', formData);
    if (res.data.resume_id) {
      setResumeId(res.data.resume_id);
    } else {
      alert("❌ Resume upload failed. File may be empty or unreadable.");
    }
  } catch (err) {
    alert("🚫 Resume upload error: " + err.message);
  }
};

  const runOneToOne = async () => {
    if (!jdId || !resumeId) {
      alert("📎 Please upload both JD and Resume before matching.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/match/one-to-one', {
        jd_id: jdId,
        resume_id: resumeId,
      });
      if (res.data && res.data.score !== undefined) {
        setResult(res.data);
         console.log("📥 Match API Response:", res.data);

      } else {
        alert("Match failed. No result returned.");
      }
    } catch (err) {
      alert("❌ Match API failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
   
  };

  return (
    <div className="flex flex-col items-center px-4 py-12 text-gray-800">

      {/* Animated Header */}
      <div className="text-center space-y-6 mb-12">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute animate-ping-slow inline-flex h-16 w-16 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-30 blur-2xl" />
          <div className="animate-pulse rounded-full p-4 bg-gradient-to-br from-purple-100 to-purple-200 shadow-inner">
            <Activity size={35} className="text-purple-600 drop-shadow-[0_0_10px_rgba(147,51,234,0.6)]" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-sky-500 animate-gradient-x">
          JD ↔ Resume One-to-One Match
        </h1>
      </div>

      {/* Upload Inputs */}
      <div className="w-full max-w-xl space-y-4">
        <label className="block bg-white-200 hover:bg-pink-300 border border-pink-300 text-gray-700 font-medium px-6 py-4 rounded-xl cursor-pointer text-center transition-all">
          <div className="flex items-center justify-center gap-2">
            <FileText size={18} className="text-pink-700" />
            Upload JD File
          </div>
         <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={uploadJD} />
        </label>
        {jdFile && <p className="text-sm text-center text-purple-700">✅ {jdFile.name}</p>}

        <label className="block bg-white-200 hover:bg-purple-300 border border-purple-300 text-gray-700 font-medium px-6 py-4 rounded-xl cursor-pointer text-center transition-all">
          <div className="flex items-center justify-center gap-2">
            <Paperclip size={18} className="text-purple-700" />
            Upload Resume File
          </div>
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={uploadResume} />
        </label>
        {resumeFile && <p className="text-sm text-center text-pink-700">✅ {resumeFile.name}</p>}
      </div>

      {/* Start Match Button */}
      <button
        onClick={runOneToOne}
        disabled={!jdId || !resumeId || loading}
        className="mt-8 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Rocket className="animate-spin-slow" size={20} />
            Matching...
          </>
        ) : (
          <>
            <Rocket size={20} />
            Start AI Matching
          </>
        )}
      </button>

    

      {/* Match Results */}
      {result && (
        <div className="mt-16 w-full max-w-5xl p-[2px] rounded-3xl bg-gradient-to-br from-purple-400/70 via-pink-400/70 to-sky-400/70 shadow-xl backdrop-blur-xl">
          <div className="w-full rounded-[22px] bg-white/90 p-10 sm:p-12 space-y-6 text-gray-800">
        
            {/* Header with Score */}
            <div className="flex flex-wrap justify-between items-center border-b border-gray-300 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <ActivitySquare className="text-purple-600 drop-shadow-md" size={28} />
                <h3 className="text-2xl font-bold text-gray-900">Match Summary</h3>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500 font-medium block">Score</span>
                <span className="text-4xl font-extrabold text-purple-600">
                  {(result.score * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Confidence & Verdict */}
            <div className="flex flex-wrap justify-between gap-6 items-center">
              <div className="flex-1 min-w-[180px] max-w-md">
                <p className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <Rocket size={16} className="text-pink-500" /> Match Confidence
                </p>
                <div className="w-full bg-gradient-to-r from-green-400 via-yellow-300 to-red-500 h-2 rounded-full relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-green-600 transition-all duration-700"
                    style={{ width: `${result.score * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-right min-w-[140px]">
                <span className="text-sm text-gray-500 font-medium block">Verdict</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold
                  ${result.label === 'Strong Match'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'}`}>
                  {result.label}
                </span>
              </div>
            </div>

           

            {/* Skills */}
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-700 flex items-center gap-2">
                  <BadgeCentIcon className="text-purple-500" size={16} /> Matched Skills
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.explanation.skills_matched?.map((skill, i) => (
                    <span key={i} className="text-xs font-medium bg-purple-100 text-purple-700 px-3 py-1 rounded-full shadow-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-700 flex items-center gap-2">
                  <AlertTriangle className="text-red-400" size={16} /> Missing Skills
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.explanation.skills_missing?.map((skill, i) => (
                    <span key={i} className="text-xs font-medium bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Highlights */}
            {result.explanation.resume_highlights?.length > 0 && (
              <div>
                <p className="font-semibold text-gray-700 flex items-center gap-2">
                  <Rocket className="text-green-500" size={16} /> Resume Highlights
                </p>
                <ul className="list-disc ml-5 mt-2 text-sm text-gray-600 space-y-1">
                  {result.explanation.resume_highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* AI Summary (Cohere) */}
{result.explanation.gpt_summary && (
  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl shadow-sm">
    <p className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
      <SparkleIcon className="text-purple-500" size={16} />
      AI Summary
    </p>
    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
      {result.explanation.gpt_summary}
    </p>
  </div>
)}

          </div>
        </div>
      )}
    </div>
  );
}
