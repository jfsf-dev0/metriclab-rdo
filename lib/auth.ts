export interface UserSession {
  usuario_id: string;
  nome: string;
  trecho_id?: string | null;
  trecho_nome?: string;
  pacote?: string;
  cargo?: string;
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    // Garante que nenhum acesso seja recuperado de localStorage
    if (localStorage.getItem('ml_rdo_session')) {
      localStorage.removeItem('ml_rdo_session');
    }

    const raw = sessionStorage.getItem('ml_rdo_session');
    if (raw) {
      return JSON.parse(raw);
    }

    // Fallback para cookie de sessão em memória
    const match = document.cookie.match(/(^|;)\s*ml_rdo_session=([^;]+)/);
    if (match) {
      const parsed = JSON.parse(decodeURIComponent(match[2]));
      if (parsed && (parsed.usuario_id || parsed.nome)) {
        sessionStorage.setItem('ml_rdo_session', JSON.stringify(parsed));
        return parsed;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function setSession(session: UserSession) {
  if (typeof window === 'undefined') return;
  try {
    // NUNCA persiste em localStorage
    localStorage.removeItem('ml_rdo_session');
  } catch {}

  // Armazena estritamente na sessão ativa (sessionStorage + session cookie sem max-age)
  sessionStorage.setItem('ml_rdo_session', JSON.stringify(session));
  document.cookie = `ml_rdo_session=${encodeURIComponent(JSON.stringify(session))}; path=/; SameSite=Lax`;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('ml_rdo_session');
    localStorage.removeItem('ml_rdo_session');
  } catch {}
  document.cookie = 'ml_rdo_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}
