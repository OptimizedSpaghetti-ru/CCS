import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Edit, ChevronRight } from 'lucide-react';
import { c, g, fonts, shadow } from '../theme';
import { TopBar } from '../components/TopBar';

const filters = ['All', 'Students', 'Faculty', 'Groups'];

const conversations = [
  { id: '1', name: 'Prof. Maria Santos', role: 'faculty', preview: 'Please check the updated capstone requirements I uploaded...', time: '9:41 AM', unread: 2, online: true, initials: 'MS', color: c.darkRed },
  { id: '2', name: 'BSCS 3-A Group Chat', role: 'group', preview: 'Alden: Anyone done with the ER diagram? Need help 😭', time: '9:15 AM', unread: 8, online: false, initials: 'GR', color: '#1D4ED8' },
  { id: '3', name: 'Carlo Reyes', role: 'student', preview: 'Tara na, kumain na 😄', time: '8:50 AM', unread: 0, online: true, initials: 'CR', color: '#059669' },
  { id: '4', name: 'Prof. Jose Bautista', role: 'faculty', preview: 'Reminder: Submit your final defense form by Friday.', time: 'Yesterday', unread: 1, online: false, initials: 'JB', color: c.darkestRed },
  { id: '5', name: 'CCS Department', role: 'group', preview: '📢 Enrollment schedule is now posted. Check the board.', time: 'Yesterday', unread: 0, online: false, initials: 'CS', color: c.baseRed },
  { id: '6', name: 'Maria Kristel Lim', role: 'student', preview: 'Thanks! I got it na. Salamat sa tulong 🙏', time: 'Mon', unread: 0, online: false, initials: 'ML', color: '#7C3AED' },
  { id: '7', name: 'IT Support Desk', role: 'group', preview: 'Your ticket #0234 has been resolved. Rate your experience.', time: 'Mon', unread: 0, online: true, initials: 'IT', color: '#D97706' },
  { id: '8', name: 'Prof. Ana Cruz', role: 'faculty', preview: 'Class is cancelled tomorrow. Async mode.', time: 'Sun', unread: 0, online: false, initials: 'AC', color: c.warmGray },
];

function Avatar({ initials, color, size = 44, online }: { initials: string; color: string; size?: number; online?: boolean }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: color,
        border: `2px solid ${c.baseRed}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: fonts.display, fontSize: size * 0.3, fontWeight: 700, color: c.white }}>
          {initials}
        </span>
      </div>
      {online && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: '#22C55E', border: `2px solid ${c.white}`,
        }} />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'group') return null;
  const isF = role === 'faculty';
  return (
    <span style={{
      fontFamily: fonts.ui,
      fontSize: 9,
      fontWeight: 600,
      background: isF ? `${c.baseRed}20` : '#3B528020',
      color: isF ? c.baseRed : '#3B5280',
      borderRadius: 20,
      padding: '1px 5px',
      marginLeft: 4,
    }}>
      {isF ? '📘 Faculty' : '🎓 Student'}
    </span>
  );
}

export function Messages() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => {
    const roleMatch = filter === 'All' ? true :
      filter === 'Students' ? c.role === 'student' :
      filter === 'Faculty' ? c.role === 'faculty' :
      c.role === 'group';
    const searchMatch = search === '' || c.name.toLowerCase().includes(search.toLowerCase());
    return roleMatch && searchMatch;
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <TopBar
        title="Messages"
        rightContent={
          <button
            onClick={() => navigate('/app/messages/compose')}
            style={{
              background: g.button,
              border: 'none',
              borderRadius: 10,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: shadow.button,
            }}
          >
            <Edit size={16} color={c.cream} />
          </button>
        }
      />

      {/* Search */}
      <div style={{ padding: '10px 16px 0', background: c.darkestRed }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: c.white, borderRadius: 24,
          padding: '0 14px', height: 40,
          boxShadow: shadow.card,
        }}>
          <Search size={16} color={c.warmGray} />
          <input
            placeholder="Search conversations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown,
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 0 12px', overflowX: 'auto' }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? g.button : 'rgba(255,240,196,0.15)',
                border: filter === f ? 'none' : '1px solid rgba(255,240,196,0.2)',
                borderRadius: 20,
                padding: '5px 14px',
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 600,
                color: filter === f ? c.cream : c.warmGrayLight,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: filter === f ? shadow.button : 'none',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto', background: c.creamLight }}>
        {filtered.map((conv, i) => (
          <button
            key={conv.id}
            onClick={() => navigate(`/app/messages/${conv.id}`)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: conv.unread > 0 ? c.cream : c.white,
              border: 'none',
              borderBottom: `1px solid rgba(139,115,85,0.1)`,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Avatar initials={conv.initials} color={conv.color} online={conv.online} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <span style={{
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  fontWeight: conv.unread > 0 ? 700 : 500,
                  color: c.darkBrown,
                }}>
                  {conv.name}
                </span>
                <RoleBadge role={conv.role} />
              </div>
              <p style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                color: conv.unread > 0 ? c.darkBrown : c.warmGray,
                fontWeight: conv.unread > 0 ? 500 : 400,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {conv.preview}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 10, color: c.warmGray }}>{conv.time}</span>
              {conv.unread > 0 && (
                <div style={{
                  background: c.baseRed,
                  borderRadius: '50%',
                  width: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: fonts.ui, fontSize: 10, fontWeight: 700, color: c.white }}>{conv.unread}</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/app/messages/compose')}
        style={{
          position: 'absolute',
          bottom: 90,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: g.button,
          border: 'none',
          boxShadow: shadow.button,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 20,
        }}
      >
        <Edit size={22} color={c.cream} />
      </button>
    </div>
  );
}