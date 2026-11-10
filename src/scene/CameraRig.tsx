import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../store';

/** Smoothly moves the orbit camera to the goal set by view / angle buttons. */
export function CameraRig({ controlsRef }: { controlsRef: MutableRefObject<any> }) {
  const camera = useThree((s) => s.camera);

  useFrame((_, dt) => {
    const goal = useStore.getState().camGoal;
    const controls = controlsRef.current;
    if (!goal || !controls) return;

    const k = 1 - Math.pow(0.03, dt);
    const gp = new THREE.Vector3(...goal.pos);
    const gt = new THREE.Vector3(...goal.target);
    camera.position.lerp(gp, k);
    controls.target.lerp(gt, k);
    controls.update();

    if (camera.position.distanceTo(gp) < 0.05 && controls.target.distanceTo(gt) < 0.05) {
      useStore.getState().clearGoal();
    }
  });

  return null;
}
