'use client';

import { Suspense, useRef, useEffect, useMemo, MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { MorphTargets } from '@/lib/clinical-mapper';

interface AvatarProps {
  morphTargets: MorphTargets;
}

function Avatar({ morphTargets }: AvatarProps) {
  const { scene } = useGLTF('/models/avatar_morphable.glb');
  const meshRef = useRef<THREE.Mesh | null>(null);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetDictionary) {
        const mesh = child as THREE.Mesh;
        (meshRef as MutableRefObject<THREE.Mesh | null>).current = mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0x808080,
          roughness: 0.6,
          metalness: 0.1,
        });
      }
    });
  }, [clonedScene]);

  useFrame(() => {
    const currentMesh = meshRef.current;
    if (!currentMesh?.morphTargetDictionary || !currentMesh?.morphTargetInfluences) return;

    const dict = currentMesh.morphTargetDictionary;
    const influences = currentMesh.morphTargetInfluences;
    const lerpFactor = 0.08;

    Object.entries(morphTargets ?? {}).forEach(([key, value]) => {
      const index = dict[key];
      if (index !== undefined && influences[index] !== undefined) {
        influences[index] += ((value ?? 0) - influences[index]) * lerpFactor;
      }
    });
  });

  return (
    <Center>
      <primitive object={clonedScene} scale={1.5} />
    </Center>
  );
}

function StudioLighting() {
  return (
    <>
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 3, -5]} intensity={0.8} color="#e0e8ff" />
      <directionalLight position={[0, 5, -5]} intensity={0.6} color="#ffffff" />
      <ambientLight intensity={0.4} color="#f0f4f8" />
    </>
  );
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 1, 3);
    camera.lookAt(0, 1, 0);
  }, [camera]);
  return null;
}

interface ThreeViewerProps {
  morphTargets: MorphTargets;
}

export default function ThreeViewer({ morphTargets }: ThreeViewerProps) {
  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg overflow-hidden">
      <Canvas shadows>
        <CameraSetup />
        <StudioLighting />
        <Suspense fallback={null}>
          <Avatar morphTargets={morphTargets} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={5}
          target={[0, 1, 0]}
        />
      </Canvas>
    </div>
  );
}
