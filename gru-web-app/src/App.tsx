import './App.css'
import React from 'react'
import Canvas from './canvas/Canvas'

class App extends React.Component {
  render() {
    return (
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          width: '100%',
          paddingTop: '10px',
        }}
      >
        <Canvas/>
      </div>
    )
  }
}

export default App
