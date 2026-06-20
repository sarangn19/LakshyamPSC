import { TextStyle } from 'react-native';
import type { Locale } from '../i18n';

const mlFont = 'Malayalam';
const enFont = {
  display: 'Satoshi-Bold',
  body: 'Satoshi',
  bodyMedium: 'Satoshi-Medium',
  bodyLight: 'Satoshi-Light',
  bodySemiBold: 'Satoshi-Bold',
  bodyBold: 'Satoshi-Bold',
};

const mlFontFamily = {
  display: mlFont,
  body: mlFont,
  bodyMedium: mlFont,
  bodyLight: mlFont,
  bodySemiBold: mlFont,
  bodyBold: mlFont,
};

export const fontFamily = enFont;

export function getFontFamily(locale: Locale) {
  return locale === 'ml' ? mlFontFamily : enFont;
}

export function getTypography(locale: Locale): Record<string, TextStyle> {
  const f = getFontFamily(locale);
  return {
    displayXL: { fontSize: 40, fontWeight: '600', lineHeight: 48, fontFamily: f.display, letterSpacing: -0.5 },
    displayL: { fontSize: 32, fontWeight: '600', lineHeight: 40, fontFamily: f.display, letterSpacing: -0.3 },
    h1: { fontSize: 28, fontWeight: '600', lineHeight: 36, fontFamily: f.bodySemiBold, letterSpacing: -0.3 },
    h2: { fontSize: 24, fontWeight: '600', lineHeight: 32, fontFamily: f.bodySemiBold },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 28, fontFamily: f.bodySemiBold },
    bodyLarge: { fontSize: 18, fontWeight: '400', lineHeight: 28, fontFamily: f.body },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24, fontFamily: f.body },
    bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20, fontFamily: f.body },
    caption: { fontSize: 12, fontWeight: '500', lineHeight: 16, fontFamily: f.bodyMedium },
    overline: { fontSize: 11, fontWeight: '600', lineHeight: 14, fontFamily: f.bodySemiBold, letterSpacing: 0.5 },
    bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24, fontFamily: f.bodySemiBold },
    captionBold: { fontSize: 13, fontWeight: '600', lineHeight: 20, fontFamily: f.bodySemiBold },
    small: { fontSize: 12, fontWeight: '400', lineHeight: 16, fontFamily: f.body },
    tiny: { fontSize: 11, fontWeight: '400', lineHeight: 14, fontFamily: f.body },
  };
}

export const typography: Record<string, TextStyle> = {
  displayXL: { fontSize: 40, fontWeight: '600', lineHeight: 48, fontFamily: fontFamily.display, letterSpacing: -0.5 },
  displayL: { fontSize: 32, fontWeight: '600', lineHeight: 40, fontFamily: fontFamily.display, letterSpacing: -0.3 },
  h1: { fontSize: 28, fontWeight: '600', lineHeight: 36, fontFamily: fontFamily.bodySemiBold, letterSpacing: -0.3 },
  h2: { fontSize: 24, fontWeight: '600', lineHeight: 32, fontFamily: fontFamily.bodySemiBold },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28, fontFamily: fontFamily.bodySemiBold },
  bodyLarge: { fontSize: 18, fontWeight: '400', lineHeight: 28, fontFamily: fontFamily.body },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24, fontFamily: fontFamily.body },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20, fontFamily: fontFamily.body },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16, fontFamily: fontFamily.bodyMedium },
  overline: { fontSize: 11, fontWeight: '600', lineHeight: 14, fontFamily: fontFamily.bodySemiBold, letterSpacing: 0.5 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24, fontFamily: fontFamily.bodySemiBold },
  captionBold: { fontSize: 13, fontWeight: '600', lineHeight: 20, fontFamily: fontFamily.bodySemiBold },
  small: { fontSize: 12, fontWeight: '400', lineHeight: 16, fontFamily: fontFamily.body },
  tiny: { fontSize: 11, fontWeight: '400', lineHeight: 14, fontFamily: fontFamily.body },
};
