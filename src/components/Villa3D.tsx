import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";

function Villa() {
  const g = useRef<THREE.Group>(null);
  useFrame((_, d) => { if (g.current) g.current.rotation.y += Math.min(d, 0.05) * 0.18; });
  const win = (p: [number, number, number], s: [number, number, number] = [0.5, 0.45, 0.02]) => (
    <mesh position={p}><boxGeometry args={s} /><meshStandardMaterial color="#ffc36b" emissive="#ffb04a" emissiveIntensity={1.6} /></mesh>
  );
  return (
    <group ref={g} position={[0, -0.9, 0]}>
      <mesh position={[0, -0.05, 0]} receiveShadow><cylinderGeometry args={[3.2, 3.4, 0.1, 6]} /><meshStandardMaterial color="#d9cfc4" flatShading /></mesh>
      {/* ground floor */}
      <mesh position={[-0.3, 0.55, 0]} castShadow><boxGeometry args={[3, 1.1, 1.8]} /><meshStandardMaterial color="#f4efe8" flatShading /></mesh>
      {/* upper cantilever */}
      <mesh position={[0.4, 1.55, -0.1]} castShadow><boxGeometry args={[2.6, 0.9, 1.6]} /><meshStandardMaterial color="#efe8de" flatShading /></mesh>
      <mesh position={[0.4, 2.04, -0.1]}><boxGeometry args={[2.8, 0.08, 1.8]} /><meshStandardMaterial color="#1a1818" /></mesh>
      <mesh position={[-0.3, 1.13, 0]}><boxGeometry args={[3.2, 0.06, 2]} /><meshStandardMaterial color="#1a1818" /></mesh>
      {/* wood cladding */}
      <mesh position={[-1.5, 0.55, 0.91]}><boxGeometry args={[0.6, 1.1, 0.02]} /><meshStandardMaterial color="#8a5a3b" flatShading /></mesh>
      {win([-0.5, 0.55, 0.91], [1.4, 0.8, 0.02])}
      {win([0.8, 0.55, 0.91], [0.6, 0.8, 0.02])}
      {win([0, 1.55, 0.71], [1.0, 0.55, 0.02])}
      {win([1.2, 1.55, 0.71], [0.6, 0.55, 0.02])}
      {/* pool */}
      <mesh position={[1.4, 0.03, 1.6]}><boxGeometry args={[2.2, 0.06, 1]} /><meshStandardMaterial color="#3fd0e0" emissive="#22b8d4" emissiveIntensity={0.9} /></mesh>
      <pointLight position={[1.4, 0.4, 1.6]} color="#4fe3ff" intensity={4} distance={3} />
      {/* palms (low poly) */}
      {[[-2.3, 1.4], [2.4, -1.2]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.05, 0.08, 1.4, 5]} /><meshStandardMaterial color="#7a5b3a" flatShading /></mesh>
          <mesh position={[0, 1.5, 0]}><coneGeometry args={[0.6, 0.4, 6]} /><meshStandardMaterial color="#4f7a4a" flatShading /></mesh>
        </group>
      ))}
    </group>
  );
}

function Key() {
  return (
    <Float speed={2} rotationIntensity={1.2} floatIntensity={1.5}>
      <group position={[2.2, 1.6, 0.5]} rotation={[0.3, 0.4, 0.6]} scale={0.5}>
        <mesh><torusGeometry args={[0.4, 0.12, 8, 16]} /><meshStandardMaterial color="#e62555" metalness={0.6} roughness={0.3} /></mesh>
        <mesh position={[1, 0, 0]}><boxGeometry args={[1.2, 0.16, 0.16]} /><meshStandardMaterial color="#e62555" metalness={0.6} roughness={0.3} /></mesh>
        <mesh position={[1.4, -0.2, 0]}><boxGeometry args={[0.14, 0.3, 0.16]} /><meshStandardMaterial color="#e62555" metalness={0.6} roughness={0.3} /></mesh>
      </group>
    </Float>
  );
}

export default function Villa3D() {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [5, 3.2, 6], fov: 38 }} shadows>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 4]} intensity={1.4} color="#ffd9b0" castShadow />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} color="#ffd2a8" />
        <Lightformer intensity={1} color="#e62555" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
      </Environment>
      <Villa />
      <Key />
    </Canvas>
  );
}
