# react-three-boilerplate

### Structure

- `src/react` - your react app.
- `src/three` - your three app.
- `src/lib` - react-three-boilerplate libs, don't edit it.

### Functions

- `Tunnels.send(id, data)` - send data from three to react or react to three.
- `Tunnels.on(id, (data) => void)` - get data from react from three or three from react. return unsubscriber.