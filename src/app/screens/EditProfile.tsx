import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Camera, User, Hash, Mail, Phone, Book, FileText, ArrowLeft } from 'lucide-react';
import { c, g, fonts, shadow } from '../theme';
import { useApp } from '../context/AppContext';

function FormGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: c.white, borderRadius: 16, overflow: 'hidden', boxShadow: shadow.card }}>
      <div style={{ background: c.cream, padding: '10px 16px', borderBottom: '1px solid rgba(139,115,85,0.15)' }}>
        <p style={{ fontFamily: fonts.ui, fontSize: 11, fontWeight: 700, color: c.warmGray, textTransform: 'uppercase', letterSpacing: 0.8, margin: 0 }}>{title}</p>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function EditField({
  icon, label, value, onChange, multiline, hint,
}: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; multiline?: boolean; hint?: string;
}) {
  return (
    <div>
      <label style={{ fontFamily: fonts.ui, fontSize: 11, fontWeight: 600, color: c.darkBrown, display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{
        display: 'flex',
        alignItems: multiline ? 'flex-start' : 'center',
        gap: 10,
        background: c.cream,
        borderRadius: 10,
        padding: multiline ? '12px 14px' : '0 14px',
        height: multiline ? undefined : 46,
        border: `2px solid transparent`,
      }}>
        <span style={{ color: c.warmGray, flexShrink: 0, marginTop: multiline ? 2 : 0 }}>{icon}</span>
        {multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={3}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown, resize: 'none',
              lineHeight: 1.5, minWidth: 0,
            }}
          />
        ) : (
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown, minWidth: 0,
            }}
          />
        )}
      </div>
      {hint && (
        <p style={{ fontFamily: fonts.ui, fontSize: 10, color: c.warmGray, margin: '4px 0 0', textAlign: 'right' }}>{hint}</p>
      )}
    </div>
  );
}

export function EditProfile() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [form, setForm] = useState({
    name: currentUser.name,
    id: currentUser.id,
    email: currentUser.email,
    phone: '+63 912 345 6789',
    dept: 'College of Computer Studies',
    program: 'BSCS',
    yearSection: currentUser.yearSection,
    bio: 'BSCS student passionate about software engineering and AI. Aspiring to build solutions for the Filipino community.',
  });
  const set = (k: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: c.creamLight }}>
      {/* Header */}
      <div style={{ background: g.header, padding: '12px 16px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          onClick={() => navigate('/app/profile')}
          style={{ background: 'rgba(255,240,196,0.15)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} color={c.cream} />
        </button>
        <h1 style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 700, color: c.cream, margin: 0, flex: 1 }}>
          Edit Profile
        </h1>
        <button
          onClick={() => navigate('/app/profile')}
          style={{
            background: 'rgba(255,240,196,0.2)', border: '1px solid rgba(255,240,196,0.3)',
            borderRadius: 8, padding: '6px 14px',
            fontFamily: fonts.ui, fontSize: 13, fontWeight: 600,
            color: c.cream, cursor: 'pointer',
          }}
        >
          Save
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: g.button,
              border: `3px solid ${c.baseRed}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: fonts.display, fontSize: 30, fontWeight: 900, color: c.cream }}>
                {currentUser.initials}
              </span>
            </div>
            <button style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: g.button,
              border: `2px solid ${c.white}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Camera size={14} color={c.cream} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormGroup title="Personal Information">
            <EditField icon={<User size={16} />} label="Full Name" value={form.name} onChange={set('name')} />
            <EditField icon={<FileText size={16} />} label="Bio / About" value={form.bio} onChange={set('bio')} multiline hint={`${form.bio.length}/150`} />
          </FormGroup>

          <FormGroup title="Academic Information">
            <EditField icon={<Hash size={16} />} label="Student ID" value={form.id} onChange={set('id')} />
            <EditField icon={<Book size={16} />} label="Department" value={form.dept} onChange={set('dept')} />
            <EditField icon={<Book size={16} />} label="Program" value={form.program} onChange={set('program')} />
            <EditField icon={<Book size={16} />} label="Year & Section" value={form.yearSection} onChange={set('yearSection')} />
          </FormGroup>

          <FormGroup title="Contact Information">
            <EditField icon={<Mail size={16} />} label="Email Address" value={form.email} onChange={set('email')} />
            <EditField icon={<Phone size={16} />} label="Phone Number" value={form.phone} onChange={set('phone')} />
          </FormGroup>
        </div>
      </div>

      {/* Pinned bottom actions */}
      <div style={{ padding: '12px 16px 16px', background: c.white, borderTop: '1px solid rgba(139,115,85,0.12)', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/app/profile')}
          style={{
            width: '100%', height: 50,
            background: g.button, border: 'none', borderRadius: 12,
            fontFamily: fonts.ui, fontSize: 15, fontWeight: 600, color: c.cream,
            cursor: 'pointer', boxShadow: shadow.button, marginBottom: 10,
          }}
        >
          Save Changes
        </button>
        <button
          onClick={() => navigate('/app/profile')}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: fonts.ui, fontSize: 14, color: c.warmGray,
          }}
        >
          Discard Changes
        </button>
      </div>
    </div>
  );
}
