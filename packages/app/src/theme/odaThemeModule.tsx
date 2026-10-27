// packages/app/src/theme/odaThemeModule.tsx

import { ReactNode } from 'react';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { ThemeBlueprint } from '@backstage/plugin-app-react';
import { UnifiedThemeProvider } from '@backstage/theme';
import { odaTheme } from './odaTheme'; // the theme file from before, unchanged

// A "blueprint" is a template for one kind of extension. ThemeBlueprint makes
// an extension that adds a theme to the app's theme picker.
const odaThemeExtension = ThemeBlueprint.make({
  name: 'oda-light', // extension name, becomes the id "theme:app/oda-light"
  params: {
    theme: {
      id: 'oda-light',   // id saved in the user's browser
      title: 'ODA',      // label shown in Settings > Appearance
      variant: 'light',
      // Explicit type for children fixes the "implicitly has an 'any' type" error
      Provider: ({ children }: { children: ReactNode }) => (
        <UnifiedThemeProvider theme={odaTheme}>{children}</UnifiedThemeProvider>
      ),
    },
  },
});

// A module attaches extensions to an existing plugin. Here it adds our theme
// to the built-in "app" plugin, which owns themes.
export const odaThemeModule = createFrontendModule({
  pluginId: 'app',
  extensions: [odaThemeExtension],
});