import * as React from 'react'
import {Component, useState, useEffect, createRef, Suspense, CSSProperties, FormEvent} from 'react'
import {render} from 'react-dom'
import {Canvas, useFrame, useThree, useLoader, SharedCanvasContext} from 'react-three-fiber'
import {ColladaLoader} from 'three/examples/jsm/loaders/ColladaLoader'
import {AnimationLoop} from 'animation-loop'

import bodyModelUrl from './models/body.dae'
import pmcModelUrl from './models/pmc.dae'
import pmcSkinModelUrl from './models/pmc_skin_.dae'
import pmcBumperModelUrl from './models/pmc_bumper.dae'

import type {Object3DNode} from 'react-three-fiber'
import type {Object3D, PerspectiveCamera} from 'three'

type View = 'top' | 'side'

interface State {
	rotationDirection: number
	rotationEnabled: boolean
	view: View
}

// Long live class components!
class App extends Component<{}, State> {
	state = {
		rotationDirection: -1, // clockwise
		rotationEnabled: true,
		view: 'side',
	} as State

	private astrobee = createRef<Object3D>()
	private cam = createRef<PerspectiveCamera>()

	render = () => (
		<>
			<Canvas
				pixelRatio={window.devicePixelRatio}
				invalidateFrameloop={true} // use our own render loops
				// camera={{position: [0, 0, 1], fov: 45, lookAt: [0, 0, 0]}}
			>
				<WithThreeInternals render={this.onThreeReady} />

				<pointLight intensity={0.8} color="white" position={[20, 20, 20]} />
				<ambientLight intensity={0.4} color="white" />

				<object3D rotation={[this.state.view === 'top' ? -Math.PI / 2 : 0, 0, 0]}>
					<perspectiveCamera ref={this.cam} position={[0, 0, 1]} fov={45} />
				</object3D>

				<Suspense fallback={<></>}>
					<object3D ref={this.astrobee}>
						<ColladaModel url={bodyModelUrl} />

						<ColladaModel url={pmcModelUrl} />
						<ColladaModel url={pmcSkinModelUrl} />
						<ColladaModel url={pmcBumperModelUrl} />

						{/* Not sure what's the actual orientation of the other
						side of astrobee, but this is good enough for the demo
						concept. */}
						<object3D scale={[1, 1, -1]}>
							{/* The "?1" strings appended to the URLs make
							react-three-fiber use new model objects instead of
							cached model objects, otherwise the model from the
							other side would get re-used here we'll and we see
							only one side (the cached model object would be
							re-parented). */}
							<ColladaModel url={pmcModelUrl + '?1'} />
							<ColladaModel url={pmcSkinModelUrl + '?1'} />
							<ColladaModel url={pmcBumperModelUrl + '?1'} />
						</object3D>
					</object3D>
				</Suspense>
			</Canvas>

			<div style={styles.ui}>
				<fieldset>
					<legend>Rotation</legend>
					<label>
						<input type="checkbox" checked={this.state.rotationEnabled} onChange={this.toggleRotation} />{' '}
						Enable rotation.
					</label>
					<br />
					<label>
						<input
							type="checkbox"
							checked={this.state.rotationDirection < 0}
							onChange={this.toggleRotationDirection}
						/>{' '}
						Clockwise rotation.
					</label>
				</fieldset>
				<fieldset>
					<legend>View</legend>
					<label>
						<input
							type="radio"
							name="side"
							checked={this.state.view === 'side'}
							onChange={this.changeView}
						/>{' '}
						Side view.
					</label>
					<br />
					<label>
						<input type="radio" name="top" checked={this.state.view === 'top'} onChange={this.changeView} />{' '}
						Top view
					</label>
				</fieldset>
			</div>
		</>
	)

	private three: SharedCanvasContext | null = null

	// Our own animation loop so we can control it and save CPU when there is
	// no rendering to perform.
	private loop = new AnimationLoop()

	private rotationY = 0

	private toggleRotation = () => {
		const rotationEnabled = !this.state.rotationEnabled

		this.setState({rotationEnabled})

		// If the `loop` instance has animation functions, then the loop will
		// have repeated animation frames for calling the animation functions.
		// If the `loop` instance has no animation functions (they've all been
		// removed or have completed), no animation frames fire thus no CPU is
		// wasted.
		if (rotationEnabled) this.loop.addAnimationFn(this.rotateAstrobee)
		else this.loop.removeAnimationFn(this.rotateAstrobee)
	}

	private rotateAstrobee = () => {
		this.rotationY += 0.005 * this.state.rotationDirection
		this.astrobee.current!.rotation.y = this.rotationY
	}

	private toggleRotationDirection = () => this.setState({rotationDirection: this.state.rotationDirection * -1})

	private onThreeReady = (three: SharedCanvasContext): null => {
		if (this.three) return null
		this.three = three

		const {gl: renderer, scene, setDefaultCamera} = this.three!
		const camera = this.cam.current!

		this.three.setDefaultCamera(camera)

		// A base function runs after any animation frame, if any. Existence of
		// a base function does not cause animation frames.
		this.loop.addBaseFn(() => {
			// If we control our own loop, we need to manually render the Three scene.
			renderer.render(scene, camera)
		})

		// start initial rotation
		this.loop.addAnimationFn(this.rotateAstrobee)

		this.loop.start()

		return null
	}

	private changeView = (event: FormEvent<HTMLInputElement>) => {
		const input = event.target as HTMLInputElement

		if (input.checked) this.setState({view: input.name as View})
	}
}

const styles = {
	ui: {
		position: 'absolute',
		color: 'white',
		padding: 15,
		top: 0,
		left: 0,
	} as CSSProperties,
}

function ColladaModel({url}: {url: string}) {
	const collada = useLoader(ColladaLoader, url)
	return <primitive object={collada.scene} />
}

interface WithThreeInternalsProps {
	render: (three: SharedCanvasContext) => JSX.Element | null
	onAnimationFrame?: (three: SharedCanvasContext, deltaTime: number) => void
}

// This is a pass-through React Hooks component in order to get around
// react-three-fiber requiring Hooks be children of <Canvas>, so that we can
// break out into our class component.
function WithThreeInternals({render, onAnimationFrame}: WithThreeInternalsProps): JSX.Element | null {
	const three: SharedCanvasContext = useThree()
	const [_children, setChildren] = useState<JSX.Element | null>(null)

	useFrame((...args) => onAnimationFrame?.(...args))

	useEffect(() => {
		setChildren(render(three))

		// nothing to clean up
		return () => {}
	}, [three])

	return <>{_children}</>
}

render(<App />, document.getElementById('root'))

declare global {
	namespace JSX {
		interface IntrinsicElements {
			// This type is missing in react-three-fiber's JSX.IntrinsicElements definition.
			object3D: Object3DNode<Object3D, typeof Object3D>
		}
	}
}
