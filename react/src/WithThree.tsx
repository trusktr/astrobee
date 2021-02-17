import * as React from 'react'
import {useState, useEffect} from 'react'
import {useFrame, useThree, SharedCanvasContext} from 'react-three-fiber'

interface WithThreeInternalsProps {
	render: (three: SharedCanvasContext) => JSX.Element | null
	onAnimationFrame?: (three: SharedCanvasContext, deltaTime: number) => void
}

// This is a pass-through React Hooks component in order to get around
// react-three-fiber requiring Hooks be children of <Canvas>, so that we can
// break out into our class component.
export function WithThree({render, onAnimationFrame}: WithThreeInternalsProps): JSX.Element | null {
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
