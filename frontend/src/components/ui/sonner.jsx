import { Toaster as Sonner } from "sonner";
import { useThemeStore } from '../../stores/themeStore';

const Toaster = ({
  ...props
}) => {
  const theme = useThemeStore((s) => s.theme);

  // Top-center sits over the empty middle of the app header. Bottom-right covered the
  // Dialogue composer and its Send button.

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="top-center"
      offset={12}
      mobileOffset={12}
      visibleToasts={3}
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
