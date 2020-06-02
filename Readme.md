# ts-system-components

This is a TypeScript library inspired by the Clojure(script) components lib by Stuart Sierra. It's job is to manage dependency and lifecycle of statefull components in your application.

## Install

```
npm i ts-system-components
```

or

```
yarn add ts-system-components
```

## How to use

Each component of your system should implement the `Component` protocol. The `Component` protocol require two methods,
the `start` and `stop`, each one should be responsible for starting and stopping the component. (they should return a Promise, and are usually used with async).
```ts
class Database extends Component {

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

After having your components, you can group them in a System, to describe dependency between them.

You shoould make your system extend the `System` class, and each component should be a property annotated with the
`<YourSystemName>.Using()` Decorator. This Decorator receive two arguments, the first is the dependencies of this 
components (that should be other components declared in your system), and a builder function, that will receive a map
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
The library will ensure that each component is instanciated and started before being provided to the downstream
components.

```ts
const system = new MySystem()
await system.start()
```

To stop the system, just call `stop()`

```ts
await system.stop()
```
