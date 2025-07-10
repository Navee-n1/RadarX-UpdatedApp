import React, { useRef, useState } from 'react';
import { FaFileUpload } from 'react-icons/fa';

export default function UploadSection({ onUploadJD, onUploadResume }) {
  const jdInput = useRef(null);
  const resumeInput = useRef(null);

  const [jdUploaded, setJdUploaded] = useState('');
  const [resumeUploaded, setResumeUploaded] = useState('');

  const handleJDChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUploadJD(file);
      setJdUploaded(file.name);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUploadResume(file);
      setResumeUploaded(file.name);
    }
  };

  return (
    <div className="space-y-6">
      {/* JD Upload */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#141414] p-4 rounded-xl shadow-inner border border-gray-700 gap-4">
        <div className="w-full text-center sm:text-left">
          <label className="bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded cursor-pointer inline-block w-full hover:bg-gray-700 transition">
            📎 Choose JD File
            <input type="file" onChange={handleJDChange} className="hidden" />
          </label>
          {jdUploaded && (
            <p className="text-sm text-green-400 mt-2">✅ {jdUploaded}</p>
          )}
        </div>
        <button
          onClick={() => jdInput.current.click()}
          className="bg-accent text-black py-2 px-5 rounded-lg font-medium flex items-center gap-2 shadow hover:bg-yellow-300 transition"
        >
          <FaFileUpload />
          Upload JD
        </button>
        <input
          ref={jdInput}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleJDChange}
        />
      </div>

      {/* Resume Upload */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#141414] p-4 rounded-xl shadow-inner border border-gray-700 gap-4">
        <div className="w-full text-center sm:text-left">
          <label className="bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded cursor-pointer inline-block w-full hover:bg-gray-700 transition">
            📎 Choose Resume File
            <input type="file" onChange={handleResumeChange} className="hidden" />
          </label>
          {resumeUploaded && (
            <p className="text-sm text-green-400 mt-2">✅ {resumeUploaded}</p>
          )}
        </div>
        <button
          onClick={() => resumeInput.current.click()}
          className="bg-accent text-black py-2 px-5 rounded-lg font-medium flex items-center gap-2 shadow hover:bg-yellow-300 transition"
        >
          <FaFileUpload />
          Upload Resume
        </button>
        <input
          ref={resumeInput}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleResumeChange}
        />
      </div>
    </div>
  );
}
