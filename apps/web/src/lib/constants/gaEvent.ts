export const GA_EVENT = {
  PASS_BOARD_CLICK: 'pass_board_click',
} as const;

export type GAEvent = (typeof GA_EVENT)[keyof typeof GA_EVENT];
