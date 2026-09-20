'use client';
import { useState } from 'react';

const Eye = ({ off }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.8" />
    {off && <line x1="4" y1="20" x2="20" y2="4" />}
  </svg>
);

// Campo password con l'occhio per mostrarla o nasconderla.
export default function PasswordField({ label, autoComplete, minLength, hint }) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <span className="password-wrap">
        <input type={visible ? 'text' : 'password'} name="password" required
               minLength={minLength} autoComplete={autoComplete} autoCapitalize="none"
               autoCorrect="off" spellCheck={false} />
        <button type="button" className="reveal" onClick={() => setVisible(!visible)}
                aria-pressed={visible}
                aria-label={visible ? 'Nascondi la password' : 'Mostra la password'}>
          <Eye off={visible} />
        </button>
      </span>
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}
