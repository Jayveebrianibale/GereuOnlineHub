/**
 * Below are the colors that are used in the app. The colors are defined for light mode only.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0E7490'; // teal-600
const tintColorDark = '#22D3EE'; // cyan-400 for dark pop

export const Colors = {
  light: {
    text: '#0B1220',
    background: '#F8FAFC',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FFFFFF',
    background: '#0B1220',
    tint: tintColorDark,
    icon: '#CBD5E1',
    tabIconDefault: '#475569',
    tabIconSelected: tintColorDark,
  },
};
