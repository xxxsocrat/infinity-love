'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

interface Quote {
  text: string;
  author: string;
}

const quotes: Quote[] = [
  { text: "Любовь — это когда один плюс один равно один.", author: "Жан-Поль Сартр" },
  { text: "Гравитация не отвечает за то, что люди влюбляются.", author: "Альберт Эйнштейн" },
  { text: "Есть всегда немного безумия в любви. Но есть всегда и немного разума в безумии.", author: "Фридрих Ницше" },
  { text: "Любовь состоит из одной души, обитающей в двух телах.", author: "Аристотель" },
  { text: "Прикосновение любви превращает каждого в поэта.", author: "Платон" },
  { text: "Одно слово освобождает нас от всех тягот и боли жизни. Это слово — любовь.", author: "Сократ" },
  { text: "Влюблённость — это когда ты вдруг понимаешь, что весь космос сосредоточен в одном человеке.", author: "Омар Хайям" },
  { text: "Любовь — это свет, который освещает тех, кто даёт и получает его.", author: "Альберт Эйнштейн" },
  { text: "Настоящая любовь начинается тогда, когда ты перестаёшь искать совершенство.", author: "Райнер Мария Рильке" },
  { text: "Любовь — это единственная реальность. Всё остальное — иллюзия.", author: "Джалаладдин Руми" },
  { text: "Когда любишь, ты видишь мир таким, каким его видит Бог.", author: "Фёдор Достоевский" },
  { text: "Ты — моя самая яркая звезда в этом бесконечном космосе.", author: "От всего сердца" },
  { text: "В истинной любви именно душа обволакивает тело.", author: "Фридрих Ницше" },
  { text: "Любовь — это красота души.", author: "Св. Августин" },
  { text: "Наука — это не только ученик разума, но и романтики, и страсти.", author: "Стивен Хокинг" },
  { text: "Любовь — это когда твоя душа узнаёт свою половинку в другом человеке.", author: "Платон" },
  { text: "Влюблённость — это полёт души, который не нуждается в крыльях.", author: "Неизвестный" },
  { text: "Ты делаешь меня лучше, чем я есть.", author: "Эрих Фромм" },
  { text: "Любовь — это единственный способ познать другого человека.", author: "Райнер Мария Рильке" },
  { text: "В этом безкрайнем космосе ты — моя самая яркая звезда.", author: "Для тебя" },
];

function StarField({ onStarClick }: { onStarClick: (point: THREE.Vector3) => void }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  const count = 14000;

  const [positions, colors, sizes, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const pha = new Float32Array(count);

    const colorPalette = [
      new THREE.Color('#ffffff'), new THREE.Color('#e0f0ff'),
      new THREE.Color('#fff7cc'), new THREE.Color('#ffcc88'),
      new THREE.Color('#ff8a70'), new THREE.Color('#ff6666'),
      new THREE.Color('#ff5555'), new THREE.Color('#d8b4ff'),
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3]     = (Math.random() - 0.5) * 2000;
      pos[i3 + 1] = (Math.random() - 0.5) * 2000;
      pos[i3 + 2] = (Math.random() - 0.5) * 2200 - 500;

      siz[i] = Math.random() * 3.8 + 0.7;
      pha[i] = Math.random() * Math.PI * 2;

      let color = colorPalette[0];
      const rand = Math.random();
      if (rand < 0.42) color = colorPalette[3 + Math.floor(Math.random() * 4)];
      else if (rand < 0.68) color = colorPalette[Math.floor(Math.random() * 2)];
      else if (rand < 0.85) color = colorPalette[2];
      else color = colorPalette[7];

      col[i3] = color.r; col[i3 + 1] = color.g; col[i3 + 2] = color.b;
    }
    return [pos, col, siz, pha];
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    return geo;
  }, [positions, colors, sizes, phases]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, pixelRatio: { value: 1 } },
    vertexShader: `
      attribute float size; attribute float phase;
      varying float vOpacity; varying vec3 vColor;
      uniform float time; uniform float pixelRatio;
      void main() {
        vColor = color;
        float twinkle = sin(time * 3.0 + phase * 2.5) * 0.4 + sin(time * 7.0 + phase * 1.3) * 0.25 + 0.8;
        vOpacity = twinkle;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * pixelRatio * (280.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vOpacity; varying vec3 vColor;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha * vOpacity * 0.9);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    vertexColors: true,
  }), []);

  const rotationVelocity = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useFrame(() => {
    material.uniforms.time.value += 0.016;

    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0002 + rotationVelocity.current.y * 0.02;
      pointsRef.current.rotation.x += rotationVelocity.current.x * 0.015;

      rotationVelocity.current.x *= 0.95;
      rotationVelocity.current.y *= 0.95;
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    if (e.object) {
      const point = e.object.position.clone();
      onStarClick(point);
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return;
    const deltaX = (e.clientX - lastPos.current.x) * 0.005;
    const deltaY = (e.clientY - lastPos.current.y) * 0.005;

    rotationVelocity.current.x = deltaY;
    rotationVelocity.current.y = deltaX;

    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <group ref={groupRef}>
      <points 
        ref={pointsRef} 
        geometry={geometry} 
        material={material}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </group>
  );
}

export default function HomePage() {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [showQuote, setShowQuote] = useState(false);

  const handleStarClick = useCallback((point: THREE.Vector3) => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);
    setShowQuote(true);

    setTimeout(() => setShowQuote(false), 4500);
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <Canvas
        camera={{ position: [0, 0, 800], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} />
        <StarField onStarClick={handleStarClick} />
      </Canvas>

      {/* Заголовок */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-7xl md:text-8xl font-bold text-white tracking-[0.5em] mb-4"
        >
          БЕСКОНЕЧНОСТЬ
        </motion.h1>
        <p className="text-white/70 text-xl md:text-2xl tracking-widest">космос нашей любви</p>
      </div>

      {/* Цитата */}
      <AnimatePresence>
        {showQuote && currentQuote && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xl px-10 py-8 rounded-3xl max-w-lg text-center border border-white/10 z-20"
          >
            <p className="text-white text-xl leading-relaxed italic">«{currentQuote.text}»</p>
            <p className="text-white/60 mt-4 text-sm">— {currentQuote.author}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-sm">
        Кликай / тапай по звёздам • Свайпай для вращения
      </div>
    </main>
  );
}
