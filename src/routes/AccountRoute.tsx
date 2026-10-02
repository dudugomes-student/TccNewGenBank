import { ArrowRight, LogOut, Pencil, Save, Settings, UserRound, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRouteFocus } from '../motion/useRouteFocus';
import { useFinancialStore } from '../state/financialStore';
import { useSessionStore } from '../state/sessionStore';
import { AppHeader } from '../ui/AppHeader';
import { MobileNav } from '../ui/MobileNav';

export function AccountRoute() {
  useRouteFocus();
  const navigate = useNavigate();
  const signOut = useSessionStore((state) => state.signOut);
  const snapshot = useFinancialStore();
  const [name, setName] = useState(snapshot.account.ownerName);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const unread = snapshot.notifications.filter((notification) => !notification.read).length;

  useEffect(() => setName(snapshot.account.ownerName), [snapshot.account.ownerName]);
  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    const result = snapshot.updateOwnerName(name);
    if (!result.ok) {
      setError(result.message);
      setMessage('');
      return;
    }
    setError('');
    setMessage(result.message);
    setEditing(false);
  };

  const cancelEditing = () => {
    setName(snapshot.account.ownerName);
    setError('');
    setEditing(false);
  };

  return <div className="utility-page account-page secondary-page vertical-slice mineral-scene route-stage">
    <div className="mineral-backdrop" aria-hidden="true" />
    <div className="mineral-atmosphere" aria-hidden="true" />
    <a className="skip-link" href="#account-content">Pular para sua conta</a>
    <AppHeader unreadCount={unread} showAccent />
    <main className="utility-shell" id="account-content">
      <header className="account-header"><p className="kicker">CONTA / PERFIL DEMO</p><h1 tabIndex={-1} data-route-title>Sua conta,<br />sem ruído.</h1><p>Identidade, dados bancários da demonstração e preferências que realmente funcionam.</p></header>
      <section className="account-section" aria-labelledby="profile-title"><header><span>01</span><div><p className="section-index">PERFIL</p><h2 id="profile-title">Como chamamos você.</h2></div></header>{editing ? <form className="profile-form" onSubmit={saveProfile} noValidate><label htmlFor="profile-name">Nome exibido</label><input id="profile-name" autoComplete="name" autoFocus value={name} onChange={(event) => { setName(event.target.value); setError(''); setMessage(''); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'profile-error' : 'profile-status'} />{error && <p id="profile-error" className="field__error" role="alert">{error}</p>}<div className="profile-form__actions"><button type="button" onClick={cancelEditing}><X aria-hidden="true" /> Cancelar</button><button className="ngb-button ngb-button--primary" type="submit" disabled={name.trim().replace(/\s+/g, ' ') === snapshot.account.ownerName}><Save aria-hidden="true" /> Salvar nome</button></div></form> : <div className="profile-view"><span className="profile-view__identity" aria-hidden="true"><UserRound /></span><div><small>Nome exibido em toda a conta</small><strong>{snapshot.account.ownerName}</strong>{message && <p id="profile-status" role="status" aria-live="polite">{message}</p>}</div><button type="button" onClick={() => { setMessage(''); setEditing(true); }}><Pencil aria-hidden="true" /> Editar nome</button></div>}</section>
      <section className="account-section" aria-labelledby="bank-data-title"><header><span>02</span><div><p className="section-index">IDENTIFICAÇÃO</p><h2 id="bank-data-title">Dados da conta demo.</h2></div></header><dl className="account-ledger"><div><dt>Titular</dt><dd>{snapshot.account.ownerName}</dd></div><div><dt>Instituição</dt><dd>{snapshot.account.institution}</dd></div><div><dt>Agência</dt><dd>{snapshot.account.branch}</dd></div><div><dt>Conta</dt><dd>{snapshot.account.number}</dd></div><div><dt>Identificador demo</dt><dd className="receipt__id">{snapshot.account.id}</dd></div></dl></section>
      <section className="account-settings-link" aria-labelledby="preferences-title"><Settings aria-hidden="true" /><div><p className="section-index">APARÊNCIA E PRIVACIDADE</p><h2 id="preferences-title">Preferências.</h2><p>Tema e visibilidade dos valores, salvos neste dispositivo.</p></div><Link to="/configuracoes">Abrir configurações <ArrowRight aria-hidden="true" /></Link></section>
      <button className="account-mobile-logout" type="button" onClick={() => { signOut(); navigate('/entrar'); }}><LogOut aria-hidden="true" /> Sair da conta</button>
    </main>
    <MobileNav />
  </div>;
}
