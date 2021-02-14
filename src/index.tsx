import * as React from 'react'
import {Component, useState, useEffect, createRef, Suspense, CSSProperties} from 'react'
import {render} from 'react-dom'
import {Canvas, useFrame, useThree, useLoader, SharedCanvasContext} from 'react-three-fiber'
import {ColladaLoader} from 'three/examples/jsm/loaders/ColladaLoader'
import {AnimationLoop} from 'animation-loop'

import bodyModelUrl from './models/body.dae'
import pmcModelUrl from './models/pmc.dae'
import pmcSkinModelUrl from './models/pmc_skin_.dae'
import pmcBumperModelUrl from './models/pmc_bumper.dae'

// Long live class components!

class App extends Component {
	private three: SharedCanvasContext | null = null

	astrobee = createRef<Object3D>()

	render = () => (
		<>
			<div style={styles.ui}>
				<label>
					<input type="checkbox" checked /> Clockwise rotation.
				</label>
			</div>

			<Canvas
				pixelRatio={window.devicePixelRatio}
				invalidateFrameloop={true} // use our own render loops
				camera={{position: [0, 0, 1], fov: 45}}
			>
				<WithThreeInternals render={this.onThreeReady} />

				<pointLight intensity={0.8} color="white" position={[20, 20, 20]} />
				<ambientLight intensity={0.4} color="white" />

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
		</>
	)

	// Our own animation loop so we can control it and save CPU when possible.
	loop = new AnimationLoop()
	rotationDirection = -1 // clockwise
	rotationY = 0

	onThreeReady = (three: SharedCanvasContext): null => {
		if (this.three) return null
		this.three = three

		const {gl: renderer, camera, scene} = this.three!

		this.loop.addBaseFn(() => {
			// If we control our own loop, we need to manually render the Three scene.
			renderer.render(scene, camera)
		})

		this.loop.addAnimationFn(() => {
			this.rotationY += 0.005 * this.rotationDirection

			this.astrobee.current!.rotation.y = this.rotationY

			// Stop this loop after a while (no more CPU usage)
			if (this.rotationY > 10) return false
		})

		this.loop.start()

		return null
	}
}

const styles: Record<string, CSSProperties> = {
	ui: {
		position: 'absolute',
		color: 'white',
		padding: 15,
	},
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

import type {Object3DNode} from 'react-three-fiber'
import type {Object3D} from 'three'

declare global {
	namespace JSX {
		interface IntrinsicElements {
			// This type is missing in react-three-fiber's JSX.IntrinsicElements definition.
			object3D: Object3DNode<Object3D, typeof Object3D>
		}
	}
}
