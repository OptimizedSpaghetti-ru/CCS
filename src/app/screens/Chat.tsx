import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Phone, Video, Paperclip, Smile, Send, Image, FileText } from 'lucide-react';
import { c, g, fonts, shadow } from '../theme';

const chatData: Record<string, {
  name: string; role: string; initials: string; color: string; online: boolean;
  messages: { id: number; from: 'me' | 'other'; text: string; time: string; type?: string }[];
}> = {
  '1': {
    name: 'Prof. Maria Santos', role: 'faculty', initials: 'MS', color: c.darkRed, online: true,
    messages: [
      { id: 1, from: 'other', text: 'Good morning! I wanted to discuss your capstone project progress.', time: '9:00 AM' },
      { id: 2, from: 'me', text: 'Good morning po, Ma\'am! We\'re currently on the design phase.', time: '9:05 AM' },
      { id: 3, from: 'other', text: 'Good. Please make sure to update your documentation as you go. Also, I uploaded the updated requirements on the LMS.', time: '9:12 AM' },
      { id: 4, from: 'me', text: 'Yes po! We already saw it. We have a question about section 3.2 about the system architecture.', time: '9:15 AM' },
      { id: 5, from: 'other', text: 'Of course! The architecture should follow the MVC pattern as discussed in class. Attach your current diagram so I can check.', time: '9:18 AM' },
      { id: 6, from: 'me', text: 'Thank you po! Here is our current ER diagram:', time: '9:20 AM', type: 'file' },
      { id: 7, from: 'other', text: 'I\'ll review this and give feedback by tomorrow. 👍', time: '9:25 AM' },
      { id: 8, from: 'other', text: 'Please check the updated capstone requirements I uploaded on the LMS portal.', time: '9:41 AM' },
    ],
  },
  '3': {
    name: 'Carlo Reyes', role: 'student', initials: 'CR', color: '#059669', online: true,
    messages: [
      { id: 1, from: 'other', text: 'Pre, kumain na tayo! 😄', time: '8:45 AM' },
      { id: 2, from: 'me', text: 'Sandali lang, todo submit pa ko ng assignment 😅', time: '8:47 AM' },
      { id: 3, from: 'other', text: 'Sige antayin kita sa canteen. Huwag ka mahuli sa schedule!', time: '8:48 AM' },
      { id: 4, from: 'me', text: 'Tara na, kumain na 😄', time: '8:50 AM' },
    ],
  },
};

const defaultChat = chatData['1'];

function MessageBubble({ msg }: { msg: { id: number; from: 'me' | 'other'; text: string; time: string; type?: string } }) {
  const isMe = msg.from === 'me';

  if (msg.type === 'file') {
    return (
      <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
        <div style={{ maxWidth: '70%' }}>
          <div style={{
            background: isMe ? g.sentBubble : c.white,
            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            padding: '10px 14px',
            boxShadow: shadow.card,
          }}>
            <p style={{ fontFamily: fonts.ui, fontSize: 13, color: isMe ? c.cream : c.darkBrown, margin: '0 0 8px' }}>{msg.text}</p>
            <div style={{
              background: isMe ? 'rgba(255,240,196,0.2)' : `${c.cream}`,
              borderRadius: 10, padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1px solid ${isMe ? 'rgba(255,240,196,0.3)' : 'rgba(139,115,85,0.15)'}`,
            }}>
              <FileText size={18} color={isMe ? c.cream : c.baseRed} />
              <div>
                <p style={{ fontFamily: fonts.ui, fontSize: 12, fontWeight: 600, color: isMe ? c.cream : c.darkBrown, margin: 0 }}>ER_Diagram_v2.pdf</p>
                <p style={{ fontFamily: fonts.ui, fontSize: 10, color: isMe ? `${c.cream}80` : c.warmGray, margin: 0 }}>248 KB · PDF</p>
              </div>
            </div>
          </div>
          <p style={{ fontFamily: fonts.mono, fontSize: 10, color: c.warmGray, margin: '3px 0 0', textAlign: isMe ? 'right' : 'left' }}>{msg.time}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
      {!isMe && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.warmGray, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: fonts.ui, fontSize: 10, fontWeight: 700, color: c.white }}>MS</span>
        </div>
      )}
      <div style={{ maxWidth: '72%' }}>
        <div style={{
          background: isMe ? g.sentBubble : c.white,
          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '10px 14px',
          boxShadow: shadow.card,
        }}>
          <p style={{ fontFamily: fonts.ui, fontSize: 13, color: isMe ? c.cream : c.darkBrown, margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
        </div>
        <p style={{ fontFamily: fonts.mono, fontSize: 10, color: c.warmGray, margin: '3px 0 0', textAlign: isMe ? 'right' : 'left' }}>{msg.time}</p>
      </div>
    </div>
  );
}

export function Chat() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState((chatData[id || '1'] || defaultChat).messages);
  const chat = chatData[id || '1'] || defaultChat;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, {
      id: prev.length + 1, from: 'me', text: text.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }]);
    setText('');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: g.header, padding: '12px 16px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate('/app/messages')} style={{ background: 'rgba(255,240,196,0.15)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color={c.cream} />
        </button>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: chat.color, border: `2px solid ${c.cream}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: fonts.ui, fontSize: 13, fontWeight: 700, color: c.white }}>{chat.initials}</span>
          </div>
          {chat.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#22C55E', border: `2px solid ${c.darkestRed}` }} />}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: fonts.ui, fontSize: 14, fontWeight: 700, color: c.cream, margin: 0 }}>{chat.name}</p>
          <p style={{ fontFamily: fonts.ui, fontSize: 11, color: c.warmGrayLight, margin: 0 }}>
            {chat.online ? '🟢 Active now' : 'Offline'}
            {chat.role === 'faculty' ? ' · 📘 Faculty' : ' · 🎓 Student'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: 'rgba(255,240,196,0.15)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Phone size={16} color={c.cream} />
          </button>
          <button style={{ background: 'rgba(255,240,196,0.15)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Video size={16} color={c.cream} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', background: c.creamLight, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Date divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 8px' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(139,115,85,0.2)' }} />
          <div style={{ background: c.cream, borderRadius: 20, padding: '3px 12px', border: '1px solid rgba(139,115,85,0.15)' }}>
            <span style={{ fontFamily: fonts.ui, fontSize: 11, color: c.warmGray }}>Today</span>
          </div>
          <div style={{ flex: 1, height: 1, background: 'rgba(139,115,85,0.2)' }} />
        </div>

        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        background: c.white,
        padding: '10px 12px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderTop: '1px solid rgba(139,115,85,0.12)',
        flexShrink: 0,
      }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.warmGray, padding: 4 }}>
          <Paperclip size={20} />
        </button>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: c.cream,
          borderRadius: 24,
          padding: '0 12px',
          height: 42,
        }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown,
            }}
          />
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.warmGray, padding: 0 }}>
            <Smile size={18} />
          </button>
        </div>
        <button
          onClick={sendMessage}
          style={{
            width: 42, height: 42,
            borderRadius: '50%',
            background: text.trim() ? g.button : 'rgba(139,115,85,0.2)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: text.trim() ? 'pointer' : 'default',
            transition: 'background 0.2s',
            boxShadow: text.trim() ? shadow.button : 'none',
          }}
        >
          <Send size={17} color={text.trim() ? c.cream : c.warmGray} />
        </button>
      </div>
    </div>
  );
}
