import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const ARDashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const navItems = [
    { label: "Upload JD", path: "/upload-jd" },
    { label: "Resume → JD", path: "/resume-to-jd" },
    { label: "One-to-One", path: "/one-to-one-match" }
  ];

  return (
     <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-white via-gray-50 to-purple-50 text-gray-900 font-sans">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-6 py-4 font-sans flex justify-between items-center">
       <h1 className="text-3xl font-bold tracking-tight text-gray-800">
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red to-red-400">Radar</span>
          <span className="bg-gradient-to-r from-red-100 to-red-600 text-white shadow px-1 ">X</span>
          <span className="text-sm text-grey-200 font-medium ml-2">| AR Requestor</span>
</h1>

     <nav className="flex gap-6 items-center">
  {navItems.map((item) => (
    <Link
      key={item.path}
      to={item.path}
      className={`relative group text-sm font-semibold px-2 py-1 transition-all duration-200 ${
        location.pathname === item.path
          ? 'text-purple-700'
          : 'text-gray-600 hover:text-purple-700'
      }`}
    >
      {item.label}

      {/* Underline Animation */}
      <span
        className={`absolute left-0 bottom-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300
          ${location.pathname === item.path
            ? 'w-full'
            : 'w-0 group-hover:w-full'}
        `}
      />
    </Link>
  ))}

  <button
    onClick={handleLogout}
    className="text-sm px-4 py-2 text-gray-800 border border-gray-300 rounded-lg hover:bg-red-100 transition"
  >
    Logout
  </button>
</nav>

      </header>

      {/* Main content */}
      <main className="flex-grow px-6 py-10 max-w-screen-xl mx-auto w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white text-center py-3 text-sm text-gray-500">
        © 2025 RadarX. All rights reserved by House of Starks.
      </footer>
    </div>
  );
};

export default ARDashboardLayout;
