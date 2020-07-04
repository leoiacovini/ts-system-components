# ts-system-components

This is a TypeScript library inspired by the [Clojure(script) components lib by Stuart Sierra](https://github.com/stuartsierra/component). Its job is to manage dependencies and lifecycle of statefull components in your application.

## Install

```
npm i ts-system-components
```

or

```
yarn add ts-system-components
```

## How to use

Each component of your system should implement the `Component` protocol. The `Component` protocol requires two methods, `start` and `stop`. These methods should be responsible for starting and stopping the component. They should return a Promise, and are usually used with async.

```ts
class Database implements Component {

  // Make this component require the Config component.
  private readonly config: Config
  constructor(config: Config) {
    this.config = config
  }

  async start() {
    this.connection = await createConnection()
  }

  async stop() {
    this.connection?.close()
  }

}
```

After defining your components, you can group them in a System, to describe the dependencies between them.

Your system should extend the `System` class, and each component should be a property annotated with the
`<YourSystemName>.Using()` Decorator. This Decorator receives two arguments. The first is the dependencies of this 
component, this should be a list of other components declared in your system. The second is a builder function which will receive a map
with the dependencies you requested, and should return a new instance of you component.

```ts
class MySystem extends System {

  @MySystem.Using([], () => new Config())
  config!: Config

  @MySystem.Using(['config'], ({config}) => new Database(config))
  database!: Database

}
```

To start the system you can just create a new instance and call `.start()`
The library will ensure that each component is instantiated and started before being provided to the downstream
components.

```ts
const system = new MySystem()
await system.start()
```

To stop the system, just call `stop()`

```ts
await system.stop()
```
