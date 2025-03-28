import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const App = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);

  // Backend URL - replace with your actual backend URL
  const BACKEND_URL = 'http://localhost:8000';

  useEffect(() => {
    // Three.js Particle Background Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 5;

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 5000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.005,
      color: 'blue',
      transparent: true,
      opacity: 0.7
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate particles
      particlesMesh.rotation.x += 0.0005;
      particlesMesh.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    particlesRef.current = particlesMesh;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, []);

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${BACKEND_URL}/query/`, {
        query: query,
        top_k: 5
      });

      setSearchResults(response.data.generated_response);
    } catch (err) {
      setError('Failed to search documents. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-auto">
      {/* Three.js Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-0 w-full h-full"
      />

      {/* Content Container */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="w-full max-w-2xl p-8 bg-white/30 backdrop-blur-lg rounded-xl shadow-2xl">
          <h1 className="text-4xl font-bold mb-8 text-center text-blue-900">
            Credit Card Advisor
          </h1>

          {/* Query Form */}
          <form onSubmit={handleQuerySubmit} className="space-y-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What credit card are you looking for?"
              className="w-full p-4 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-lg"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-4 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors duration-300 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Get Recommendations'
              )}
            </button>
          </form>

          {/* Search Results */}
          {searchResults && (
            <div className="mt-6 bg-white/70 backdrop-blur-md p-6 rounded-lg shadow-md prose prose-blue max-w-full">
              <h3 className="font-bold text-xl mb-4 text-blue-900">
                Recommendation:
              </h3>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-blue-900 mb-4" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-blue-800 mb-3" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-blue-700 mb-2" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4" {...props} />,
                  a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                }}
              >
                {searchResults || ''}
              </ReactMarkdown>
            </div>
          )}

          {/* Error Handling */}
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;