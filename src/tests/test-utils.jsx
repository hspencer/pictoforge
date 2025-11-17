import { render } from '@testing-library/react';
import { I18nProvider } from '@/hooks/useI18n';

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.Element} ui - Component to render
 * @param {Object} options - Additional options
 * @returns {Object} Render result
 */
export function renderWithProviders(ui, options = {}) {
  const Wrapper = ({ children }) => (
    <I18nProvider>
      {children}
    </I18nProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override the default render with our custom render
export { renderWithProviders as render };
