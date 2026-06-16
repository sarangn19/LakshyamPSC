import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const typography: Record<string, TextStyle> = {
  display: { fontSize: 32, fontWeight: '700', lineHeight: 40, fontFamily: fontFamily.bold },
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36, fontFamily: fontFamily.bold },
  h2: { fontSize: 24, fontWeight: '600', lineHeight: 32, fontFamily: fontFamily.semibold },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28, fontFamily: fontFamily.semibold },
  bodyLarge: { fontSize: 18, fontWeight: '400', lineHeight: 26, fontFamily: fontFamily.regular },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24, fontFamily: fontFamily.regular },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20, fontFamily: fontFamily.regular },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16, fontFamily: fontFamily.medium },
  overline: { fontSize: 11, fontWeight: '600', lineHeight: 14, fontFamily: fontFamily.semibold },

  h4: { fontSize: 18, fontWeight: '600', lineHeight: 24, fontFamily: fontFamily.semibold },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24, fontFamily: fontFamily.semibold },
  captionBold: { fontSize: 14, fontWeight: '600', lineHeight: 20, fontFamily: fontFamily.semibold },
  small: { fontSize: 12, fontWeight: '400', lineHeight: 16, fontFamily: fontFamily.regular },
  tiny: { fontSize: 10, fontWeight: '400', lineHeight: 14, fontFamily: fontFamily.regular },
};
