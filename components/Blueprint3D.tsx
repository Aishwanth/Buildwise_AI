import * as React from 'react';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import {
    OrbitControls,
    PerspectiveCamera,
    ContactShadows,
    Text,
    Environment,
    Float,
    PresentationControls,
    Stage,
    Bounds,
    Grid
} from '@react-three/drei';
import { Box as BoxIcon, Maximize, MousePointer2, Info, Move, Image as ImageIcon } from 'lucide-react';
import { BlueprintRoom } from '../types';
import { analyzeBlueprintImage } from '../services/geminiService';

interface Room3DProps {
    room: BlueprintRoom;
    index: number;
}

const Room3D: React.FC<Room3DProps> = ({ room, index }) => {
    // Convert 2D coordinates to 3D. 
    // We'll treat x, y as x, z in 3D (floor plane)
    // height in 2D blueprint will be depth in 3D
    // width in 2D will be width in 3D
    // We'll give it a fixed wall height of 3 units
    const wallHeight = 3;
    const position: [number, number, number] = [
        room.x + room.width / 2,
        wallHeight / 2,
        room.y + room.height / 2
    ];

    const colors = [
        '#6366f1', // indigo
        '#8b5cf6', // violet
    ];

    // Safety check for dimensions
    const w = Math.max(0.1, room.width);
    const h = Math.max(0.1, room.height);
    const wallH = 3;

    return (
        <group position={[room.x + w / 2, wallH / 2, room.y + h / 2]}>
            {/* Floor */}
            <mesh position={[0, -wallH / 2 + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[w, h]} />
                <meshStandardMaterial color={colors[index % colors.length]} opacity={0.4} transparent />
            </mesh>

            {/* Walls (simplified as a hollow box or translucent volume) */}
            <mesh>
                <boxGeometry args={[w, wallH, h]} />
                <meshStandardMaterial
                    color={colors[index % colors.length]}
                    opacity={0.2}
                    transparent
                    metalness={0.1}
                    roughness={0.2}
                />
            </mesh>

            {/* Wall Edges/Frames */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(w, wallH, h)]} />
                <lineBasicMaterial color={colors[index % colors.length]} linewidth={2} />
            </lineSegments>

            {/* Room Name Label */}
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <Text
                    position={[0, wallH + 0.6, 0]}
                    fontSize={Math.min(0.5, w * 0.2)}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_eeA.woff"
                >
                    {room.name}
                </Text>
            </Float>
        </group>
    );
};


const Blueprint3D: React.FC<{ blueprint?: { rooms: BlueprintRoom[] } }> = ({ blueprint: initialBlueprint }) => {
    const [rooms, setRooms] = React.useState<BlueprintRoom[]>(initialBlueprint?.rooms || [
        { name: 'Living Room', x: 0, y: 0, width: 6, height: 8 },
        { name: 'Kitchen', x: 6, y: 0, width: 4, height: 5 },
        { name: 'Bedroom 1', x: 0, y: 8, width: 5, height: 5 },
        { name: 'Bedroom 2', x: 5, y: 8, width: 5, height: 5 },
        { name: 'Bathroom', x: 6, y: 5, width: 4, height: 3 },
    ]);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [engine, setEngine] = React.useState<'ai' | 'algorithmic'>('ai');
    const [bimMetadata, setBimMetadata] = React.useState<any>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Sync with initialBlueprint if it changes
    React.useEffect(() => {
        if (initialBlueprint?.rooms) {
            setRooms(initialBlueprint.rooms);
        }
    }, [initialBlueprint]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const base64 = event.target?.result as string;

                    if (engine === 'ai') {
                        const result = await analyzeBlueprintImage(base64);
                        processBimResult(result);
                    } else {
                        // Call Algorithmic BIM Engine
                        console.log('Calling BIM Engine at http://localhost:5000/api/bim/convert');
                        console.log('Image size:', base64.length, 'bytes');

                        const response = await fetch('http://localhost:5000/api/bim/convert', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image: base64, scaleFactor: 0.05 })
                        });

                        console.log('BIM Response status:', response.status, response.statusText);

                        if (!response.ok) {
                            const error = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
                            console.error('BIM Engine Error:', error);
                            throw new Error(error.error || 'Algorithmic engine failed');
                        }

                        const result = await response.json();
                        console.log('BIM Result received:', result);
                        processBimResult(result);
                    }
                } catch (apiError: any) {
                    console.error("Analysis Error:", apiError);
                    alert(`Analysis failed: ${apiError.message || "Failed to contact engine"}`);
                } finally {
                    setIsAnalyzing(false);
                }
            };
            reader.onerror = () => {
                alert("Failed to read the file.");
                setIsAnalyzing(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Upload error:", error);
            setIsAnalyzing(false);
        }
    };

    const processBimResult = (result: any) => {
        console.log("Processing Engine Result:", result);

        if (result && result.rooms && Array.isArray(result.rooms) && result.rooms.length > 0) {
            const validRooms = result.rooms
                .map((r: any) => {
                    let x = Number(r.x);
                    let y = Number(r.y);
                    let width = Number(r.width);
                    let height = Number(r.height);

                    // If we have corners but no dimensions, calculate bounding box
                    if (r.corners && r.corners.length > 0 && (isNaN(width) || isNaN(height))) {
                        const xs = r.corners.map((p: any) => p[0]);
                        const ys = r.corners.map((p: any) => p[1]);
                        const minX = Math.min(...xs);
                        const maxX = Math.max(...xs);
                        const minY = Math.min(...ys);
                        const maxY = Math.max(...ys);

                        x = minX;
                        y = minY;
                        width = maxX - minX;
                        height = maxY - minY;
                    }

                    return {
                        name: String(r.name || 'Room'),
                        x: x || 0,
                        y: y || 0,
                        width: width || 4,
                        height: height || 4
                    };
                })
                .filter((r: any) => r.width > 0 && r.height > 0);

            if (validRooms.length > 0) {
                setRooms(validRooms);
                setBimMetadata(result.metadata || null);
            } else {
                alert("Extracted data was invalid. Try a different resolution.");
            }
        } else {
            alert("No rooms detected in this blueprint.");
        }
    };

    const handleReset = () => {
        setRooms([
            { name: 'Living Room', x: 0, y: 0, width: 6, height: 8 },
            { name: 'Kitchen', x: 6, y: 0, width: 4, height: 5 },
            { name: 'Bedroom 1', x: 0, y: 8, width: 5, height: 5 },
            { name: 'Bedroom 2', x: 5, y: 8, width: 5, height: 5 },
            { name: 'Bathroom', x: 6, y: 5, width: 4, height: 3 },
        ]);
        setBimMetadata(null);
    };

    // Calculate center to offset the view
    const offset = useMemo(() => {
        if (rooms.length === 0) return { x: 0, z: 0 };
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        rooms.forEach(r => {
            minX = Math.min(minX, r.x);
            maxX = Math.max(maxX, r.x + r.width);
            minY = Math.min(minY, r.y);
            maxY = Math.max(maxY, r.y + r.height);
        });
        return {
            x: (minX + maxX) / 2,
            z: (minY + maxY) / 2
        };
    }, [rooms]);

    return (
        <div className="w-full h-full min-h-[700px] bg-slate-900 rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-white/10 group" style={{ backgroundColor: '#0f172a' }}>
            {/* UI Overlay */}
            <div className="absolute top-8 left-8 z-10 space-y-4 max-w-sm">
                <div className="flex flex-col gap-2">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl flex items-center gap-3 w-fit">
                        <BoxIcon className="w-5 h-5 text-indigo-400" />
                        <span className="text-white font-black text-sm uppercase tracking-widest">BIM Spatial Engine</span>
                    </div>
                    <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-4 py-1.5 rounded-xl flex items-center gap-2 w-fit">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                            {isAnalyzing ? `Engine Thinking (${engine.toUpperCase()})...` : 'Structural Validator Active'}
                        </span>
                    </div>
                </div>

                {/* Engine Selector */}
                <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 w-fit">
                    <button
                        onClick={() => setEngine('ai')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${engine === 'ai' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Gemini AI
                    </button>
                    <button
                        onClick={() => setEngine('algorithmic')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${engine === 'algorithmic' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        BIM Algorithmic
                    </button>
                </div>

                {/* Upload Button */}
                <div className="flex flex-col gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isAnalyzing}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {isAnalyzing ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <ImageIcon className="w-5 h-5" />
                            )}
                            {isAnalyzing ? 'Processing...' : 'Upload Blueprint'}
                        </button>

                        {!isAnalyzing && (
                            <button
                                onClick={handleReset}
                                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-3 rounded-2xl font-bold hover:bg-white/20 transition-all text-xs"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold px-2">JPG, PNG supported. Auto-detects walls & rooms.</p>
                </div>

                {/* BIM Metrics Card */}
                {bimMetadata && (
                    <div className="bg-white/5 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center gap-2 mb-2">
                            <Maximize className="w-4 h-4 text-indigo-400" />
                            <span className="text-white font-black text-xs uppercase tracking-widest">BIM Metrics</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase">Wall Length</p>
                                <p className="text-lg font-black text-white">{bimMetadata.total_wall_length}m</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase">Floor Area</p>
                                <p className="text-lg font-black text-white">{bimMetadata.total_floor_area}m²</p>
                            </div>

                            {bimMetadata.material_quantities && (
                                <>
                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-[9px] font-black text-slate-500 uppercase">Est. Concrete</p>
                                        <p className="text-sm font-black text-blue-400">{bimMetadata.material_quantities.concrete?.floor_slab_m3} m³</p>
                                    </div>
                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-[9px] font-black text-slate-500 uppercase">Est. Bricks</p>
                                        <p className="text-sm font-black text-orange-400">{bimMetadata.material_quantities.walls?.bricks_count.toLocaleString()} pcs</p>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="pt-3 border-t border-white/10">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">BIM Planning Active</span>
                                <span className="text-[9px] font-black text-emerald-400 uppercase">Synced</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute bottom-8 right-8 z-10 flex gap-4">
                {rooms.length === 0 && !isAnalyzing && (
                    <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 p-4 rounded-2xl animate-bounce">
                        <p className="text-red-400 text-xs font-black uppercase tracking-widest">No Model Data Detected</p>
                    </div>
                )}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl max-w-xs transition-all hover:bg-black/60">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <MousePointer2 className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-white text-xs font-black uppercase tracking-widest mb-1">Interaction</p>
                            <p className="text-slate-400 text-[10px] leading-relaxed">Rotate, zoom and pan to inspect the structural integrity of the architectural blueprint.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">LMB</kbd> Rotate
                        <span className="mx-1">•</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">RMB</kbd> Pan
                        <span className="mx-1">•</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">SCROLL</kbd> Zoom
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center text-white font-black animate-pulse">
                    INITIALIZING SPATIAL ENGINE...
                </div>
            }>
                <Canvas shadows gl={{ antialias: true }}>
                    <color attach="background" args={['#0f172a']} />
                    <PerspectiveCamera makeDefault position={[20, 20, 20]} fov={50} />
                    <OrbitControls
                        makeDefault
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 1.75}
                    />

                    <ambientLight intensity={0.7} />
                    <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
                    <pointLight position={[-10, -10, -10]} intensity={1} />
                    <axesHelper args={[5]} />

                    <Suspense fallback={null}>
                        <Bounds fit clip observe margin={1.2}>
                            <group position={[-offset.x, 0, -offset.z]}>
                                {rooms.map((room, idx) => (
                                    <Room3D key={`${room.name}-${idx}`} room={room} index={idx} />
                                ))}
                            </group>
                        </Bounds>

                        <Grid
                            args={[100, 100]}
                            cellSize={1}
                            cellThickness={1}
                            cellColor="#1e293b"
                            sectionSize={5}
                            sectionThickness={1.5}
                            sectionColor="#334155"
                            fadeDistance={50}
                            fadeStrength={1}
                            infiniteGrid
                        />
                    </Suspense>

                    <ContactShadows
                        position={[0, 0, 0]}
                        opacity={0.4}
                        scale={40}
                        blur={2}
                        far={4.5}
                    />

                    <Environment preset="city" />
                </Canvas>
            </Suspense>
        </div>
    );
};

export default Blueprint3D;
