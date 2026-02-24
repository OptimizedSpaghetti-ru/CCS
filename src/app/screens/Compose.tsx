import { useState } from 'react';
import { useNavigate } from 'react-router';
import { X, Search, Paperclip, Image, Calendar, Send } from 'lucide-react';
import { c, g, fonts, shadow } from '../theme';

const suggestions = [
  { id: '1', name: 'Prof. Maria Santos', role: 'faculty', initials: 'MS', color: c.darkRed },
  { id: '2', name: 'BSCS 3-A Group', role: 'group', initials: 'GR', color: '#1D4ED8' },
  { id: '3', name: 'Carlo Reyes', role: 'student', initials: 'CR', color: '#059669' },
  { id: '4', name: 'Prof. Jose Bautista', role: 'faculty', initials: 'JB', color: c.darkestRed },
  { id: '5', name: 'Maria Kristel Lim', role: 'student', initials: 'ML', color: '#7C3AED' },
  { id: '6', name: 'IT Support Desk', role: 'group', initials: 'IT', color: '#D97706' },
];

export function Compose() {
  const navigate = useNavigate();
  const [toSearch, setToSearch] = useState('');
  const [recipients, setRecipients] = useState<typeof suggestions>([]);
  const [body, setBody] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(s =>
    s.name.toLowerCase().includes(toSearch.toLowerCase()) &&
    !recipients.find(r => r.id === s.id)
  );

  const addRecipient = (person: typeof suggestions[0]) => {
    setRecipients(prev => [...prev, person]);
    setToSearch('');
    setShowSuggestions(false);
  };

  const removeRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: c.white }}>
      {/* Header */}
      <div style={{ background: g.header, padding: '12px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 700, color: c.cream, margin: 0 }}>
          New Message
        </h1>
        <button
          onClick={() => navigate('/app/messages')}
          style={{ background: 'rgba(255,240,196,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <X size={18} color={c.cream} />
        </button>
      </div>

      {/* To: field */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(139,115,85,0.12)`, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, minHeight: 42 }}>
          <span style={{ fontFamily: fonts.ui, fontSize: 13, color: c.warmGray, fontWeight: 600, flexShrink: 0 }}>To:</span>

          {recipients.map(r => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: `${c.baseRed}18`,
              border: `1px solid ${c.baseRed}30`,
              borderRadius: 20,
              padding: '3px 8px 3px 4px',
            }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: fonts.ui, fontSize: 9, fontWeight: 700, color: c.white }}>{r.initials}</span>
              </div>
              <span style={{ fontFamily: fonts.ui, fontSize: 12, fontWeight: 500, color: c.darkBrown }}>{r.name.split(' ')[0]}</span>
              <button onClick={() => removeRecipient(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: c.warmGray }}>
                <X size={12} />
              </button>
            </div>
          ))}

          <input
            value={toSearch}
            onChange={e => { setToSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={recipients.length === 0 ? 'Search students or faculty…' : ''}
            style={{
              flex: 1, minWidth: 120, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown,
            }}
          />
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: c.white,
            boxShadow: shadow.cardHover,
            borderRadius: '0 0 14px 14px',
            zIndex: 50,
            overflow: 'hidden',
          }}>
            {filteredSuggestions.map(s => (
              <button
                key={s.id}
                onClick={() => addRecipient(s)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', background: 'none', border: 'none',
                  borderBottom: `1px solid rgba(139,115,85,0.08)`, cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${c.baseRed}` }}>
                  <span style={{ fontFamily: fonts.ui, fontSize: 12, fontWeight: 700, color: c.white }}>{s.initials}</span>
                </div>
                <div>
                  <p style={{ fontFamily: fonts.ui, fontSize: 13, fontWeight: 600, color: c.darkBrown, margin: 0 }}>{s.name}</p>
                  <p style={{ fontFamily: fonts.ui, fontSize: 11, color: c.warmGray, margin: 0 }}>
                    {s.role === 'faculty' ? '📘 Faculty' : s.role === 'group' ? '👥 Group' : '🎓 Student'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Subject */}
      <div style={{ padding: '0 16px', borderBottom: `1px solid rgba(139,115,85,0.12)` }}>
        <input
          placeholder="Subject (optional)"
          style={{
            width: '100%', height: 44, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Message body */}
      <div style={{ flex: 1, padding: '12px 16px', overflow: 'hidden' }}>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your message…"
          style={{
            width: '100%', height: '100%',
            background: c.cream,
            border: 'none', borderRadius: 12,
            padding: '14px', outline: 'none',
            fontFamily: fonts.ui, fontSize: 14, color: c.darkBrown,
            resize: 'none', lineHeight: 1.6,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Bottom actions */}
      <div style={{ padding: '10px 16px 16px', borderTop: `1px solid rgba(139,115,85,0.12)`, flexShrink: 0 }}>
        {/* Attachment row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { icon: <Paperclip size={16} />, label: 'File' },
            { icon: <Image size={16} />, label: 'Image' },
            { icon: <Calendar size={16} />, label: 'Schedule' },
          ].map(a => (
            <button key={a.label} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: c.cream, border: `1px solid rgba(139,115,85,0.2)`,
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              fontFamily: fonts.ui, fontSize: 12, color: c.warmGray,
            }}>
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>

        {/* Send button */}
        <button
          onClick={() => navigate('/app/messages')}
          style={{
            width: '100%', height: 52,
            background: recipients.length > 0 && body.trim() ? g.button : 'rgba(139,115,85,0.2)',
            border: 'none', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: recipients.length > 0 && body.trim() ? 'pointer' : 'default',
            fontFamily: fonts.ui, fontSize: 15, fontWeight: 600,
            color: recipients.length > 0 && body.trim() ? c.cream : c.warmGray,
            boxShadow: recipients.length > 0 && body.trim() ? shadow.button : 'none',
            transition: 'all 0.2s',
          }}
        >
          <Send size={18} />
          Send Message
        </button>
      </div>
    </div>
  );
}
