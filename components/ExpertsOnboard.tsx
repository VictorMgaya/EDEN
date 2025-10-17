'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const ExpertsOnboard = ({ onStart }: { onStart: () => void }) => {
  useSession();
  const [selectedData, setSelectedData] = useState<Record<string, boolean>>({ weather: true, population: true, soil: true, location: true });
  const [expertType, setExpertType] = useState('ai');
  const [selectedExpert, setSelectedExpert] = useState<{ _id?: string; name?: string; email?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Array<{ _id?: string; name?: string; email?: string; bio?: string; skills?: string; location?: string }>>([]);

  useEffect(() => {
    // noop
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;
    const res = await fetch(`/api/experts/search?q=${encodeURIComponent(searchQuery)}`);
    const json = await res.json();
    if (json.success) setResults(json.users || []);
  };

  const handleCreateConversation = async () => {
    // Build data selection payload
    const dataSelection = Object.keys(selectedData).filter(k => selectedData[k]);
    const body = {
      expertId: expertType === 'human' ? selectedExpert?._id : null,
      dataSelection,
      initialMessage: `User requests analysis using: ${dataSelection.join(', ')}`
    };

    const res = await fetch('/api/experts/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    if (json.success) {
      // Redirect to chat
      window.location.href = `/Experts/chat/${json.conversationId}`;
    } else {
      alert('Failed to create conversation: ' + (json.error || 'unknown'));
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Start Expert Analysis</h2>
      <p className="mb-4">Choose which cached data to include in the analysis.</p>
      <div className="flex gap-3 mb-4">
        <label className="inline-flex items-center"><input type="checkbox" checked={selectedData.weather} onChange={() => setSelectedData(s => ({ ...s, weather: !s.weather }))} /> <span className="ml-2">Weather</span></label>
        <label className="inline-flex items-center"><input type="checkbox" checked={selectedData.population} onChange={() => setSelectedData(s => ({ ...s, population: !s.population }))} /> <span className="ml-2">Population</span></label>
        <label className="inline-flex items-center"><input type="checkbox" checked={selectedData.soil} onChange={() => setSelectedData(s => ({ ...s, soil: !s.soil }))} /> <span className="ml-2">Soil</span></label>
        <label className="inline-flex items-center"><input type="checkbox" checked={selectedData.location} onChange={() => setSelectedData(s => ({ ...s, location: !s.location }))} /> <span className="ml-2">Location</span></label>
      </div>

      <div className="mb-4">
        <p className="mb-2">Choose Expert Type</p>
        <div className="flex gap-3">
          <button onClick={() => setExpertType('ai')} className={`px-3 py-2 rounded ${expertType === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>AI Expert</button>
          <button onClick={() => setExpertType('human')} className={`px-3 py-2 rounded ${expertType === 'human' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Human Expert</button>
        </div>
      </div>

      {expertType === 'human' && (
        <div className="mb-4">
          <p className="mb-2">Search human experts</p>
          <div className="flex gap-2">
            <input className="flex-1 p-2 border rounded" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search experts by name or skill" />
            <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white rounded">Search</button>
          </div>
          <div className="mt-3 space-y-2">
            {results.map(r => (
              <div key={r._id ?? r.email} className={`p-2 border rounded ${selectedExpert && selectedExpert._id === r._id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedExpert(r)}>
                <div className="font-semibold">{r.name || r.email}</div>
                <div className="text-sm text-gray-500">{r.bio || r.skills || r.location}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button onClick={() => onStart && onStart()} className="px-3 py-2 border rounded">Back</button>
        <button onClick={handleCreateConversation} className="px-4 py-2 bg-emerald-600 text-white rounded">Start Conversation</button>
      </div>
    </div>
  );
};

export default ExpertsOnboard;
