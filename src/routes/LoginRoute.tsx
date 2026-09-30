import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from '../ui/Brand';
import { ThemeControl } from '../ui/ThemeControl';
import { useSessionStore } from '../state/sessionStore';

interface LoginErrors { email?: string; password?: string }

export function LoginRoute() {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useSessionStore((state) => state.signIn);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const nextErrors: LoginErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Informe um e-mail válido.';
    if (password.length < 8) nextErrors.password = 'Use pelo menos 8 caracteres.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }
    setIsSubmitting(true);
    window.setTimeout(() => {
      signIn();
      const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard';
      navigate(destination, { replace: true });
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280);
  };

  return (
    <div className="login-page route-stage">
      <header className="public-header"><Brand /><ThemeControl /></header>
      <main className="login-main">
        <section className="login-context" aria-labelledby="login-context-title">
          <Link className="back-link" to="/"><ArrowLeft aria-hidden="true" /> Voltar</Link>
          <p className="kicker">ACESSO / NEWGENBANK</p>
          <h1 id="login-context-title" tabIndex={-1} data-route-title>O movimento<br />começa aqui.</h1>
          <p>Entre para acompanhar seu capital, entender o mês e agir com clareza.</p>
          <div className="login-context__rule"><span>01</span><span>ACESSO SEGURO</span></div>
        </section>
        <section className="login-panel" aria-labelledby="login-title">
          <header><p className="section-index">01 — ENTRAR</p><h2 id="login-title">Sua conta</h2></header>
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input ref={emailRef} id="email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} defaultValue="eduardo@ngb.com" />
              {errors.email && <span id="email-error" className="field__error">{errors.email}</span>}
            </div>
            <div className="field">
              <div className="field__label"><label htmlFor="password">Senha</label></div>
              <div className="password-field">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} defaultValue="newgen26" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>
              </div>
              {errors.password && <span id="password-error" className="field__error">{errors.password}</span>}
            </div>
            <button className="submit-action" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'ENTRANDO…' : 'ENTRAR'}</span><ArrowRight aria-hidden="true" />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
