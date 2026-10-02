import { ArrowLeft, EyeOff, Laptop, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ThemePreference } from '../domain/models';
import { useRouteFocus } from '../motion/useRouteFocus';
import { useFinancialStore } from '../state/financialStore';
import { useTheme } from '../theme/ThemeProvider';
import type { AccentPreference } from '../theme/theme';
import { AppHeader } from '../ui/AppHeader';
import { MobileNav } from '../ui/MobileNav';

const themeOptions: Array<{ value: ThemePreference; title: string; detail: string; Icon: typeof Sun }> = [
  { value: 'light', title: 'Claro', detail: 'Papel, contraste e leitura aberta.', Icon: Sun },
  { value: 'dark', title: 'Escuro', detail: 'Superfícies profundas e contraste noturno.', Icon: Moon },
  { value: 'system', title: 'Sistema', detail: 'Acompanha a preferência deste dispositivo.', Icon: Laptop },
];

const accentOptions: Array<{ value: AccentPreference; title: string }> = [
  { value: 'green', title: 'Green' },
  { value: 'electric-blue', title: 'Blue' },
  { value: 'violet', title: 'Violet' },
  { value: 'crimson', title: 'Crimson' },
  { value: 'amber-gold', title: 'Amber' },
  { value: 'ice-cyan', title: 'Cyan' },
];

export function SettingsRoute() {
  useRouteFocus();
  const snapshot = useFinancialStore();
  const { preference, setPreference, accent, setAccent } = useTheme();
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const unread = snapshot.notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setSystemReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const chooseTheme = (theme: ThemePreference) => {
    setPreference(theme);
    snapshot.setThemePreference(theme);
  };

  return <div className="utility-page settings-page secondary-page vertical-slice mineral-scene route-stage">
    <div className="mineral-backdrop" aria-hidden="true" />
    <div className="mineral-atmosphere" aria-hidden="true" />
    <a className="skip-link" href="#settings-content">Pular para configurações</a>
    <AppHeader unreadCount={unread} />
    <main className="utility-shell" id="settings-content">
      <header className="settings-header"><Link to="/conta" className="back-link"><ArrowLeft aria-hidden="true" /> Conta</Link><p className="kicker">PREFERÊNCIAS REAIS</p><h1 tabIndex={-1} data-route-title>Configurações.</h1><p>Somente escolhas que produzem efeito agora e permanecem após recarregar.</p></header>
      <section className="settings-section" aria-labelledby="appearance-title"><header><span>01</span><div><p className="section-index">APARÊNCIA</p><h2 id="appearance-title">Luz e destaque.</h2></div></header><div className="appearance-settings"><fieldset className="theme-options"><legend>Tema da interface</legend>{themeOptions.map(({ value, title, detail, Icon }) => <label key={value} className={preference === value ? 'is-selected' : ''}><input type="radio" name="settings-theme" value={value} checked={preference === value} onChange={() => chooseTheme(value)} /><Icon aria-hidden="true" /><span><strong>{title}</strong><small>{detail}</small></span></label>)}</fieldset><fieldset className="settings-accent-options"><legend>Cor de destaque</legend><p>Aplicada imediatamente a seleções, controles e ambiente.</p><div>{accentOptions.map(({ value, title }) => <label key={value} className={`settings-accent-options__item settings-accent-options__item--${value} ${accent === value ? 'is-selected' : ''}`}><input type="radio" name="settings-accent" value={value} checked={accent === value} onChange={() => setAccent(value)} /><span aria-hidden="true" /><strong>{title}</strong></label>)}</div></fieldset></div></section>
      <section className="settings-section" aria-labelledby="privacy-title"><header><span>02</span><div><p className="section-index">PRIVACIDADE DEMO</p><h2 id="privacy-title">Valores sob controle.</h2></div></header><div className="preference-row"><EyeOff aria-hidden="true" /><span><strong>Ocultar valores por padrão</strong><small>O saldo permanece escondido no Dashboard até você revelar.</small></span><button type="button" role="switch" aria-label="Ocultar valores por padrão" aria-checked={snapshot.preferences.concealBalance} onClick={() => snapshot.setBalanceVisibility(!snapshot.preferences.concealBalance)}><span aria-hidden="true" /></button></div></section>
      <section className="settings-section" aria-labelledby="motion-title-settings"><header><span>03</span><div><p className="section-index">MOVIMENTO</p><h2 id="motion-title-settings">O sistema decide.</h2></div></header><div className="motion-preference"><strong>Redução de movimento do dispositivo</strong><span className={systemReducedMotion ? 'is-active' : ''}>{systemReducedMotion ? 'Ativa' : 'Não ativa'}</span><p>O NewGenBank remove transições e deslocamentos quando <code>prefers-reduced-motion</code> está ativo. Não há controle duplicado que contradiga o sistema.</p></div></section>
    </main>
    <MobileNav />
  </div>;
}
