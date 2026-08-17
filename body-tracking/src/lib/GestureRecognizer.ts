import type { Gesture, GestureInput, GestureEvent } from './types';

export class GestureRecognizer {
  private gestures: Map<string, Gesture> = new Map();

  register(name: string, gesture: Gesture): void {
    if (this.gestures.has(name)) {
      throw new Error(`Gesture "${name}" is already registered`);
    }
    this.gestures.set(name, gesture);
  }

  unregister(name: string): void {
    this.gestures.delete(name);
  }

  update(input: GestureInput): GestureEvent[] {
    const events: GestureEvent[] = [];
    for (const [name, gesture] of this.gestures) {
      const output = gesture.update(input);
      if (output.triggered || output.position !== undefined || output.value !== undefined) {
        events.push({ name, output });
      }
    }
    return events;
  }

  getState(name: string): string | null {
    return this.gestures.get(name)?.state ?? null;
  }
}
