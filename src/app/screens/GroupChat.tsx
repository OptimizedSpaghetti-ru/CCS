import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Settings, Pin, ThumbsUp, Heart, Eye, Reply, Send, Smile, Paperclip } from 'lucide-react';
import { c, g, fonts, shadow } from '../theme';

const groupMessages = [
  {
    id: 1, from: 'Alden Santos', initials: 'AS', color: '#7C3AED', role: 'student',
    text: 'Hi guys! Anyone done with the ER diagram already? Need help 😭',
    time: '9:00 AM', reactions: { '👍': 3, '❤️': 1, '👀': 2 }, replies: 4,
  },
  {
    id: 2, from: 'Me', initials: 'JC', color: c.darkRed, role: 'student',
    text: 'Done na yung ours! Maraming ganaps, I\'ll share dito sa group.',
    time: '9:05 AM', reactions: { '👍': 5, '❤️': 2 }, replies: 1,
  },
  {
    id: 3, from: 'Kristine Lim', initials: 'KL', color: '#D97706', role: 'student',
    text: 'Prof. Santos released the updated requirements. Macheck nyo sa LMS yung section 3.2 ha!',
    time: '9:10 AM', reactions: { '👍': 8, '👀': 3 }, replies: 6,
  },
  {
    id: 4, from: 'Renz Dela Cruz', initials: 'RD', color: '#059669', role: 'student',
    text: 'Saan ba yung LMS? Nagcha-change yung link nila eh 😅',
    time: '9:15 AM', reactions: { '😂': 6 }, replies: 2,
  },
  {
    id: 5, from: 'Me', initials: 'JC', color: c.darkRed, role: 'student',
    text: 'Hahaha! student.fatima.edu.ph/lms — lagyan ng BSCS 3-A sa search',
    time: '9:18 AM', reactions: { '👍': 4, '❤️': 1 }, replies: 0,
  },
];

function GroupMessage({ msg }: { msg: typeof groupMessages[0] }) {
  const isMe = msg.from === 'Me';
  return (
    <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, marginBottom: 14 }}>
      {!isMe && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: msg.color, border: `2px solid ${c.baseRed}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
          <span style={{ fontFamily: fonts.ui, fontSize: 10, fontWeight: 700, color: c.white }}>{msg.initials}</span>
        </div>
      )}
      <div style={{ maxWidth: '75%' }}>
        {!isMe && (
          <p style={{ fontFamily: fonts.ui, fontSize: 11, fontWeight: 600, color: c.warmGray, margin: '0 0 4px 2px' }}>
            {msg.from}
          </p>
        )}
        <div style={{
          background: isMe ? g.sentBubble : c.white,
          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '10px 14px',
          boxShadow: shadow.card,
        }}>
          <p style={{ fontFamily: fonts.ui, fontSize: 13, color: isMe ? c.cream : c.darkBrown, margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
          {/* Reactions */}
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.entries(msg.reactions).map(([emoji, count]) => (
              <div key={emoji} style={{
                display: 'flex', alignItems: 'center', gap: 2,
                background: c.white,
                borderRadius: 20, padding: '2px 6px',
                border: `1px solid rgba(139,115,85,0.15)`,
                boxShadow: shadow.card,
              }}>
                <span style={{ fontSize: 11 }}>{emoji}</span>
                <span style={{ fontFamily: fonts.ui, fontSize: 10, color: c.warmGray }}>{count}</span>
              </div>
            ))}
          </div>
          {msg.replies > 0 && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: c.baseRed }}>
              <Reply size={12} />
              <span style={{ fontFamily: fonts.ui, fontSize: 11 }}>{msg.replies}</span>
            </button>
          )}
          <span style={{ fontFamily: fonts.mono, fontSize: 10, color: c.warmGray }}>{msg.time}</span>
        </div>
      </div>
    </div>
  );
}

export function GroupChat() {
  const navigate = useNavigate();
  const [text, setText] = useState('');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: g.header, padding: '12px 16px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/app/messages')} style={{ background: 'rgba(255,240,196,0.15)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={18} color={c.cream} />
          </button>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', border: `2px solid ${c.cream}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: fonts.ui, fontSize: 16 }}>👥</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: fonts.ui, fontSize: 14, fontWeight: 700, color: c.cream, margin: 0 }}>BSCS 3-A Group Chat</p>
            <p style={{ fontFamily: fonts.ui, fontSize: 11, color: c.warmGrayLight, margin: 0 }}>42 members · 8 online</p>
          </div>
          <button style={{ background: 'rgba(255,240,196,0.15)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Settings size={16} color={c.cream} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', background: c.creamLight }}>
        {/* Pinned announcement */}
        <div style={{
          background: c.white,
          borderRadius: 12,
          padding: '10px 14px',
          borderLeft: `4px solid ${c.baseRed}`,
          marginBottom: 16,
          boxShadow: shadow.card,
          display: 'flex',
          gap: 10,
        }}>
          <Pin size={16} color={c.baseRed} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontFamily: fonts.ui, fontSize: 12, fontWeight: 700, color: c.baseRed, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.3 }}>📌 Pinned</p>
            <p style={{ fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown, margin: 0 }}>
              Reminder: Submit your System Design Document by <strong>February 28, 11:59 PM</strong>. See requirements on LMS.
            </p>
            <p style={{ fontFamily: fonts.mono, fontSize: 10, color: c.warmGray, margin: '4px 0 0' }}>Pinned by Prof. Santos · Feb 20</p>
          </div>
        </div>

        {/* Date divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 14px' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(139,115,85,0.2)' }} />
          <div style={{ background: c.cream, borderRadius: 20, padding: '3px 12px', border: '1px solid rgba(139,115,85,0.15)' }}>
            <span style={{ fontFamily: fonts.ui, fontSize: 11, color: c.warmGray }}>Today</span>
          </div>
          <div style={{ flex: 1, height: 1, background: 'rgba(139,115,85,0.2)' }} />
        </div>

        {groupMessages.map(msg => (
          <GroupMessage key={msg.id} msg={msg} />
        ))}
      </div>

      {/* Input */}
      <div style={{ background: c.white, padding: '10px 12px 14px', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid rgba(139,115,85,0.12)', flexShrink: 0 }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.warmGray, padding: 4 }}><Paperclip size={20} /></button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: c.cream, borderRadius: 24, padding: '0 12px', height: 42 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Message BSCS 3-A…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown }}
          />
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.warmGray, padding: 0 }}><Smile size={18} /></button>
        </div>
        <button style={{ width: 42, height: 42, borderRadius: '50%', background: text.trim() ? g.button : 'rgba(139,115,85,0.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: text.trim() ? shadow.button : 'none' }}>
          <Send size={17} color={text.trim() ? c.cream : c.warmGray} />
        </button>
      </div>
    </div>
  );
}
