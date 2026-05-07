import { GameMode } from "@/types";
import { NormalMode } from "./modes/normal-mode";

const modes: Record<string, GameMode> = {
  normal: NormalMode,
};

export function getGameMode(name: string): GameMode {
  const mode = modes[name.toLowerCase()];
  if (!mode) {
    throw new Error(`Game mode "${name}" not found. Available modes: ${Object.keys(modes).join(", ")}`);
  }
  return mode;
}

export function registerGameMode(name: string, mode: GameMode): void {
  modes[name.toLowerCase()] = mode;
}

export function listGameModes(): string[] {
  return Object.keys(modes);
}
