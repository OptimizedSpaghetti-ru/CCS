import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, MessageSquare, Megaphone, Calendar, Trash2, CheckCircle, Settings } from 'lucide-react';
import { c, g, fonts, shadow } from '../theme';
import { TopBar } from '../components/TopBar';

const tabs = ['All', 'Messages', 'Announcements', 'Events'];

interface Notif {
  id: number;
  type: 'message' | 'announcement' | 'event';
  title: string;
  body: string;
  time: string;
  unread: boolean;
  day: string;
  path?: string;
}

const initialNotifs: Notif[] = [
  { id: 1, type: 'message', title: 'Prof. Santos sent you a message', body: 'Please check the updated capstone requirements on the LMS.', time: '9:41 AM', unread: true, day: 'Today', path: '/app/messages/1' },
  { id: 2, type: 'announcement', title: 'Enrollment Period Open', body: '2nd Semester enrollment begins March 3–10. Log in to the student portal.', time: '8:00 AM', unread: true, day: 'Today' },
  { id: 3, type: 'message', title: 'BSCS 3-A Group: 8 new messages', body: 'Alden: Anyone done with the ER diagram? Need help 😭', time: '9:15 AM', unread: true, day: 'Today', path: '/app/messages/group/1' },
  { id: 4, type: 'event', title: 'Capstone Defense Schedule', body: 'Your final defense is scheduled for March 15, 2:00 PM at Function Hall.', time: '7:30 AM', unread: false, day: 'Today' },
  { id: 5, type: 'announcement', title: 'Lab 302 Maintenance Notice', body: 'Computer Lab 302 will be unavailable Feb 25–26 for maintenance.', time: '3:00 PM', unread: false, day: 'Yesterday' },
  { id: 6, type: 'message', title: 'Prof. Bautista: Defense Form Reminder', body: 'Reminder: Submit your final defense form by Friday EOD.', time: '2:15 PM', unread: false, day: 'Yesterday' },
  { id: 7, type: 'event', title: 'CCS Student Council Meeting', body: 'Meeting this Friday, 4 PM at the Function Hall. Attendance required.', time: '10:00 AM', unread: false, day: 'Yesterday' },
  { id: 8, type: 'announcement', title: 'System Maintenance Alert', body: 'CCS Connect will undergo maintenance Sunday 12 AM–3 AM.', time: '5:00 PM', unread: false, day: 'Monday' },
];

const typeConfig = {
  message: { icon: MessageSquare, color: c.baseRed, label: 'Message' },
  announcement: { icon: Megaphone, color: '#D97706', label: 'Announcement' },
  event: { icon: Calendar, color: '#1D4ED8', label: 'Event' },
};

function NotifItem({ notif, onDismiss }: { notif: Notif; onDismiss: (id: number) => void }) {
  const navigate = useNavigate();
  const conf = typeConfig[notif.type];
  const Icon = conf.icon;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 16px',
        background: notif.unread ? c.cream : c.white,
        borderBottom: '1px solid rgba(139,115,85,0.08)',
        cursor: 'pointer',
        position: 'relative',
        borderLeft: notif.unread ? `3px solid ${conf.color}` : '3px solid transparent',
      }}
      onClick={() => { if (notif.path) navigate(notif.path); }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${conf.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} color={conf.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: fonts.ui, fontSize: 13, fontWeight: notif.unread ? 700 : 500, color: c.darkBrown, margin: '0 0 3px', lineHeight: 1.3 }}>{notif.title}</p>
        <p style={{ fontFamily: fonts.ui, fontSize: 12, color: c.warmGray, margin: '0 0 4px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.body}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: `${conf.color}15`, color: conf.color,
            borderRadius: 20, padding: '1px 7px',
            fontFamily: fonts.ui, fontSize: 10, fontWeight: 600,
          }}>
            {conf.label}
          </span>
          <span style={{ fontFamily: fonts.mono, fontSize: 10, color: c.warmGray }}>{notif.time}</span>
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDismiss(notif.id); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.warmGrayLight, padding: 4, flexShrink: 0 }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [notifs, setNotifs] = useState(initialNotifs);

  const filtered = notifs.filter(n =>
    activeTab === 'All' ? true :
    activeTab === 'Messages' ? n.type === 'message' :
    activeTab === 'Announcements' ? n.type === 'announcement' :
    n.type === 'event'
  );

  const grouped = filtered.reduce((acc, n) => {
    if (!acc[n.day]) acc[n.day] = [];
    acc[n.day].push(n);
    return acc;
  }, {} as Record<string, Notif[]>);

  const dismiss = (id: number) => setNotifs(prev => prev.filter(n => n.id !== id));
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar
        title="Notifications"
        rightContent={
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={markAllRead}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: c.cream, opacity: 0.85 }}
            >
              <CheckCircle size={14} />
              <span style={{ fontFamily: fonts.ui, fontSize: 12 }}>Read all</span>
            </button>
            <button
              onClick={() => navigate('/app/notifications/settings')}
              style={{ background: 'rgba(255,240,196,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Settings size={15} color={c.cream} />
            </button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div style={{ background: c.darkestRed, padding: '8px 14px 10px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? g.button : 'rgba(255,240,196,0.12)',
                border: activeTab === tab ? 'none' : '1px solid rgba(255,240,196,0.15)',
                borderRadius: 20,
                padding: '5px 14px',
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === tab ? c.cream : `${c.cream}70`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div style={{ flex: 1, overflowY: 'auto', background: c.creamLight }}>
        {Object.entries(grouped).length === 0 ? (
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <Bell size={48} color={c.warmGray} style={{ opacity: 0.4, marginBottom: 16 }} />
            <h3 style={{ fontFamily: fonts.display, fontSize: 18, color: c.darkBrown, margin: '0 0 8px' }}>You're all caught up!</h3>
            <p style={{ fontFamily: fonts.ui, fontSize: 14, color: c.warmGray, margin: 0 }}>No notifications right now.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, dayNotifs]) => (
            <div key={day}>
              <div style={{ padding: '10px 16px 6px', background: c.creamLight }}>
                <p style={{ fontFamily: fonts.ui, fontSize: 11, fontWeight: 700, color: c.warmGray, margin: 0, textTransform: 'uppercase', letterSpacing: 0.8 }}>{day}</p>
              </div>
              {dayNotifs.map(n => (
                <NotifItem key={n.id} notif={n} onDismiss={dismiss} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
