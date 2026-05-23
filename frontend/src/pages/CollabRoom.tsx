import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, MessageSquare, Code2, 
  Users, Brain, Send, ChevronRight, X, PhoneOff, Sparkles, Loader2,
  Monitor, Share2, Settings, UserPlus, Info, Zap, Terminal
} from 'lucide-react';
import { AuthContext } from '../services/auth.service';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { GlowingButton } from '../components/ui/GlowingButton';
import { Navbar } from '../components/shared/Navbar';
import { cn } from '../utils/cn';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000');

export default function CollabRoom() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams();
  
  const [roomId, setRoomId] = useState(urlRoomId || 'hireiq-alpha');
  const [inRoom, setInRoom] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  
  // Media State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, {stream: MediaStream, name: string}>>({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVidOn, setIsVidOn] = useState(true);
  
  // Collaborative State
  const [code, setCode] = useState('// Collaborative Interview Buffer initialized...');
  const [messages, setMessages] = useState<Array<{user: string, text: string}>>([]);
  const [message, setMessage] = useState('');
  
  // AI Moderator
  const [isAiLoading, setIsAiLoading] = useState(false);

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);

  useEffect(() => {
    if (inRoom) {
      initCollaboration();
    }
    return () => {
      stream?.getTracks().forEach(track => track.stop());
      peerRef.current?.destroy();
      socket.off('message');
      socket.off('code-sync');
      socket.off('peer-joined');
      socket.off('typing');
    }
  }, [inRoom]);

  const initCollaboration = async () => {
    try {
      const myStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(myStream);
      if (myVideoRef.current) myVideoRef.current.srcObject = myStream;
      
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', (id) => {
        socket.emit('join-room', { room: roomId, user: user?.name, peerId: id });
        setParticipants(prev => Array.from(new Set([...prev, user?.name || 'You'])));
      });

      peer.on('call', (call) => {
        call.answer(myStream);
        call.on('stream', (remoteStream) => {
          setRemoteStreams(prev => ({ ...prev, [call.peer]: { stream: remoteStream, name: 'Peer' } }));
        });
      });

      socket.on('peer-joined', ({ user: peerName, peerId }) => {
        setParticipants(prev => Array.from(new Set([...prev, peerName])));
        const call = peer.call(peerId, myStream);
        call.on('stream', (remoteStream) => {
          setRemoteStreams(prev => ({ ...prev, [peerId]: { stream: remoteStream, name: peerName } }));
        });
      });

      socket.on('message', (msg) => setMessages(prev => [...prev, msg]));
      socket.on('code-sync', (newCode) => setCode(newCode));
      socket.on('typing', ({ user: typist }) => {
        setIsTyping(typist);
        setTimeout(() => setIsTyping(null), 3000);
      });
      
    } catch (err) {
      console.error('Media Access Denied:', err);
    }
  };

  const handleJoin = () => setInRoom(true);

  const sendMessage = () => {
    if (!message.trim()) return;
    const msg = { user: user?.name || 'Guest', text: message };
    socket.emit('message', { room: roomId, message: msg });
    setMessage('');
  };

  const handleCodeChange = (val: string | undefined) => {
    const newCode = val || '';
    setCode(newCode);
    socket.emit('code-sync', { room: roomId, code: newCode });
    socket.emit('typing', { room: roomId, user: user?.name });
  };

  const requestAiModeration = () => {
    setIsAiLoading(true);
    socket.emit('ai-moderate', { room: roomId, context: code });
    setTimeout(() => setIsAiLoading(false), 3000);
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVid = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !isVidOn;
      setIsVidOn(!isVidOn);
    }
  };

  if (!inRoom) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6 relative">
        <Navbar />
        <div className="fixed inset-0 bg-grid-white pointer-events-none opacity-20" />
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl w-full">
           <SpotlightCard className="p-12 text-center">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
                <Users className="w-12 h-12 text-indigo-400" />
              </div>
              <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Live Collab Hub</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-10">Real-time Human Synchronization</p>
              
              <div className="space-y-6">
                <div className="relative">
                   <Info className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                   <input 
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[20px] pl-12 pr-6 py-5 text-white focus:border-indigo-500 transition-all outline-none text-xl font-mono tracking-widest uppercase"
                    placeholder="ENTER CLUSTER ID"
                  />
                </div>
                <GlowingButton onClick={handleJoin} className="w-full py-5 text-lg">
                  Establish Uplink <Zap className="w-5 h-5 ml-2" />
                </GlowingButton>
              </div>
           </SpotlightCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] text-slate-100 flex flex-col overflow-hidden selection:bg-indigo-500/30">
      
      {/* Top Navigation Bar */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
             <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Operational Area: {roomId}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-3">
             <div className="flex -space-x-3">
                {participants.map((p, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black uppercase ring-2 ring-white/5">
                     {p.substring(0, 2)}
                  </div>
                ))}
             </div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{participants.length} Active Sensors</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 rounded-2xl p-1 border border-white/5">
             <button onClick={toggleMic} className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", isMicOn ? "hover:bg-white/5 text-slate-400" : "bg-rose-500 text-white")}>
               {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
             </button>
             <button onClick={toggleVid} className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", isVidOn ? "hover:bg-white/5 text-slate-400" : "bg-rose-500 text-white")}>
               {isVidOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
             </button>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 px-6 h-12 rounded-2xl bg-rose-500/10 text-rose-500 text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">
            <PhoneOff className="w-4 h-4" /> Terminate Link
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Enhanced Video Grid */}
        <div className="w-96 border-r border-white/5 bg-black/40 flex flex-col p-6 gap-6 overflow-y-auto">
          
          <div className="space-y-6">
             {/* My Video */}
             <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl group">
               <video ref={myVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-xl text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                 Local Feed: {user?.name}
               </div>
             </div>

             {/* Remote Videos */}
             {Object.entries(remoteStreams).map(([peerId, data]) => (
               <div key={peerId} className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl group">
                 <video 
                   autoPlay 
                   playsInline 
                   className="w-full h-full object-cover" 
                   ref={el => { if(el) el.srcObject = data.stream; }} 
                 />
                 <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-xl text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Remote Feed: {data.name}
                 </div>
               </div>
             ))}
          </div>

          <div className="flex-1" />

          {/* AI Moderator Component */}
          <SpotlightCard className="p-6 border-indigo-500/20 bg-indigo-500/[0.03]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Brain className="w-5 h-5 text-indigo-400" />
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">AI Mediator</span>
                    <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Active Watcher</p>
                 </div>
              </div>
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic mb-6">
              "Analyzing technical dialogue and structural logic. Request an audit at any time."
            </p>
            <button 
              onClick={requestAiModeration}
              disabled={isAiLoading}
              className="w-full h-12 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Request AI Audit
            </button>
          </SpotlightCard>
        </div>

        {/* Center: Elite Collaborative Workspace */}
        <div className="flex-1 flex flex-col bg-[#0b0b0b]">
          <div className="px-8 py-3 border-b border-white/5 flex items-center justify-between bg-slate-900/30">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <Terminal className="w-4 h-4 text-indigo-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaborative Buffer</span>
              </div>
              {isTyping && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                   <div className="flex gap-0.5">
                      <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                   </div>
                   <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{isTyping} is writing logic...</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                   <Settings className="w-3 h-3" />
                   Multimodal Sync Active
                </div>
            </div>
          </div>
          <div className="flex-1">
             <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{
                   fontSize: 16,
                   fontFamily: "'JetBrains Mono', monospace",
                   minimap: { enabled: false },
                   padding: { top: 32 },
                   automaticLayout: true,
                   renderLineHighlight: 'all',
                   fontWeight: '500'
                }}
             />
          </div>
        </div>

        {/* Right: Intelligence Hub (Chat + Tasks) */}
        <div className="w-96 border-l border-white/5 bg-black/40 flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-3">
               <MessageSquare className="w-5 h-5 text-indigo-400" />
               <span className="text-xs font-black text-white uppercase tracking-widest">Neural Chat</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex flex-col", msg.user === user?.name ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{msg.user}</span>
                </div>
                <div className={cn(
                  "max-w-[95%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-xl",
                  msg.user === user?.name ? "bg-indigo-600 text-white rounded-tr-none" : 
                  msg.user === 'AI Moderator' ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium italic" : "bg-white/5 text-slate-300 rounded-tl-none border border-white/5"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-white/5 bg-slate-950/30">
            <div className="relative group">
               <input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-xs text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                placeholder="Synchronize findings..."
              />
              <button 
                onClick={sendMessage} 
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
