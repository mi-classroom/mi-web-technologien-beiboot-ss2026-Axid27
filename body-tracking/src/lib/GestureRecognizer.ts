import type { Gesture, GestureInput, GestureEvent, GestureOutput } from './types';

export class GestureRecognizer {
  private gestures: Map<string, Gesture> = new Map();
  private lastOutputs: Map<string, GestureOutput> = new Map();

  register(name: string, gesture: Gesture): void {
    if (this.gestures.has(name)) {
      throw new Error(`Gesture "${name}" is already registered`);
    }
    this.gestures.set(name, gesture);
  }

  unregister(name: string): void {
    this.gestures.delete(name);
  }

  /**
   * Advances every registered gesture by one frame. Returns discrete trigger
   * events only (output.triggered === true) — for continuous data like a
   * pointer position, poll getOutput() instead.
   */
  update(input: GestureInput): GestureEvent[] {
    const events: GestureEvent[] = [];
    for (const [name, gesture] of this.gestures) {
      const output = gesture.update(input);
      this.lastOutputs.set(name, output);
      if (output.triggered) {
        events.push({ name, output });
      }
    }
    return events;
  }

  /** Returns the most recent output from the last update() call, for continuous/stream data. */
  getOutput(name: string): GestureOutput | null {
    return this.lastOutputs.get(name) ?? null;
  }

  getState(name: string): string | null {
    return this.gestures.get(name)?.state ?? null;
  }
}
