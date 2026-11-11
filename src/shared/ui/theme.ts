// Re-export the design token system. Components import from this module so
// the import path stays stable (`from '../shared/ui'`); the real values live
// in src/theme/tokens.ts, generated from spec/design-sticker-sheet.md.
export {
  colors,
  token,
  spacing,
  radius,
  shadow,
  typography,
  fontFamily,
} from '../../theme/tokens';
