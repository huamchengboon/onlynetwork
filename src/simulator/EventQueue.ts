// Event Queue for deterministic packet processing

import type { SimEvent } from './types';

export class EventQueue {
    private queue: SimEvent[] = [];
    private time: number = 0;

    enqueue(event: Omit<SimEvent, 'time'>): void {
        this.queue.push({
            ...event,
            time: this.time,
        });
    }

    dequeue(): SimEvent | undefined {
        return this.queue.shift();
    }

    isEmpty(): boolean {
        return this.queue.length === 0;
    }

    size(): number {
        return this.queue.length;
    }

    tick(): void {
        this.time++;
    }

    getTime(): number {
        return this.time;
    }

    clear(): void {
        this.queue = [];
        this.time = 0;
    }

    // For debugging
    peek(): SimEvent | undefined {
        return this.queue[0];
    }

    getAll(): SimEvent[] {
        return [...this.queue];
    }
}
