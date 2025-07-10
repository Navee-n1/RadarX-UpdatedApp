import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TopMatchCard from '../components/TopMatchCard';
import EmailModal from '../components/EmailModal';
import { ArrowLeft, Send, Download } from 'lucide-react';
import ARDashboardLayout from '../layouts/ARDashboardLayout';
 
export default function ViewSingleJD() {
  const { id } = useParams();
  const navigate = useNavigate();
 
  const [jd, setJD] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [ccList, setCcList] = useState('');
  const [toEmail, setToEmail] = useState('');
  const userEmail = localStorage.getItem('email');
 
  useEffect(() => {
    const fetchMatches = async () => {
      try {
    const res = await axios.post('http://127.0.0.1:5000/match/jd-to-resumes', { jd_id: id });
 
        const jobTitle = res.data?.top_matches?.[0]?.job_title || 'Job Description';
        setJD({ id, job_title: jobTitle });
 
        const seen = new Set();
        const unique = [];
        for (const m of res.data.top_matches || []) {
          if (!seen.has(m.profile_id)) {
            seen.add(m.profile_id);
            unique.push(m);
          }
        }
 
        setMatches(unique.slice(0, 3));
        setToEmail(userEmail || '');
      } catch (err) {
        console.error('❌ Failed to load JD matches:', err);
        alert('❌ Failed to load matches.');
      } finally {
        setLoading(false);
      }
    };
 
    fetchMatches();
  }, [id, userEmail]);
 
  const sendEmail = async () => {
    const goodMatches = matches.filter((m) => m.score >= 0.5);
    try {
  const res = await axios.post('http://127.0.0.1:5000/send-email/manual', {
        jd_id: id,
        to_email: toEmail,
        cc_list: ccList.split(',').map((e) => e.trim()).filter(Boolean),
        attachments: goodMatches.map((m) => m.resume_path || m.file_path || ''),
        subject: `Top Matches for JD: ${jd?.job_title}`,
        top_matches: goodMatches,
      });
      alert(res.data.message || 'Email sent!');
      setShowEmailModal(false);
    } catch (err) {
      alert('❌ Failed to send email');
      console.error(err);
    }
  };
 
  return (

    <div className="min-h-screen bg-white text-gray-800 px-4 sm:px-8 py-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/recruiter/view-jds')}
            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition"
          >
            <ArrowLeft size={16} /> Back to All JDs
          </button>
        </div>
 
        {/* Matches Section */}
        {loading ? (
          <div className="text-center mt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mx-auto" />
            <p className="mt-3 text-gray-600">Fetching matches...</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-sky-500 animate-gradient-x">
              Top 3 Matches for JD: {jd?.job_title}
            </h1>
 
            {matches.length === 0 ? (
              <p className="text-center text-gray-500">No matches found for this JD.</p>
            ) : (
              <div className="space-y-4">
                {matches.map((match, index) => (
                  <TopMatchCard
                    key={index}
                    match={{
                      ...match,
                      rank: index + 1,
                      jd_title: jd?.job_title,
                      jd_id: jd?.id,
                      from_email: toEmail,
                    }}
                  />
                ))}
              </div>
            )}
 
            {/* ✅ Email & PDF Actions (from your working code) */}
            <div className="grid md:grid-cols-2 gap-4 mt-10">
              <input
                type="email"
                value={toEmail}
                readOnly
                className="w-full px-4 py-3 border bg-gray-100 text-gray-600 rounded-xl shadow-sm"
                placeholder="To Email"
              />
              <input
                type="text"
                value={ccList}
                onChange={(e) => setCcList(e.target.value)}
                placeholder="CC List (comma-separated)"
                className="w-full px-4 py-3 border rounded-xl shadow-sm"
              />
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center justify-center gap-2 col-span-2 mt-2 bg-gradient-to-r from-sky-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow hover:from-sky-600 hover:to-purple-600"
              >
                <Send size={18} /> Send Matches
              </button>
              <a
href={`http://127.0.0.1:5000/generate-pdf/${jd?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 col-span-2 mt-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow hover:from-pink-600 hover:to-purple-700"
              >
                <Download size={18} /> Download PDF Report
              </a>
            </div>
          </>
        )}
 
        {/* ✅ Email Modal */}
        {showEmailModal && (
          <EmailModal
            toEmail={toEmail}
            cc={ccList}
            setCc={setCcList}
            onSend={sendEmail}
            onClose={() => setShowEmailModal(false)}
            hasStrongMatch={matches.length > 0}
          />
        )}
      </div>
  );
}