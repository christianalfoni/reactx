export class JSONStorage<T> {
  constructor(private key: string) {}

  load(): T | null {
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) {
        return JSON.parse(saved) as T;
      }
      return null;
    } catch (error) {
      console.error(`Failed to load from localStorage (${this.key}):`, error);
      return null;
    }
  }

  save(data: T): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save to localStorage (${this.key}):`, error);
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error(`Failed to clear localStorage (${this.key}):`, error);
    }
  }
}
