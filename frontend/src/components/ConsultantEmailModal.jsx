import React, { useState } from 'react';
import axios from 'axios';
 
export default function ConsultantEmailModal({ match, onClose }) {
  const [ccList, setCcList] = useState([]);
  const [ccInput, setCcInput] = useState('');
  const [loading, setLoading] = useState(false);
 
  const recruiterEmail = localStorage.getItem('email');
const toEmail = match.email;
 
  const handleAddCc = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const email = ccInput.trim();
      if (email && !ccList.includes(email)) {
        setCcList([...ccList, email]);
      }
      setCcInput('');
    }
  };
 
  const removeCc = (email) => {
    setCcList(ccList.filter(cc => cc !== email));
  };
 
  const sendEmail = async () => {
    setLoading(true);
    try {
const res = await axios.post('http://127.0.0.1:5000/send-email/recommended-profile', {
        to_email: toEmail,
        from_email: recruiterEmail,
        cc_list: ccList,
        jd_id: match.jd_id,
consultant_name: match.name,
        job_title: match.jd_title,
      });
      alert(res.data.message || 'Email Sent!');
      onClose();
    } catch {
      alert('❌ Failed to send email');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow w-full max-w-md">
      <h2 className='text-lg font-bold mb-4 text-purple-800'>Send Email to {match.name}</h2>
 
        <p className="text-sm mb-1"><b>To:</b> {toEmail}</p>
        <p className="text-sm mb-2"><b>From:</b> {recruiterEmail}</p>
 
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700">CC:</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {ccList.map((cc, i) => (
              <span
                key={i}
                className="flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
              >
                {cc}
                <button
                  onClick={() => removeCc(cc)}
                  className="ml-2 text-purple-500 hover:text-purple-700"
                >
                  ✖
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Enter CC email and press Enter"
            className="w-full mt-2 border px-3 py-2 rounded"
            value={ccInput}
            onChange={(e) => setCcInput(e.target.value)}
            onKeyDown={handleAddCc}
          />
        </div>
 
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button
            onClick={sendEmail}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}