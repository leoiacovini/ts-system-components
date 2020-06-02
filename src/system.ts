import 'reflect-metadata'
import { topoSort, INode } from './toposort'

const dependenciesKey = Symbol('component:dependencies')
const constructorKey = Symbol('components:constructor')
const systemComponents = Symbol('components:systemComponents')

export type ClassType<T> = new (...args: any[]) => T
export interface Component {
  start(): Promise<any>,
  stop(): Promise<any>,
}

export interface Logger {
  info: (message: string) => void,
  error: (message: string, e?: Error) => void,
}

type ConstructorFn<N extends Component, Sys extends System, Deps extends keyof Sys> = (obj: Pick<Sys, Deps>) => N

function ComponentUsing<N extends Component, T extends System, K extends (keyof T)>(dependencies: K[] = [], build: ConstructorFn<N, T, K>): PropertyDecorator {
  return (target, key) => {
    const meta = Reflect.getMetadata(systemComponents, target) || [] as string[]
    Reflect.defineMetadata(systemComponents, [...meta, key], target)
    Reflect.defineMetadata(dependenciesKey, dependencies, target, key)
    Reflect.defineMetadata(constructorKey, build, target, key)
  }
}

function getSystemDecenciesGraph(system: System): INode[] {
  const components = Reflect.getMetadata(systemComponents, system) as string[]
  return components.map(key => ({ id: key, edges: system._getDependencies(key) }))
}

function getInitializationOrder<T extends System>(system: T): (keyof T)[] {
  const dependencyGraph = getSystemDecenciesGraph(system)
  return topoSort(dependencyGraph) as (keyof T)[]
}

async function startSystem<T extends System>(system: T): Promise<T> {
  const initializeOrder = getInitializationOrder(system)
  for (const componentName of initializeOrder) {
    const componentBuilder = system._getConstructor(componentName)
    const currentComponent = componentBuilder(system as any)
    try {
      system._setComponent(componentName, currentComponent)
      if (currentComponent.start !== undefined) {
        system.logger.info(`Starting ${componentName}...`)
        await currentComponent.start()
        system.logger.info(`${componentName} started with success!`)
      }
    } catch (e) {
      system.logger.error(`Error starting ${componentName!}`)
      system.logger.error(e)
      throw e
    }
  }
  return system
}

async function stopSystem<T extends System>(system: T): Promise<T> {
  const stopOrder = getInitializationOrder(system).reverse()
  system.logger.info(`Stopping System: Order ${stopOrder}`)
  for (const componentName of stopOrder) {
    const component = system._getComponent(componentName)
    system.logger.info(`Stopping ${componentName}...`)
    try {
      if (component !== undefined && component !== null) await component.stop()
    } catch (e) {
      system.logger.error(`Error stopping component ${componentName}`, e)
      console.error(e)
    }
    system.logger.info(`${componentName} stopped!`)
  }
  return system
}

export class System implements Component {

  static Using<N extends Component, T extends System, K extends (keyof T)>(this: ClassType<T>, dependencies: K[], build: ConstructorFn<N, T, K>) {
    return ComponentUsing(dependencies, build)
  }

  async start(): Promise<this> {
    return startSystem(this)
  }

  async stop() {
    return stopSystem(this)
  }

  /// You can provide your custom logger here
  logger: Logger = {
    info: (message: string) => console.log(message),
    error: (message: string, e?: Error) => console.error(message, e),
  }

  // Do not use directly anything down below
  _getComponent(componentName: (keyof this)): Component {
    return (this as any)[componentName]
  }

  _getDependencies(componentName: (keyof this) | string): string[] {
    return Reflect.getMetadata(dependenciesKey, this, componentName as string) || []
  }

  _getConstructor(componentName: (keyof this)): ConstructorFn<any, this, any> {
    return Reflect.getMetadata(constructorKey, this, componentName as string)
  }

  _setComponent(componentName: (keyof this), comp: any) {
    this[componentName] = comp
  }
}
