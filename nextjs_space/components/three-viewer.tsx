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
        // Material cinza clínico de alta qualidade (similar à imagem de referência)
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0xc8c4c0,  // Cinza claro levemente quente
          roughness: 0.65,
          metalness: 0.0,
          flatShading: false,
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
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
      {/* Key light - principal */}
      <directionalLight position={[3, 4, 5]} intensity={1.8} color="#ffffff" castShadow />
      {/* Fill light - preenchimento */}
      <directionalLight position={[-3, 2, 3]} intensity={0.9} color="#e8f0ff" />
      {/* Rim light - contorno */}
      <directionalLight position={[0, 3, -4]} intensity={0.7} color="#ffffff" />
      {/* Top light */}
      <directionalLight position={[0, 6, 0]} intensity={0.5} color="#ffffff" />
      {/* Ambiente */}
      <ambientLight intensity={0.5} color="#f5f5f5" />
    </>
  );
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.9, 2.5);
    camera.lookAt(0, 0.85, 0);
  }, [camera]);
  return null;
}

interface ThreeViewerProps {
  morphTargets: MorphTargets;
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#a8a8a8" roughness={0.9} metalness={0} />
    </mesh>
  );
}

export default function ThreeViewer({ morphTargets }: ThreeViewerProps) {
  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-b from-slate-200 via-slate-100 to-slate-50 rounded-lg overflow-hidden">
      <Canvas shadows camera={{ fov: 45, near: 0.1, far: 100 }}>
        <color attach="background" args={['#b8b8b8']} />
        <fog attach="fog" args={['#b8b8b8', 3, 10]} />
        <CameraSetup />
        <StudioLighting />
        <Suspense fallback={null}>
          <Avatar morphTargets={morphTargets} />
          <Floor />
        </Suspense>
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minDistance={1.0}
          maxDistance={6}
          target={[0, 0.85, 0]}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.15}
        />
      </Canvas>
    </div>
  );
}
