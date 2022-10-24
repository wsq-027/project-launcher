import type { Core } from './core'

declare abstract class BaseClient {
  core: Core
  abstract start(): void
  abstract throws(e: Error): void
  abstract afterStart(): void
}

declare class DesktopClient extends BaseClient {
  override start(): void
  override throws(e: Error): void
  override afterStart(): void
}

declare class WebClient extends BaseClient {
  override start(): void
  override throws(e: Error): void
  override afterStart(): void
}
