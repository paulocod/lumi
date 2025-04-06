import { cemigLayout } from './cemig/cemig.layout';

export const layouts = {
  CEMIG: cemigLayout,
};

export type LayoutName = keyof typeof layouts;
