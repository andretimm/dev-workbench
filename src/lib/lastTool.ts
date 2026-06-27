let lastToolId: string | null = null;

export function getLastToolId(): string | null {
  return lastToolId;
}

export function setLastToolId(id: string): void {
  lastToolId = id;
}
