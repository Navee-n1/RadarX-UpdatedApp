import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FileText, Users, Trophy, Mail, Brain, CheckCircle, XCircle } from 'lucide-react';

export default function LiveTracker({ jobTitle, jdId }) {
  const [status, setStatus] = useState({
    compared: false,
    ranked: false,
    recommended: false,
    emailed: false,
  });

  const [topMatches, setTopMatches] = useState([]);
  const [emailSent, setEmailSent] = useState(false);
  const matchTriggeredRef = useRef(false);
const recommendedMatches = topMatches.filter(m => m.score >= 0.5);

  // ✅ Destructure status for easy use in JSX
  const { compared, ranked, recommended, emailed } = status;

  // 🧠 Poll JD status every 3s
  useEffect(() => {
    if (!jdId) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:5000/status/${jdId}`);
        setStatus(res.data);

        const emailRes = await axios.get(`http://127.0.0.1:5000/email/sent/${jdId}`);
        setEmailSent(emailRes.data.emailed);

        if (emailRes.data.emailed) {
          clearInterval(intervalId); // Stop polling once emailed
        }
      } catch (err) {
        console.error('Status poll failed:', err);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [jdId]);

  // ⚡ Trigger match once
  useEffect(() => {
    if (!jdId || matchTriggeredRef.current) return;

    const triggerMatch = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:5000/status/${jdId}`);
        if (res.data.compared && res.data.ranked) {
          matchTriggeredRef.current = true;
          return;
        }

        const matchRes = await axios.post(`http://127.0.0.1:5000/match/jd-to-resumes`, {
          jd_id: jdId,
        });

        setTopMatches(matchRes.data.top_matches || []);
        matchTriggeredRef.current = true;
      } catch (err) {
        console.error('Match trigger failed:', err);
      }
    };

    triggerMatch();
  }, [jdId]);

  const steps = [
    {
      name: 'JD Analysis',
      icon: FileText,
      active: compared,
      details: '✓ JD text extracted • Skills identified',
    },
    {
      name: 'Profile Comparison',
      icon: Users,
      active: ranked,
      details: '✓ Consultant profiles matched by AI',
    },
    {
      name: 'Intelligent Ranking',
      icon: Trophy,
     active: recommended,
failed: !recommended && ranked,
details: recommended
  ? `✓ ${recommendedMatches.length} profile${recommendedMatches.length > 1 ? 's' : ''} recommended`
  : '⚠ No profiles met the quality threshold',

    },
   {
      name: 'Email Sent',
      icon: Mail,
      active: emailed && emailSent,
      details: emailSent
        ? '✓ Email successfully sent to recruiter'
        : '📬 Ready to send',
    },
  ];

  const currentIndex = steps.findIndex((s) => !s.active && !s.failed);
  const progressPercent = currentIndex === -1 ? 100 : (currentIndex / steps.length) * 100;

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-10 border border-gray-300">
      <h3 className="text-xl sm:text-2xl font-extrabold text-center text-gray-800 tracking-wide flex items-center justify-center gap-2">
        {emailed ? (
          <>
            <Brain
              size={28}
              className={`${
                recommended
                  ? 'text-green-600 drop-shadow-[0_0_5px_rgba(34,197,94,0.6)]'
                  : 'text-yellow-500 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]'
              }`}
            />
           <span
              className={`${
                recommended ? 'text-green-700' : 'text-yellow-700'
              } flex items-center gap-2`}
            >
              {recommended ? 'Recognised' : 'Notified'}
              <span
                className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full shadow-sm animate-pulse ${
                  recommended
                    ? 'bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-800'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                }`}
              >
                {recommended ? '🏅 Top Match' : '⚠ No Recommended Profiles'}
              </span>
            </span>
          </>
        ) : (
          <>
            <motion.span
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="w-6 h-6 text-purple-600 drop-shadow-[0_0_5px_rgba(150,0,255,0.6)]" />
            </motion.span>
            <span className="text-gray-900">
              Matching for <span className="text-purple-600">{jobTitle}</span>
            </span>
          </>
        )}
      </h3>

      {/* Progress Bar */}
      <div className="relative w-full h-20">
        <div className="absolute top-[36px] left-0 w-full h-1 bg-gray-200 rounded-full z-0" />

        <div className="absolute top-[34px] left-0 w-full h-2 z-10 flex justify-between items-center px-[6px]">
          {steps.map((step, i) => {
            if (i === steps.length - 1) return null;
            const nextActive = steps[i + 1].active;
            return (
              <div key={i} className="w-full h-full relative">
                <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id={`glow-line-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={step.active ? '#00ffff' : '#ccc'} />
                      <stop offset="100%" stopColor={nextActive ? '#00ffff' : '#ccc'} />
                    </linearGradient>
                  </defs>
                  <line
                    x1="0"
                    y1="5"
                    x2="100"
                    y2="5"
                    stroke={`url(#glow-line-${i})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            );
          })}
        </div>

        <div className="absolute top-[34px] left-0 w-full h-2 rounded-full overflow-hidden z-20">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
          />
        </div>

        {!emailed && (
          <motion.div
            className="absolute top-[24px] w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_15px_5px_rgba(0,255,255,0.6)] animate-pulse z-30"
            animate={{ left: `calc(${progressPercent}% - 12px)` }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        )}

        <div className="absolute top-4 left-0 w-full flex justify-between z-40">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center w-1/4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all shadow-md ${
                  step.active
                    ? 'bg-green-500 border-green-300'
                    : step.failed
                    ? 'bg-red-500 border-red-300'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                {step.active ? (
                  <CheckCircle className="text-white w-5 h-5" />
                ) : step.failed ? (
                  <XCircle className="text-white w-5 h-5" />
                ) : (
                  <step.icon className="text-white w-5 h-5" />
                )}
              </div>
              <div className="mt-2 text-xs sm:text-sm text-center font-semibold text-gray-700">{step.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="text-center mt-4">
        {steps
          .slice()
          .reverse()
          .find((step) => step.active || step.failed) && (
          <motion.div
            key={steps.findIndex((s) => s.active || s.failed)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0 }}
            className="inline-block bg-white/30 px-6 py-3 rounded-xl border border-white/40 backdrop-blur-md shadow-xl"
          >
            <div className="text-sm sm:text-base text-gray-900 italic tracking-wide font-medium">
              {
                steps
                  .slice()
                  .reverse()
                  .find((step) => step.active || step.failed)?.details
              }
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
