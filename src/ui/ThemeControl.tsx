import { Laptop, Moon, Sun } from 'lucide-react';
import type { ThemePreference } from '../domain/models';
import { useTheme } from '../theme/ThemeProvider';

const options: Array<{ value: ThemePreference; label: string; Icon: typeof Sun }> = [
  { value: 'light', label: 'Tema claro', Icon: Sun },
  { value: 'dark', label: 'Tema escuro', Icon: Moon },
  { value: 'system', label: 'Usar tema do sistema', Icon: Laptop },
];

export function ThemeControl() {
  const { preference, setPreference } = useTheme();
  return (
    <fieldset className="theme-control" aria-label="Aparência">
      <legend className="sr-only">Escolha o tema</legend>
      {options.map(({ value, label, Icon }) => (
        <label className="theme-control__option" key={value} title={label}>
          <input
            type="radio"
            name="theme"
            value={value}
            checked={preference === value}
            onChange={() => setPreference(value)}
          />
          <Icon aria-hidden="true" size={15} strokeWidth={1.8} />
          <span className="sr-only">{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
