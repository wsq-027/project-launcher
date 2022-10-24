import type Emitter from 'events'
import type { Proc, ProcessDescription } from 'pm2'
import type { Express, Request } from 'express-serve-static-core'
import type { Server } from 'http'

type ProjectName = string

export declare type ProjectItem = {
  name: ProjectName
  urlPrefix: string
  proxyHost: string
  isStart: boolean
  isLocal: true
  dir: string
  script?: string
} | {
  name: ProjectName
  urlPrefix: string
  proxyHost: string
  isStart: boolean
  isLocal: false
}

type ProjectQuery = { name: ProjectName }

export declare class Core {
  pm: ProcessManager
  ps: ProxyServer
  store: ProjectStore

  init(): void

  addProject(project: ProjectItem): Promise<ProjectItem>
  startProject(query: ProjectQuery): Promise<void>
  stopProject(query: ProjectQuery): Promise<void>
  removeProject(query: ProjectQuery): Promise<void>
  listProject(): Promise<void>
  detailProject(): Promise<ProjectItem>
  exit(): Promise<void>
}

export declare class ProcessManager {
  connect(): Promise<void>
  addProcess(name: ProjectName, projectDir: string, projectScript: string): Promise<Proc>
  removeProcess(name: ProjectName): Promise<void>
  detailProcess(name: ProjectName): Promise<ProcessDescription>
  listProcess(): Promise<ProcessDescription[]>
  disconnect(): void
}

export declare class ProxyServer {
  app: Express
  logs: ProxyLogs
  port?: number

  addProxy(path: string, proxyHost): void
  removeProxy(path: string): void
  start(port: number): Server
}

export declare class ProxyLogs extends Emitter {
  log(req: Request, host: string, url: string): void
  error(e: Error): void
}

export declare class ProjectStore implements Iterable<ProjectItem> {
  add(project: ProjectItem): void
  update(name: ProjectName, project: ProjectItem): void
  remove(name: ProjectName): void
  has(name: ProjectName): boolean
  get(name: ProjectName): ProjectItem
  [Symbol.iterator](): Iterator<ProjectItem>
}