'use client';

import { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MorphTargets } from '@/lib/clinical-mapper';

interface AvatarProps {
  morphTargets: MorphTargets;
  position?: [number, number, number];
}

function Avatar({ morphTargets, position = [0, 0, 0] }: AvatarProps) {
  const gltf = useGLTF('/models/avatar_morphable.glb');
  const meshRef = useRef<THREE.SkinnedMesh | THREE.Mesh | null>(null);
  const morphTargetsRef = useRef<MorphTargets>(morphTargets);

  // Atualizar ref quando morphTargets mudar
  useEffect(() => {
    morphTargetsRef.current = morphTargets;
  }, [morphTargets]);

  // Mapeamento fixo de nomes para índices
  const morphIndexMap: Record<string, number> = useMemo(() => ({
    'Weight': 0,
    'AbdomenGirth': 1,
    'MuscleMass': 2,
    'Posture': 3,
    'DiabetesEffect': 4,
    'HypertensionEffect': 5,
    'HeartDiseaseEffect': 6,
  }), []);

  // Clonar a cena para evitar compartilhamento entre instâncias
  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        // Clonar geometria para ter morph targets independentes
        if (mesh.geometry) {
          mesh.geometry = mesh.geometry.clone();
        }
        
        // Configurar material
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0xe8e4e0,
          roughness: 0.4,
          metalness: 0.0,
          flatShading: false,
          envMapIntensity: 0.8,
          side: THREE.DoubleSide,
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Guardar referência do mesh com morph targets
        if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
          meshRef.current = mesh;
        }
      }
    });
    
    return clone;
  }, [gltf.scene]);

  // Aplicar morph targets a cada frame
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh?.morphTargetInfluences) return;

    const influences = mesh.morphTargetInfluences;
    const currentMorphTargets = morphTargetsRef.current;
    const lerpFactor = 0.15;

    Object.entries(currentMorphTargets).forEach(([key, value]) => {
      const index = morphIndexMap[key];
      if (index !== undefined && index < influences.length) {
        const targetValue = typeof value === 'number' ? value : 0;
        const currentValue = influences[index];
        influences[index] = currentValue + (targetValue - currentValue) * lerpFactor;
      }
    });
  });

  return (
    <group position={position}>
      <primitive object={clonedScene} scale={1.0} />
    </group>
  );
}

function StudioLighting() {
  return (
    <>
      <directionalLight 
        position={[2, 4, 4]} 
        intensity={1.5} 
        color="#ffffff" 
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-4, 3, 2]} intensity={0.8} color="#f0f5ff" />
      <directionalLight position={[4, 3, 2]} intensity={0.8} color="#fff5f0" />
      <directionalLight position={[0, 3, -4]} intensity={0.6} color="#ffffff" />
      <directionalLight position={[0, 8, 0]} intensity={0.4} color="#ffffff" />
      <ambientLight intensity={0.7} color="#f8f8f8" />
      <hemisphereLight args={['#ffffff', '#c0c0c0', 0.5]} />
    </>
  );
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.9, 3.0);
    camera.lookAt(0, 0.85, 0);
  }, [camera]);
  return null;
}

interface ThreeViewerProps {
  morphTargets: MorphTargets;
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#b8b8b8" roughness={0.95} metalness={0} />
    </mesh>
  );
}

function BackWall() {
  return (
    <mesh position={[0, 3, -3]} receiveShadow>
      <planeGeometry args={[20, 12]} />
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
          target={[0, 0.85, 0]}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.1}
        />
      </Canvas>
    </div>
  );
}
