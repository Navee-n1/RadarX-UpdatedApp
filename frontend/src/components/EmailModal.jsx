import React, { useState } from 'react';
import { Plus, Minus, Send, X, Mail, AlertTriangle, Loader } from 'lucide-react';

export default function EmailModal({ toEmail, cc, setCc, onSend, onClose, hasStrongMatch = true }) {
  const [newCc, setNewCc] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const ccArray = cc.split(',').map(e => e.trim()).filter(Boolean);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleAddCc = () => {
    if (!newCc) return;
    if (!emailRegex.test(newCc)) {
      setError('Invalid email format');
      return;
    }
    if (ccArray.includes(newCc)) {
      setError('Email already added');
      return;
    }
    setCc([...ccArray, newCc].join(', '));
    setNewCc('');
    setError('');
  };

  const handleRemoveCc = (email) => {
    const filtered = ccArray.filter(c => c !== email);
    setCc(filtered.join(', '));
  };

  const handleSend = async () => {
    setSending(true);
    await onSend();
    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-300 shadow-2xl p-6 space-y-6 text-gray-800">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 text-xl font-bold text-gray-900 tracking-wide">
          <Mail className="text-sky-600 animate-pulse" />
          <span className="bg-gradient-to-r from-sky-500 to-purple-600 bg-clip-text text-transparent">
            Send Matches
          </span>
        </div>

        {/* To Field */}
        <div>
          <label className="text-sm text-gray-500 font-medium">To</label>
          <input
            type="email"
            value={toEmail}
            readOnly
            className="w-full mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-sm text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* CC Field (Only if strong matches) */}
        {hasStrongMatch ? (
          <div>
            <label className="text-sm text-gray-500 font-medium">CC</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={newCc}
                onChange={(e) => {
                  setNewCc(e.target.value);
                  setError('');
                }}
                placeholder="Add email"
                className="flex-1 px-3 py-2 rounded-md border border-gray-300 text-sm"
              />
              <button
                onClick={handleAddCc}
                className="bg-sky-600 text-white px-3 rounded-md hover:bg-sky-700 transition"
              >
                <Plus size={16} />
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {ccArray.map((email, i) => (
                <span
                  key={i}
                  className="bg-gray-100 text-sm px-3 py-1 rounded-full flex items-center gap-1 text-gray-800 border border-gray-300 shadow-sm"
                >
                  {email}
                  <button onClick={() => handleRemoveCc(email)} className="ml-1 text-red-500 hover:text-red-600">
                    <Minus size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm rounded-md px-4 py-3 flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5" />
            No strong matches found. Only a notification email will be sent to the recruiter without attachments.
          </div>
        )}

        {/* Send Button */}
        <div>
          <button
            onClick={handleSend}
            disabled={sending}
            className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
              sending
                ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-500 to-purple-500 hover:from-sky-600 hover:to-purple-600'
            }`}
          >
            {sending ? (
              <>
                <Loader size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
