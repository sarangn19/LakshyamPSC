import { TextStyle } from 'react-native';

export const fontFamily = {
  display: 'Satoshi-Bold',
  body: 'Satoshi',
  bodyMedium: 'Satoshi-Medium',
  bodyLight: 'Satoshi-Light',
  bodySemiBold: 'Satoshi-Bold',
  bodyBold: 'Satoshi-Bold',
};

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

  // Utility aliases
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24, fontFamily: fontFamily.bodySemiBold },
  captionBold: { fontSize: 13, fontWeight: '600', lineHeight: 20, fontFamily: fontFamily.bodySemiBold },
  small: { fontSize: 12, fontWeight: '400', lineHeight: 16, fontFamily: fontFamily.body },
  tiny: { fontSize: 11, fontWeight: '400', lineHeight: 14, fontFamily: fontFamily.body },
};
