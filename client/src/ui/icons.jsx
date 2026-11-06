//Iconos de linea (24x24, stroke 1.75, color = currentColor). Un solo estilo en toda la app:
//reemplazan los PNG de colores y los emojis. Uso: <Icon.Search className="size-5" />
const base = (paths, { fill = false } = {}) => function Icono({ className = 'size-5', strokeWidth = 1.75, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} {...props}>
      {paths}
    </svg>
  )
}

export const Icon = {
  Search: base(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  MapPin: base(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>),
  Calendar: base(<><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>),
  Clock: base(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  Heart: base(<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />),
  HeartFilled: base(<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />, { fill: true }),
  X: base(<path d="M6 6l12 12M18 6 6 18" />),
  Check: base(<path d="m5 12.5 4.5 4.5L19 7.5" />),
  CheckCircle: base(<><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4 4.6-4.9" /></>),
  XCircle: base(<><circle cx="12" cy="12" r="8.5" /><path d="m9.5 9.5 5 5m0-5-5 5" /></>),
  AlertCircle: base(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.8v4.7M12 16h.01" /></>),
  Info: base(<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>),
  Hourglass: base(<path d="M7 3.5h10M7 20.5h10M8 3.5c0 4 8 4.5 8 8.5s-8 4.5-8 8.5M16 3.5c0 4-8 4.5-8 8.5s8 4.5 8 8.5" />),
  Ticket: base(<path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4V7.5ZM14 6v12" strokeDasharray="0" />),
  Link: base(<><path d="M10 14a4 4 0 0 0 5.7.3l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" /><path d="M14 10a4 4 0 0 0-5.7-.3l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" /></>),
  Share: base(<><circle cx="18" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" /></>),
  ChevronDown: base(<path d="m6 9 6 6 6-6" />),
  ChevronRight: base(<path d="m9 6 6 6-6 6" />),
  ArrowLeft: base(<path d="M19 12H5m6-6-6 6 6 6" />),
  ArrowRight: base(<path d="M5 12h14m-6-6 6 6-6 6" />),
  Minus: base(<path d="M6 12h12" />),
  Plus: base(<path d="M12 6v12M6 12h12" />),
  Menu: base(<path d="M4 7h16M4 12h16M4 17h16" />),
  User: base(<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>),
  Edit: base(<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />),
  Users: base(<><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19.5a6 6 0 0 1 12 0M16 5.6a3.2 3.2 0 0 1 0 5.8M18 19.5a6 6 0 0 0-2.6-5" /></>),
  LogOut: base(<path d="M14 4h3.5A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10" />),
  LogIn: base(<path d="M10 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H10M14 16l4-4-4-4M18 12H8" />),
  Home: base(<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z" />),
  Mail: base(<><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>),
  Eye: base(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>),
  EyeOff: base(<path d="M3 3l18 18M10.6 5.6A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.6 6.6A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2" />),
  QrCode: base(<path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2ZM7 7h.01M17 7h.01M7 17h.01" />),
  Chart: base(<path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />),
  Download: base(<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />),
  Upload: base(<path d="M12 15.5V4.5m0 0L7.5 9M12 4.5 16.5 9M5 19.5h14" />),
  Copy: base(<><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" /></>),
  Image: base(<><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="m4 17 4.5-4.5 3.5 3.5 2.5-2.5 5.5 5" /></>),
  Trash: base(<path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />),
  Settings: base(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>),
  Lock: base(<><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>),
  Phone: base(<path d="M5 4.5h3l1.5 4-2 1.3a10 10 0 0 0 4.7 4.7l1.3-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15 15 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5Z" />),
  Tag: base(<><path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.2 6.2a1.5 1.5 0 0 1-2.1 0L3.5 12.2Z" /><circle cx="8" cy="8" r="1.4" /></>),
  Sliders: base(<path d="M4 7h10M18 7h2M4 17h4M12 17h8M16 4.5v5M10 14.5v5" />),
  Music: base(<><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>),
  Sparkles: base(<path d="M12 3.5 13.8 9 19.5 11l-5.7 2-1.8 5.5-1.8-5.5L4.5 11l5.7-2L12 3.5ZM19 3v3M20.5 4.5h-3" />),
  Palette: base(<><path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.9 1.4-1.9-.5-1.2.3-2.6 1.7-2.6h1.6a3.8 3.8 0 0 0 3.8-3.8C20.5 7.2 16.7 3.5 12 3.5Z" /><circle cx="7.8" cy="11" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="15" cy="7.8" r="1" /></>),
  Masks: base(<><path d="M3.5 5.5c3-1.3 6-1.3 9 0v5a4.5 4.5 0 0 1-9 0v-5Z" /><path d="M6 9h.01M10 9h.01M6.5 12.3a2.5 2.5 0 0 0 3 0" /><path d="M14 9.3c2.2-.6 4.4-.4 6.5.6v4.6a4.5 4.5 0 0 1-7.4 3.4" /></>),
  Trophy: base(<path d="M8 4.5h8v5a4 4 0 0 1-8 0v-5ZM8 6.5H5a3 3 0 0 0 3 4M16 6.5h3a3 3 0 0 1-3 4M12 13.5v3M8.5 20h7M9.5 20l.5-3.5h4l.5 3.5" />),
  Disc: base(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2.5" /><path d="M12 6.5a5.5 5.5 0 0 0-5.5 5.5" /></>),
  Shield: base(<path d="M12 3.5 19 6v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6l7-2.5Z" />),
  Instagram: base(<><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="3.8" /><path d="M17.2 6.8h.01" /></>),
  WhatsApp: base(<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6l-3.9.9ZM9 8.5c0 3.5 2.6 6.4 6 6.9l1.2-1.4-2-.9-.9.8a5 5 0 0 1-2.2-2.2l.8-.9-.9-2-1.4 1.2c-.4-.6-.6-1.1-.6-1.5Z" />)
}
