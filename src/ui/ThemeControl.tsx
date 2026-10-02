import { Laptop, Moon, Sun } from 'lucide-react';
import type { ThemePreference } from '../domain/models';
import { useFinancialStore } from '../state/financialStore';
import { useTheme } from '../theme/ThemeProvider';
import type { AccentPreference } from '../theme/theme';

const options: Array<{ value: ThemePreference; label: string; Icon: typeof Sun }> = [
  { value: 'light', label: 'Tema claro', Icon: Sun },
  { value: 'dark', label: 'Tema escuro', Icon: Moon },
  { value: 'system', label: 'Usar tema do sistema', Icon: Laptop },
];

const accentOptions: Array<{ value: AccentPreference; label: string }> = [
  { value: 'green', label: 'NewGen Green' },
  { value: 'electric-blue', label: 'Azul elétrico' },
  { value: 'violet', label: 'Violeta' },
  { value: 'crimson', label: 'Vermelho carmesim' },
  { value: 'amber-gold', label: 'Âmbar dourado' },
  { value: 'ice-cyan', label: 'Ciano gelo' },
];

export function ThemeControl({ showAccent = false }: { showAccent?: boolean }) {
  const { preference, setPreference, accent, setAccent } = useTheme();
  const setThemePreference = useFinancialStore((state) => state.setThemePreference);
  const chooseTheme = (value: ThemePreference) => {
    setPreference(value);
    setThemePreference(value);
  };
  return (
    <div className="appearance-control">
      {showAccent && <fieldset className="accent-control" aria-label="Cor de destaque">
      <legend className="sr-only">Escolha a cor de destaque</legend>
      {accentOptions.map(({ value, label }) => (
        <label className={`accent-control__option accent-control__option--${value}`} key={value} title={label}>
          <input type="radio" name="accent" value={value} checked={accent === value} onChange={() => setAccent(value)} />
          <span aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </label>
      ))}
      </fieldset>}
    <fieldset className="theme-control" aria-label="Aparência">
      <legend className="sr-only">Escolha o tema</legend>
      {options.map(({ value, label, Icon }) => (
        <label className="theme-control__option" key={value} title={label}>
          <input
            type="radio"
            name="theme"
            value={value}
            checked={preference === value}
            onChange={() => chooseTheme(value)}
          />
          <Icon aria-hidden="true" size={15} strokeWidth={1.8} />
          <span className="sr-only">{label}</span>
        </label>
      ))}
    </fieldset>
    </div>
  );
}
