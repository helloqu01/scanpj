'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

export default function ViewerPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  // 누적 데이터를 저장할 배열
  const accumulatedVertices = useRef<number[]>([]);
  const accumulatedFaces = useRef<number[]>([]);

  useEffect(() => {
    // ===== Three.js 초기 설정 =====
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xdddddd);
    rendererRef.current = renderer;
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // 조명 및 AxesHelper 추가
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const axesHelper = new THREE.AxesHelper(1);
    scene.add(axesHelper);

    // 빈 Geometry와 빨간 Mesh 생성
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: false });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    geometryRef.current = geometry;
    meshRef.current = mesh;

    // 초기에는 빈 BufferAttributes
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([]), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([]), 1));

    // OrbitControls 설정
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 애니메이션 루프
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ===== Socket.IO 연결 =====
    const socket = io('http://localhost:4000', { transports: ['websocket'] });
    const scanId = 'test-scan-001';
    socket.emit('join_scan', scanId);

    socket.on('scan_update', (data) => {
      console.log('Received chunk:', data);
      // data 예시: { scanId, chunkId, vertices: number[], faces: number[] }
      if (!data.vertices || !data.faces) {
        console.warn('Invalid data received:', data);
        return;
      }

      // 현재까지 저장된 정점 개수에 따른 오프셋 계산
      const offset = accumulatedVertices.current.length / 3;
      // 새로운 정점 데이터 누적
      accumulatedVertices.current.push(...data.vertices);
      // 새로운 인덱스에 오프셋 적용 후 누적
      const adjustedFaces = data.faces.map((face: number) => face + offset);
      accumulatedFaces.current.push(...adjustedFaces);

      console.log('Accumulated vertices:', accumulatedVertices.current.length);
      console.log('Accumulated faces:', accumulatedFaces.current.length);

      // 누적 데이터를 기반으로 BufferAttributes 생성
      const vertices = new Float32Array(accumulatedVertices.current);
      const indices = new Uint16Array(accumulatedFaces.current);
      if (geometryRef.current) {
        geometryRef.current.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometryRef.current.setIndex(new THREE.BufferAttribute(indices, 1));
        geometryRef.current.computeVertexNormals();
      }
    });

    // ===== Cleanup =====
    return () => {
      socket.disconnect();
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-screen" />;
}
