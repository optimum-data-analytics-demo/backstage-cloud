// packages/app/src/theme/odaTheme.ts

import {
  createUnifiedTheme, // builds one theme that works for both MUI v4 and v5 components
  genPageTheme,       // generates the banner (gradient + shape) at the top of each page
  palettes,           // Backstage's built-in light/dark base palettes
  shapes,             // decorative shapes drawn on the page header (wave, round, etc.)
} from '@backstage/theme';

// ---------- Brand colors (from the ODA style guide) ----------
// Keeping them as constants means you change a color in one place only.
const COLORS = {
  headerLeft: '#FF5733',   // Example: Bright orange-red for the left side
  headerRight: '#C70039',  // Example: Deep crimson for the right side


  calloutBg: '#0B132A',  // darkest navy: sidebar and header background
  heading: '#001546',    // heading text and header gradient
  pageBg: '#f1efefb2',     // grey page background
  button: '#01225b',     // red: buttons and active-item indicator
  highlight: '#FFA400',  // orange: highlighted cards and secondary actions
  subText: '#1C1C1C',    // near-black: body text
};

// ---------- Heading style helper ----------
// Every h1-h6 needs fontFamily, color, fontSize, fontWeight and marginBottom.
// This function fills all of them so we don't repeat the same block six times.
const heading = (fontSize: number, marginBottom: number) => ({
  fontFamily: '"Noto Serif", serif', // headings use Noto Serif
  color: COLORS.heading,
  fontSize,
  fontWeight: 700,
  marginBottom,
});

// Every page type (home, service, docs...) shares the same navy banner.
// Only the shape on top of it changes.
const pageBanner = (shape: string) =>
  genPageTheme({ colors: [COLORS.heading, COLORS.calloutBg], shape });

export const odaTheme = createUnifiedTheme({
  // ---------- Colors ----------
  palette: {
    ...palettes.light, // start from the default light palette, then override what we need

    primary: { main: COLORS.button },     // contained buttons, links, focus color
    secondary: { main: COLORS.highlight }, // secondary buttons and accents

    background: {
    //   default: COLORS.pageBg, // the page behind everything
      paper: COLORS.pageBg       // cards, tables and dialogs stay white so text is readable
    },

    text: {
      primary: COLORS.subText,
      secondary: COLORS.subText,
    },

    // Left sidebar
    navigation: {
      background: COLORS.calloutBg,        // sidebar background
      indicator: COLORS.button,            // small bar that marks the active item
      color: '#d4d4d4',                    // normal item text and icon color
      selectedColor: '#FFFFFF',            // active item text and icon color
      navItem: { hoverBackground: COLORS.heading }, // color when hovering over an item
    },
  },

  // ---------- Typography ----------
  typography: {
    htmlFontSize: 16,                         // base size used to compute rem values
    fontFamily: '"Noto Sans", sans-serif',    // default font for all body text
    h1: heading(32, 10),
    h2: heading(28, 8),
    h3: heading(24, 8),
    h4: heading(20, 6),
    h5: heading(18, 6),
    h6: heading(16, 4),
  },

  // ---------- Page header banners ----------
  // Backstage picks the banner by the page "theme" id.
  // Entities pick it from their `spec.type` (service, website, library...).
  defaultPageTheme: 'home', // used when a page doesn't specify one
  pageTheme: {
    home: pageBanner(shapes.wave),
    documentation: pageBanner(shapes.wave2), // TechDocs pages
    tool: pageBanner(shapes.round),
    service: pageBanner(shapes.wave),
    website: pageBanner(shapes.wave),
    library: pageBanner(shapes.wave),
    other: pageBanner(shapes.wave),
    app: pageBanner(shapes.wave),
  },

  // ---------- Component-level overrides ----------
  // Use this for things the palette can't control on its own.
  components: {
    MuiButton: {
      styleOverrides: {
        // Only applies to <Button variant="contained" color="primary">
        containedPrimary: {
          backgroundColor: COLORS.button,
          '&:hover': { backgroundColor: '#d92c2c' }, // slightly darker red on hover
        },
      },
    },
  },
});