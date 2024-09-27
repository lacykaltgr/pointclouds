/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DoubleSide, Group, MeshBasicMaterial } from 'three';
import { GlobalComponent, gltfLoader } from './global';

import { ARButton } from 'ratk';
import { PCDLoader } from 'three/addons/loaders/PCDLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { System } from 'elics';
import { prefabs } from './constants';
import { PointCloudOctree, Potree } from 'potree-loader';



const CAMERA_ANGULAR_SPEED = Math.PI / 2;
const ORBIT_CONTROL_POLAR_ANGLE = 1.0831800840797905;

export class InlineSystem extends System {
	init() {
		this.needsSetup = true;
	}

	_setupButtons(renderer, sneaker) {
		const arButton = document.getElementById('ar-button');
		const webLaunchButton = document.getElementById('web-launch-button');
		webLaunchButton.style.display = 'none';
		ARButton.convertToARButton(arButton, renderer, {
			ENTER_XR_TEXT: 'Customize in MR',
			requiredFeatures: [
				'hit-test',
				'plane-detection',
				'mesh-detection',
				'anchors',
			],
			optionalFeatures: ['local-floor', 'bounded-floor', 'layers'],
			onUnsupported: () => {
				arButton.style.display = 'none';
				webLaunchButton.style.display = 'block';
			},
		});
		webLaunchButton.onclick = () => {
			window.open(
				'https://www.oculus.com/open_url/?url=' +
					encodeURIComponent(window.location.href),
			);
		};
		const genderSetting = document.getElementsByClassName('gender-options')[0];
		genderSetting.dataset.value = 'mens';
		const mensButton = document.getElementById('gender-mens');
		const womensButton = document.getElementById('gender-womens');
		mensButton.onclick = () => {
			genderSetting.dataset.value = 'mens';
			mensButton.classList.toggle('selected', true);
			womensButton.classList.toggle('selected', false);
		};
		womensButton.onclick = () => {
			genderSetting.dataset.value = 'womens';
			mensButton.classList.toggle('selected', false);
			womensButton.classList.toggle('selected', true);
		};

		const sizeOptions = document.getElementsByClassName('size-options')[0];
		const sizeButtons = new Array(...sizeOptions.getElementsByClassName('btn'));
		sizeButtons.forEach((button) => {
			button.onclick = () => {
				sizeButtons.forEach((button) => {
					button.classList.toggle('selected', false);
				});
				button.classList.toggle('selected', true);
				sizeOptions.dataset.value = button.innerHTML;
			};
		});

		const prefabButtons = [...document.getElementsByClassName('prefab-btn')];
		prefabButtons.forEach((buttonElement) => {
			const prefabId = buttonElement.id.split('-')[1];
			buttonElement.onclick = () => {
				prefabButtons.forEach((buttonElement) => {
					buttonElement.classList.toggle('selected', false);
				});
				buttonElement.classList.toggle('selected', true);
				sneaker.setPrefab(prefabs[prefabId]);
			};
		});
	}

	update() {
		const { scene, camera, renderer, sneakerLeft, sneakerRight} =
			this.getEntities(this.queries.global)[0].getComponent(GlobalComponent);

		if (!sneakerLeft || !sneakerRight) return;

		if (this.needsSetup) {
			this._setupButtons(renderer, sneakerLeft);
			this.needsSetup = false;
			
			this.potree = new Potree();
			this.pointClouds = [];
			this.container = new Group();
			//gltfLoader.load('assets/gltf/shadow.gltf', (gltf) => {
			//	gltf.scene.children.forEach((node) => {
			//		const newMat = new MeshBasicMaterial({
			//			map: node.material.map,
			//			side: DoubleSide,
			//		});
			//		node.material = newMat;
			//	});

			//	this.container.add(gltf.scene);
			//});
			//scene.add(this.container);

			const baseUrl = "assets/PotreeConverted/";
			this.potree
				.loadPointCloud(
					// The name of the point cloud which is to be loaded.
					'metadata.json',
					// Given the relative URL of a file, should return a full URL (e.g. signed).
					relativeUrl => `${baseUrl}${relativeUrl}`,
				)
				.then(pco => {
					this.pointClouds.push(pco);
					this.container.add(pco);
					//pco.material.size = 1.0;
					console.log("loaded potree pcd")
				});


			camera.position.set(0.2, 0.2, 2.2);

			//const pointsClone = meshMap.clone();
			//const sneakerLeftClone = sneakerLeft.createCopy();
			//sneakerLeftClone.rotateZ(-Math.PI / 12);
			//const sneakerRightClone = sneakerRight.createCopy();
			//sneakerRightClone.rotateZ(-Math.PI / 12);
			//this.container.add(sneakerLeftClone, sneakerRightClone, pointsClone);
			//this.container.add(pointsClone);
			scene.add(this.container);

			// add multi line comment
			//this.orbitControls = new OrbitControls(camera, renderer.domElement);
			//this.orbitControls.target.set(0, 0.05, 0);
			//this.orbitControls.update();
			//this.orbitControls.enableZoom = false;
			//this.orbitControls.enablePan = false;
			//this.orbitControls.enableDamping = true;
			//this.orbitControls.autoRotate = true;
			//this.orbitControls.rotateSpeed *= -0.5;
			//this.orbitControls.autoRotateSpeed = CAMERA_ANGULAR_SPEED;
			//this.orbitControls.minPolarAngle = ORBIT_CONTROL_POLAR_ANGLE;
			//this.orbitControls.maxPolarAngle = ORBIT_CONTROL_POLAR_ANGLE;

			//this.fpsControls = new FirstPersonControls(camera, renderer.domElement);
			//this.fpsControls.movementSpeed = 5;
			//this.fpsControls.lookSpeed = 0.1;

			renderer.xr.addEventListener('sessionstart', () => {
				this.container.visible = false;
			});

			renderer.xr.addEventListener('sessionend', () => {
				this.container.visible = true;
				camera.position.set(0, 0.2, 0.3);
			});
			return;
		}

		if (this.container.visible) {
			//this.orbitControls.update();
			this.potree.updatePointClouds(this.pointClouds, camera, renderer);
			//this.fpsControls.update(0.01);
		}
	}
}

InlineSystem.queries = {
	global: { required: [GlobalComponent] },
};

