'use client';

import { Suspense, useRef, useEffect, useMemo, MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { MorphTargets } from '@/lib/clinical-mapper';

interface AvatarProps {
  morphTargets: MorphTargets;
  position?: [number, number, number];
}

function Avatar({ morphTargets, position = [0, 0, 0] }: AvatarProps) {
  const { scene } = useGLTF('/models/avatar_morphable.glb');
  const meshRef = useRef<THREE.Mesh | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetDictionary) {
        const mesh = child as THREE.Mesh;
        (meshRef as MutableRefObject<THREE.Mesh | null>).current = mesh;
        // Material cinza claro suave - estilo referência médica
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0xd8d4d0,  // Cinza claro
          roughness: 0.45,
          metalness: 0.0,
          flatShading: false,
          envMapIntensity: 0.8,
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
    <group ref={groupRef} position={position}>
      <primitive object={clonedScene} scale={1.0} position={[0, -1.0, 0]} />
    </group>
  );
}

function StudioLighting() {
  return (
    <>
      {/* Key light - frontal suave */}
      <directionalLight 
        position={[2, 4, 4]} 
        intensity={1.5} 
        color="#ffffff" 
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      {/* Fill light - lateral esquerda */}
      <directionalLight position={[-4, 3, 2]} intensity={0.8} color="#f0f5ff" />
      {/* Fill light - lateral direita */}
      <directionalLight position={[4, 3, 2]} intensity={0.8} color="#fff5f0" />
      {/* Rim/Back light */}
      <directionalLight position={[0, 3, -4]} intensity={0.6} color="#ffffff" />
      {/* Top light suave */}
      <directionalLight position={[0, 8, 0]} intensity={0.4} color="#ffffff" />
      {/* Ambiente forte para preencher sombras */}
      <ambientLight intensity={0.7} color="#f8f8f8" />
      {/* Hemisphere light para gradiente natural */}
      <hemisphereLight args={['#ffffff', '#c0c0c0', 0.5]} />
    </>
  );
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.5, 3.5);
    camera.lookAt(0, 0.3, 0);
  }, [camera]);
  return null;
}

interface ThreeViewerProps {
  morphTargets: MorphTargets;
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial 
        color="#b8b8b8" 
        roughness={0.95} 
        metalness={0} 
      />
    </mesh>
  );
}

function BackWall() {
  return (
    <mesh position={[0, 2, -3]} receiveShadow>
      <planeGeometry args={[20, 10]} />
      <meshStandardMaterial color="#c8c8c8" roughness={1.0} metalness={0} />
    </mesh>
  );
}

export default function ThreeViewer({ morphTargets }: ThreeViewerProps) {
  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-b from-gray-300 to-gray-400 rounded-lg overflow-hidden">
      <Canvas 
        shadows 
        camera={{ fov: 40, near: 0.1, far: 100 }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <color attach="background" args={['#c5c5c5']} />
        <fog attach="fog" args={['#c5c5c5', 6, 15]} />
        <CameraSetup />
        <StudioLighting />
        <Suspense fallback={null}>
          <Avatar morphTargets={morphTargets} />
          <Floor />
          <BackWall />
        </Suspense>
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={8}
          target={[0, 0.3, 0]}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.1}
        />
      </Canvas>
    </div>
  );
}
