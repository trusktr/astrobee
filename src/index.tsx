import * as React from 'react'
import {Component} from 'react'
import {render} from 'react-dom'

// Long live class components!

class App extends Component {
	render = () => <div>Hello!</div>
}

render(<App />, document.getElementById('root'))
