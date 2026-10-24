export class LiveClock {
  private origin: number;
  private elapsed = 0;
  private paused = false;
  constructor(private readonly now: () => number) {
    this.origin = now();
  }
  get seconds(): number {
    return this.elapsed + (this.paused ? 0 : this.now() - this.origin);
  }
  pause(): void {
    if (!this.paused) {
      this.elapsed = this.seconds;
      this.paused = true;
    }
  }
  resume(): void {
    if (this.paused) {
      this.origin = this.now();
      this.paused = false;
    }
  }
}
