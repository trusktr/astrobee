import * as React from 'react'
import {useLoader} from 'react-three-fiber'
import {ColladaLoader} from 'three/examples/jsm/loaders/ColladaLoader'

export function ColladaModel({url}: {url: string}) {
	const collada = useLoader(ColladaLoader, url)
	return <primitive object={collada.scene} />
}
