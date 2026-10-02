import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFinancialStore } from '../state/financialStore';
import { useSessionStore } from '../state/sessionStore';
import { Brand } from '../ui/Brand';
import { NewGenCard } from '../ui/NewGenCard';
import { ThemeControl } from '../ui/ThemeControl';

interface LoginErrors { identifier?: string; password?: string }

export function LoginRoute() {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const identifierRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useSessionStore((state) => state.signIn);
  const card = useFinancialStore((state) => state.cards[0]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const identifier = String(data.get('identifier') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const digits = identifier.replace(/\D/g, '');
    const nextErrors: LoginErrors = {};
    if (identifier.length < 3 || (digits.length > 0 && digits.length !== 11)) nextErrors.identifier = 'Informe seu usuário ou um CPF válido.';
    if (password.length < 8) nextErrors.password = 'Use pelo menos 8 caracteres.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => identifierRef.current?.focus());
      return;
    }

    setIsSubmitting(true);
    signIn();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard';
    window.setTimeout(() => {
      document.documentElement.dataset.sliceTransition = 'active';
      navigate(destination, {
        replace: true,
        viewTransition: !reducedMotion,
        state: destination === '/dashboard' ? { fromLogin: true } : undefined,
      });
      window.setTimeout(() => delete document.documentElement.dataset.sliceTransition, 1600);
    }, reducedMotion ? 0 : 650);
  };

  return (
    <div className="login-page vertical-slice mineral-scene route-stage" data-transitioning={isSubmitting || undefined}>
      <div className="mineral-backdrop" aria-hidden="true" />
      <div className="mineral-atmosphere" aria-hidden="true" />
      <header className="public-header slice-header"><Brand /><ThemeControl showAccent /></header>
      <main className="login-main login-main--mineral">
        <section className="login-panel login-panel--mineral" aria-labelledby="login-title">
          <Link className="back-link" to="/"><ArrowLeft aria-hidden="true" /> Voltar</Link>
          <div className="login-panel__welcome">
            <span className="login-panel__eyebrow"><LockKeyhole aria-hidden="true" /> Acesso seguro</span>
            <h1 id="login-title" tabIndex={-1} data-route-title>Bom ter você de volta.</h1>
            <p>Entre para continuar de onde parou.</p>
          </div>
          <form className="login-form login-form--mineral" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="identifier">Usuário ou CPF</label>
              <input ref={identifierRef} id="identifier" name="identifier" type="text" inputMode="text" autoComplete="username" aria-invalid={Boolean(errors.identifier)} aria-describedby={errors.identifier ? 'identifier-error' : undefined} defaultValue="123.456.789-00" />
              {errors.identifier && <span id="identifier-error" className="field__error">{errors.identifier}</span>}
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <div className="password-field">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} defaultValue="newgen26" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>
              </div>
              {errors.password && <span id="password-error" className="field__error">{errors.password}</span>}
            </div>
            <button className="submit-action submit-action--mineral ngb-button ngb-button--primary" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Abrindo sua conta…' : 'Entrar'}</span><ArrowRight aria-hidden="true" />
            </button>
          </form>
        </section>

        <section className="login-environment" aria-label="Ambiente mineral NewGenBank">
          <div className="login-card-stage slice-card" aria-label="Seu cartão NewGen">
            <NewGenCard card={card} spatial visualScale={1.72} renderOverscan={2.65} />
          </div>
        </section>
      </main>
    </div>
  );
}
