export type GamePreferences = Readonly<{
  muted: boolean;
  automaticHearts: boolean;
  waitMode: boolean;
}>;

export const defaultGamePreferences: GamePreferences = {
  muted: false,
  automaticHearts: true,
  waitMode: false,
};
