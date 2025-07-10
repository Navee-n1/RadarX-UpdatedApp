import React from 'react';

const avatarColors = [
  'from-purple-500 to-pink-500',
  'from-sky-500 to-blue-500',
  'from-green-500 to-emerald-500',
  'from-yellow-400 to-orange-500',
  'from-indigo-500 to-cyan-500',
  'from-rose-500 to-fuchsia-500',
  'from-lime-500 to-teal-500',
];

const skillColorClasses = [
  'bg-pink-100 text-pink-800',
  'bg-purple-100 text-purple-800',
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-orange-100 text-orange-800',
  'bg-indigo-100 text-indigo-800',
];

function getSkillColor(skill) {
  let hash = 0;
  for (let i = 0; i < skill.length; i++) {
    hash = skill.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % skillColorClasses.length;
  return skillColorClasses[index];
}
function getStatusColor(status) {
  const map = {
    Available: 'bg-green-100 text-green-800',    // Positive, ready
    Allocated: 'bg-red-100 text-red-800',     // Busy, assigned
    'Rolling Off': 'bg-yellow-100 text-yellow-800', // Transition phase, caution
    Training: 'bg-purple-100 text-purple-800',  // Growth, learning
    Released: 'bg-sky-100 text-blue-800',        // Not available
  };
  return map[status] || 'bg-gray-100 text-gray-700'; // Default neutral
}

function getRoleColor(role) {
  const map = {
    Trainee: 'bg-yellow-100 text-yellow-800',                   // Learning phase
    'Associate Software Engineer': 'bg-green-100 text-green-800',
    'Software Engineer': 'bg-green-200 text-green-900',
    'Senior Software Engineer': 'bg-emerald-200 text-emerald-900',
    'Lead Engineer': 'bg-teal-200 text-teal-900',
    'Technical Lead': 'bg-cyan-200 text-cyan-900',
    'Module Lead': 'bg-blue-200 text-blue-900',
    'Technical Specialist': 'bg-indigo-200 text-indigo-900',
    'Senior Technical Specialist': 'bg-violet-200 text-violet-900',
    Architect: 'bg-purple-200 text-purple-900',
    'Senior Architect': 'bg-fuchsia-200 text-fuchsia-900',
    'Technical Architect': 'bg-pink-200 text-pink-900',
    'Senior Technical Architect': 'bg-rose-200 text-rose-900',
    'Delivery Lead': 'bg-orange-200 text-orange-900',
    'Project Manager': 'bg-red-200 text-red-900',
    'Senior Project Manager': 'bg-amber-200 text-amber-900',
    'Program Manager': 'bg-yellow-300 text-yellow-900',
  };
  return map[role] || 'bg-gray-100 text-gray-700';
}

export default function SearchResultsCard({ results, viewMode = 'grid' }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-2">🧑‍💻</div>
        <h3 className="text-xl font-semibold text-gray-800">No consultants found</h3>
        <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6' : 'space-y-4 mt-6'}>
      {results.map((p, i) => {
        const avatarColor = avatarColors[i % avatarColors.length];
        const skills = (p.skills?.split(',') || []).map((s) => s.trim());

        return (
          <div
            key={i}
            className={`p-6 rounded-2xl border border-gray-200 shadow-lg backdrop-blur-xl bg-white/50 transition-all ${
              viewMode === 'grid' ? 'hover:scale-[1.02]' : ''
            }`}
          >
            {/* Header Section */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-r ${avatarColor} text-white flex items-center justify-center text-lg font-bold`}
                >
                  {p.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{p.name || 'Unnamed'}</h3>
                  {p.emp_id && (
                    <p className="text-xs font-semibold text-gray-500 tracking-wide">{p.emp_id}</p>
                  )}
                  <p className="text-sm text-gray-600">{p.vertical || 'Others'}</p>
                </div>
              </div>

              {/* Experience + Status */}
              <div className="flex flex-col items-end space-y-1">
              {p.status && (
  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full shadow-sm ${getStatusColor(p.status)}`}>
    {p.status}
  </span>
)}

                <span className="text-sm text-gray-700 font-medium">
                  {p.experience_years != null ? `${p.experience_years} yrs` : 'Experience N/A'}
                </span>
              </div>
            </div>

            {/* Role Displayed Below */}
            {p.role && (
  <div className="mt-3">
    <p className="text-sm font-medium text-gray-700 mb-1">Role</p>
    <div className="flex flex-wrap gap-2">
      <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getRoleColor(p.role)}`}>
        {p.role}
      </span>
    </div>
  </div>
)}

            {/* Skills Section */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Skills</p>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getSkillColor(skill)}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
