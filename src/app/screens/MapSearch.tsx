import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, MapPin, Clock, X } from 'lucide-react';
import { c, g, fonts, shadow } from '../theme';

const allLocations = [
  { id: '1', name: 'Main Library', category: 'Library', floor: 'Ground Floor', building: 'Academic Bldg', distance: '120m', icon: '📚', color: '#7C3AED' },
  { id: '2', name: 'Computer Lab 204', category: 'Labs', floor: '2nd Floor', building: 'ICT Building', distance: '85m', icon: '💻', color: '#059669' },
  { id: '3', name: 'CCS Department Office', category: 'Offices', floor: '3rd Floor', building: 'Tech Building', distance: '200m', icon: '🏢', color: c.baseRed },
  { id: '4', name: 'BSCS 3-A Classroom', category: 'Classrooms', floor: '3rd Floor', building: 'Tech Building', distance: '195m', icon: '🏫', color: '#D97706' },
  { id: '5', name: 'Campus Canteen', category: 'Canteen', floor: 'Ground Floor', building: 'Main Building', distance: '60m', icon: '🍽️', color: '#EA4335' },
  { id: '6', name: 'Computer Lab 302', category: 'Labs', floor: '3rd Floor', building: 'ICT Building', distance: '90m', icon: '🖥️', color: '#059669' },
  { id: '7', name: 'Dean\'s Office', category: 'Offices', floor: '4th Floor', building: 'Admin Building', distance: '310m', icon: '🏛️', color: '#374151' },
  { id: '8', name: 'Guidance Office', category: 'Offices', floor: '2nd Floor', building: 'Main Building', distance: '70m', icon: '🤝', color: '#7C3AED' },
  { id: '9', name: 'Multimedia Lab', category: 'Labs', floor: '2nd Floor', building: 'Tech Building', distance: '180m', icon: '🎬', color: c.darkRed },
  { id: '10', name: 'Conference Room A', category: 'Classrooms', floor: '4th Floor', building: 'Tech Building', distance: '220m', icon: '🎓', color: '#D97706' },
];

const recent = ['Main Library', 'Computer Lab 204', 'CCS Office'];

export function MapSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const results = query.length > 0
    ? allLocations.filter(l =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.category.toLowerCase().includes(query.toLowerCase()) ||
        l.building.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: c.creamLight }}>
      {/* Search Header */}
      <div style={{ background: g.header, padding: '12px 14px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/app/map')}
            style={{ background: 'rgba(255,240,196,0.15)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={c.cream} />
          </button>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            background: c.white, borderRadius: 12,
            padding: '0 12px', height: 42,
          }}>
            <Search size={16} color={c.warmGray} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search buildings, rooms, offices…"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown,
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.warmGray }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {query === '' ? (
          /* Recent Searches */
          <div style={{ padding: '16px' }}>
            <p style={{ fontFamily: fonts.ui, fontSize: 11, fontWeight: 600, color: c.warmGray, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 10px' }}>
              Recent Searches
            </p>
            {recent.map(r => (
              <button
                key={r}
                onClick={() => setQuery(r)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  background: c.white, border: 'none', borderRadius: 12,
                  padding: '12px 14px', marginBottom: 8,
                  cursor: 'pointer', textAlign: 'left',
                  boxShadow: shadow.card,
                }}
              >
                <Clock size={16} color={c.warmGray} />
                <span style={{ fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown }}>{r}</span>
                <div style={{ marginLeft: 'auto' }}>
                  <X size={14} color={c.warmGrayLight} />
                </div>
              </button>
            ))}

            {/* Category Quick Access */}
            <p style={{ fontFamily: fonts.ui, fontSize: 11, fontWeight: 600, color: c.warmGray, textTransform: 'uppercase', letterSpacing: 0.8, margin: '16px 0 10px' }}>
              Browse by Category
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Classrooms', icon: '🏫', count: 24, color: '#D97706' },
                { label: 'Labs', icon: '💻', count: 12, color: '#059669' },
                { label: 'Offices', icon: '🏢', count: 18, color: c.baseRed },
                { label: 'Canteen', icon: '🍽️', count: 3, color: '#EA4335' },
                { label: 'Library', icon: '📚', count: 2, color: '#7C3AED' },
                { label: 'Facilities', icon: '🏛️', count: 8, color: '#374151' },
              ].map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setQuery(cat.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: c.white, border: 'none', borderRadius: 12,
                    padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                    boxShadow: shadow.card,
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: fonts.ui, fontSize: 12, fontWeight: 600, color: c.darkBrown, margin: 0 }}>{cat.label}</p>
                    <p style={{ fontFamily: fonts.ui, fontSize: 10, color: c.warmGray, margin: 0 }}>{cat.count} locations</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : results.length > 0 ? (
          /* Search Results */
          <div style={{ padding: '12px 16px' }}>
            <p style={{ fontFamily: fonts.ui, fontSize: 12, color: c.warmGray, margin: '0 0 10px' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} for "<strong style={{ color: c.darkBrown }}>{query}</strong>"
            </p>
            {results.map(loc => (
              <button
                key={loc.id}
                onClick={() => navigate(`/app/map/location/${loc.id}`)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  background: c.white, border: 'none', borderRadius: 14,
                  padding: '12px 14px', marginBottom: 10,
                  cursor: 'pointer', textAlign: 'left',
                  boxShadow: shadow.card,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${loc.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 22 }}>{loc.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: fonts.ui, fontSize: 14, fontWeight: 600, color: c.darkBrown, margin: 0 }}>{loc.name}</p>
                  <p style={{ fontFamily: fonts.ui, fontSize: 12, color: c.warmGray, margin: '2px 0 0' }}>{loc.floor} · {loc.building}</p>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                    <MapPin size={12} color={c.baseRed} />
                    <span style={{ fontFamily: fonts.mono, fontSize: 11, color: c.baseRed }}>{loc.distance}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/app/map/location/${loc.id}`); }}
                    style={{
                      marginTop: 4,
                      background: 'none',
                      border: `1.5px solid ${c.baseRed}`,
                      borderRadius: 20,
                      padding: '2px 8px',
                      fontFamily: fonts.ui,
                      fontSize: 10,
                      color: c.baseRed,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Directions
                  </button>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* No Results */
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            <h3 style={{ fontFamily: fonts.display, fontSize: 18, color: c.darkBrown, margin: '0 0 8px' }}>Location not found</h3>
            <p style={{ fontFamily: fonts.ui, fontSize: 14, color: c.warmGray, margin: 0 }}>
              Try a different search term or browse by category
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
