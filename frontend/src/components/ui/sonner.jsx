import { Toaster as Sonner } from "sonner";
import { useThemeStore } from '../../stores/themeStore';

const Toaster = ({
  ...props
}) => {
  const theme = useThemeStore((s) => s.theme);

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--sh-sm)',
        },
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)"
        }
      }
      {...props} />
  );
}

export { Toaster }
