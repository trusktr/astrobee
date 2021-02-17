/* @jsxImportSource @lume/element */

import {useDefaultNames, Node, XYZNumberValuesPropertyFunction} from 'lume'
import {booleanAttribute, Element, element, numberAttribute, stringAttribute} from '@lume/element'

import bodyModelUrl from './models/body.dae'
import pmcModelUrl from './models/pmc.dae'
import pmcSkinModelUrl from './models/pmc_skin_.dae'
import pmcBumperModelUrl from './models/pmc_bumper.dae'

// Image from https://blog.kuula.co/360-images-ruben-frosali
import lunaStation from './materials/luna-station.jpg'

// Registers the LUME elements with their default tag names.
useDefaultNames()

type View = 'top' | 'side' | 'free'

// Long live HTML elements!

@element('astrobee-app')
export class App extends Element {
	@numberAttribute(1) rotationDirection: -1 | 1 = 1 // clockwise
	@numberAttribute(1) rotationAmount = 0.2 // degrees

	@booleanAttribute(true) rotationEnabled = true
	@stringAttribute('side') view: View = 'free'

	astrobee?: Node

	template = () => (
		<>
			<lume-scene webgl environment={lunaStation}>
				<lume-node align-point="0.5 0.5 0.5">
					<lume-camera-rig
						active={this.view === 'free'}
						initial-polar-angle="30"
						min-distance="0.4"
						max-distance="2"
						dolly-speed="0.002"
						initial-distance="1"
					/>
					<lume-node rotation={[this.view === 'top' ? -90 : 0, 0, 0]}>
						<lume-perspective-camera active={this.view !== 'free'} position="0 0 0.7" />
					</lume-node>
				</lume-node>

				<lume-point-light intensity="0.3" align-point="0.5 0.5 0.5" color="#a3ffff" position="0 90 0" />
				<lume-point-light intensity="0.3" align-point="0.5 0.5 0.5" color="#a3ffff" position="0 -90 0" />
				<lume-point-light intensity="0.3" align-point="0.5 0.5 0.5" color="#a3ffff" position="0 0 90" />
				<lume-point-light intensity="0.3" align-point="0.5 0.5 0.5" color="#a3ffff" position="0 0 -90" />
				<lume-point-light intensity="0.3" align-point="0.5 0.5 0.5" color="#a3ffff" position="90 80 0" />
				<lume-point-light intensity="0.3" align-point="0.5 0.5 0.5" color="#a3ffff" position="90 -80 0" />
				<lume-point-light intensity="0.3" align-point="0.5 0.5 0.5" color="#a3ffff" position="-90 80 0" />
				<lume-point-light intensity="0.3" align-point="0.5 0.5 0.5" color="#a3ffff" position="-90 -80 0" />

				<lume-node ref={this.astrobee} align-point="0.5 0.5 0.5" rotation={this.astrobeeRotation}>
					<lume-collada-model src={bodyModelUrl} />
					<lume-collada-model src={pmcModelUrl} />
					<lume-collada-model src={pmcSkinModelUrl} />
					<lume-collada-model src={pmcBumperModelUrl} />

					{/* The other side. */}
					<lume-node scale="1 1 -1">
						<lume-collada-model src={pmcModelUrl} />
						<lume-collada-model src={pmcSkinModelUrl} />
						<lume-collada-model src={pmcBumperModelUrl} />
					</lume-node>
				</lume-node>

				<lume-sphere
					has="basic-material"
					texture={lunaStation}
					color="white"
					align-point="0.5 0.5 0.5"
					mount-point="0.5 0.5 0.5"
					size="100 100 100"
					sidedness="double"
					cast-shadow="false"
					receive-shadow="false"
				/>
			</lume-scene>

			<div class="ui">
				<fieldset>
					<legend>Rotation</legend>
					<label>
						<input type="checkbox" checked={this.rotationEnabled} onChange={this.toggleRotation} /> Enable
						rotation.
					</label>
					<br />
					<label>
						<input
							type="checkbox"
							checked={this.rotationDirection < 0}
							onChange={this.toggleRotationDirection}
						/>{' '}
						Clockwise rotation.
					</label>
				</fieldset>
				<fieldset>
					<legend>View</legend>
					<label>
						<input type="radio" name="side" checked={this.view === 'side'} onChange={this.changeView} />{' '}
						Side view.
					</label>
					<br />
					<label>
						<input type="radio" name="top" checked={this.view === 'top'} onChange={this.changeView} /> Top
						view
					</label>
					<br />
					<label>
						<input type="radio" name="free" checked={this.view === 'free'} onChange={this.changeView} />{' '}
						Free view
					</label>
				</fieldset>
			</div>
		</>
	)

	css = /*css*/ `
		:host {
			width: 100%;
			height: 100%;
		}
		.ui {
			position: absolute;
			margin: 15px;
			padding: 10px;
			top: 0;
			left: 0;
			color: white;
            font-family: sans-serif;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 7px;
		}
        fieldset legend {
            color: #75c7c7;
        }
        fieldset {
            border-color: #75c7c7;
            border-radius: 4px;
        }
        fieldset:nth-child(2) legend {
            color: #c595c9;
        }
        fieldset:nth-child(2) {
            border-color: #c595c9;
            border-radius: 4px;
        }
	`

	private astrobeeRotation: XYZNumberValuesPropertyFunction = (x, y, z, _time) => [
		x,
		y + this.rotationAmount * this.rotationDirection,
		z,
	]

	private toggleRotation = () => {
		this.rotationEnabled = !this.rotationEnabled

		if (this.rotationEnabled) this.astrobee!.rotation = this.astrobeeRotation
		else this.astrobee!.rotation = () => false // stops rotation
	}

	private toggleRotationDirection = () => (this.rotationDirection *= -1)

	private changeView = (event: Event) => {
		const input = event.target as HTMLInputElement

		if (input.checked) this.view = input.name as View
	}
}
