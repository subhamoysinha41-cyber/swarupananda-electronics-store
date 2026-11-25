import { Button, Tooltip } from '@fluentui/react-components';
import { WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons';

type ThemeToggleProps = { dark: boolean; onToggle: () => void };

export function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
  return (
    <Tooltip content={dark ? 'Switch to light mode' : 'Switch to dark mode'} relationship="label">
      <Button
        appearance="subtle"
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        icon={dark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
        onClick={onToggle}
      />
    </Tooltip>
  );
}
