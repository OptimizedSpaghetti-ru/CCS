import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, MapPin, Clock, Navigation, Share2, Footprints, ChevronRight } from 'lucide-react';
import { c, g, fonts, shadow } from '../theme';

const locationData: Record<string, {
  name: string; category: string; icon: string; color: string;
  floor: string; building: string; address: string; distance: string; walkTime: string;
  hours: string; description: string;
  directions: { step: number; instruction: string; distance: string }[];
}> = {
  '1': {
    name: 'Main Library', category: 'Library', icon: '📚', color: '#7C3AED',
    floor: 'Ground Floor', building: 'Academic Building', address: 'OLFU Valenzuela Campus',
    distance: '120m', walkTime: '~2 min walk',
    hours: 'Mon–Fri: 7:30 AM – 8:00 PM · Sat: 8:00 AM – 5:00 PM',
    description: 'The main library provides access to academic resources, e-books, journals, and quiet study spaces for students and faculty.',
    directions: [
      { step: 1, instruction: 'Head south toward the Main Hallway', distance: '15m' },
      { step: 2, instruction: 'Turn right at the Academic Building entrance', distance: '40m' },
      { step: 3, instruction: 'Continue straight past the guard post', distance: '50m' },
      { step: 4, instruction: 'Main Library is on your left at Ground Floor', distance: '15m' },
    ],
  },
  '2': {
    name: 'Computer Lab 204', category: 'Labs', icon: '💻', color: '#059669',
    floor: '2nd Floor', building: 'ICT Building', address: 'OLFU Valenzuela Campus',
    distance: '85m', walkTime: '~1 min walk',
    hours: 'Mon–Sat: 7:00 AM – 9:00 PM (Schedule-based)',
    description: 'Computer Lab 204 is equipped with 40 desktop computers running the latest software for programming, design, and data analysis courses.',
    directions: [
      { step: 1, instruction: 'Head north toward the ICT Building', distance: '40m' },
      { step: 2, instruction: 'Enter through the main ICT Building entrance', distance: '20m' },
      { step: 3, instruction: 'Take the stairs or elevator to 2nd Floor', distance: '15m' },
      { step: 4, instruction: 'Computer Lab 204 is at the end of the hallway', distance: '10m' },
    ],
  },
  '3': {
    name: 'CCS Department Office', category: 'Offices', icon: '🏢', color: c.baseRed,
    floor: '3rd Floor', building: 'Technology Building', address: 'OLFU Valenzuela Campus',
    distance: '200m', walkTime: '~3 min walk',
    hours: 'Mon–Fri: 8:00 AM – 5:00 PM',
    description: 'The College of Computer Studies department office handles academic concerns, enrollment inquiries, and program-related matters.',
    directions: [
      { step: 1, instruction: 'Walk east toward the Technology Building', distance: '80m' },
      { step: 2, instruction: 'Enter Technology Building via main entrance', distance: '30m' },
      { step: 3, instruction: 'Take the stairs to 3rd Floor', distance: '60m' },
      { step: 4, instruction: 'CCS Office is Room 301, first door on the left', distance: '30m' },
    ],
  },
};

const defaultLocation = locationData['1'];

function RouteMap({ color }: { color: string }) {
  return (
    <svg width="100%" height="180" viewBox="0 0 390 180" fill="none">
      <rect width="390" height="180" fill="#E8F5E9"/>
      {/* Streets */}
      <rect x="0" y="75" width="390" height="20" fill="#F5F5F5" opacity="0.9"/>
      <rect x="160" y="0" width="20" height="180" fill="#F5F5F5" opacity="0.9"/>
      <rect x="270" y="0" width="16" height="180" fill="#F5F5F5" opacity="0.7"/>
      {/* Buildings */}
      <rect x="10" y="10" width="140" height="60" rx="5" fill="#D1D5DB" opacity="0.7"/>
      <rect x="190" y="10" width="70" height="60" rx="5" fill="#D1D5DB" opacity="0.7"/>
      <rect x="10" y="100" width="140" height="70" rx="5" fill="#D1D5DB" opacity="0.7"/>
      <rect x="190" y="100" width="70" height="70" rx="5" fill={color} opacity="0.7"/>
      <rect x="295" y="10" width="85" height="60" rx="5" fill="#D1D5DB" opacity="0.7"/>
      <rect x="295" y="100" width="85" height="70" rx="5" fill="#D1D5DB" opacity="0.7"/>
      {/* Route */}
      <path d="M200 95 L200 75 L200 75 L190 75 L160 75 L160 140 L195 140" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 4"/>
      {/* Start (user) */}
      <circle cx="200" cy="95" r="8" fill="#1D4ED8"/>
      <circle cx="200" cy="95" r="4" fill="white"/>
      <circle cx="200" cy="95" r="14" fill="#1D4ED8" opacity="0.2"/>
      {/* Destination pin */}
      <path d="M195 155 C195 148 188 143 188 135 C188 128 191 122 195 120 C199 122 202 128 202 135 C202 143 195 148 195 155" fill={color} stroke="white" strokeWidth="2"/>
      <circle cx="195" cy="133" r="4" fill="white"/>
    </svg>
  );
}

export function LocationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const loc = locationData[id || '1'] || defaultLocation;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Mini Map */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <RouteMap color={loc.color} />
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 12, left: 14,
            background: c.white, border: 'none', borderRadius: 10,
            width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: shadow.card,
          }}
        >
          <ArrowLeft size={18} color={c.darkBrown} />
        </button>
      </div>

      {/* Bottom Sheet Content */}
      <div style={{ flex: 1, background: c.white, borderRadius: '24px 24px 0 0', overflowY: 'auto', marginTop: -20, padding: '16px 20px 20px' }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(139,115,85,0.25)', margin: '0 auto 16px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${loc.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 24 }}>{loc.icon}</span>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 700, color: c.darkBrown, margin: '0 0 4px', lineHeight: 1.2 }}>
              {loc.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                background: `${loc.color}15`, color: loc.color,
                borderRadius: 20, padding: '2px 10px',
                fontFamily: fonts.ui, fontSize: 11, fontWeight: 600,
              }}>
                {loc.icon} {loc.category}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={12} color={c.warmGray} />
                <span style={{ fontFamily: fonts.ui, fontSize: 12, color: c.warmGray }}>{loc.floor} · {loc.building}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Walk time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: c.creamLight, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <Footprints size={18} color={c.baseRed} />
          <div>
            <p style={{ fontFamily: fonts.ui, fontSize: 12, fontWeight: 600, color: c.darkBrown, margin: 0 }}>{loc.walkTime}</p>
            <p style={{ fontFamily: fonts.ui, fontSize: 11, color: c.warmGray, margin: 0 }}>{loc.distance} from your location</p>
          </div>
        </div>

        {/* Hours */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
          <Clock size={16} color={c.warmGray} style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontFamily: fonts.ui, fontSize: 13, color: c.warmGray, margin: 0, lineHeight: 1.5 }}>{loc.hours}</p>
        </div>

        {/* Description */}
        <p style={{ fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown, lineHeight: 1.6, margin: '0 0 16px' }}>{loc.description}</p>

        {/* Action buttons */}
        <button
          style={{
            width: '100%', height: 50,
            background: g.button,
            border: 'none', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: fonts.ui, fontSize: 15, fontWeight: 600, color: c.cream,
            cursor: 'pointer', marginBottom: 10,
            boxShadow: shadow.button,
          }}
        >
          <Navigation size={18} />
          Get Directions
        </button>
        <button
          style={{
            width: '100%', height: 46,
            background: 'transparent',
            border: `2px solid ${c.baseRed}`,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: fonts.ui, fontSize: 15, fontWeight: 600, color: c.baseRed,
            cursor: 'pointer', marginBottom: 16,
          }}
        >
          <Share2 size={18} />
          Share Location
        </button>

        {/* Step by step directions */}
        <p style={{ fontFamily: fonts.ui, fontSize: 12, fontWeight: 700, color: c.warmGray, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 10px' }}>
          Step-by-Step Directions
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {loc.directions.map((dir, i) => (
            <div key={dir.step} style={{ display: 'flex', gap: 12, paddingBottom: i < loc.directions.length - 1 ? 16 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i === 0 ? g.button : i === loc.directions.length - 1 ? loc.color : c.cream,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${i === 0 ? 'transparent' : c.baseRed}`,
                }}>
                  <span style={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, color: i === 0 ? c.cream : c.baseRed }}>{dir.step}</span>
                </div>
                {i < loc.directions.length - 1 && (
                  <div style={{ width: 2, flex: 1, marginTop: 4, background: `${c.baseRed}30`, minHeight: 16 }} />
                )}
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <p style={{ fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown, margin: '0 0 2px', lineHeight: 1.4 }}>{dir.instruction}</p>
                <span style={{ fontFamily: fonts.mono, fontSize: 11, color: c.warmGray }}>{dir.distance}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
