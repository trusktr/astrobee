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
