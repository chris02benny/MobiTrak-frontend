// Theme color constants matching the dark amber design specification
export const THEME_COLORS = {
  BACKGROUND: '#0D0D0D',      // Charcoal black
  CARD: '#1F1F1F',            // Dark gray
  PRIMARY: '#FFC107',         // Amber yellow
  TEXT_PRIMARY: '#FFFFFF',     // White
  TEXT_SECONDARY: '#B0B0B0',   // Light gray
  SUCCESS: '#4CAF50',          // Green
  ERROR: '#F44336',            // Red
  PRIMARY_HOVER: '#FFB300',
  PRIMARY_ACTIVE: '#FFA000'
};

// Utility functions for applying theme colors
export const getThemeStyles = {
  background: { backgroundColor: THEME_COLORS.BACKGROUND },
  card: { 
    backgroundColor: THEME_COLORS.CARD,
    boxShadow: '0 4px 10px rgba(255, 193, 7, 0.15)'
  },
  primaryText: { color: THEME_COLORS.TEXT_PRIMARY },
  secondaryText: { color: THEME_COLORS.TEXT_SECONDARY },
  primaryButton: {
    backgroundColor: THEME_COLORS.PRIMARY,
    color: '#000000',
    fontWeight: '600',
    transition: 'all 0.2s ease-in-out'
  },
  primaryButtonHover: {
    backgroundColor: THEME_COLORS.PRIMARY_HOVER
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: THEME_COLORS.PRIMARY,
    border: `1px solid ${THEME_COLORS.PRIMARY}`,
    transition: 'all 0.2s ease-in-out'
  },
  secondaryButtonHover: {
    backgroundColor: THEME_COLORS.CARD
  },
  input: {
    backgroundColor: THEME_COLORS.CARD,
    borderColor: THEME_COLORS.CARD,
    color: THEME_COLORS.TEXT_PRIMARY
  },
  inputFocus: {
    borderColor: THEME_COLORS.PRIMARY,
    outline: `2px solid ${THEME_COLORS.PRIMARY}`,
    outlineOffset: '2px'
  }
};


