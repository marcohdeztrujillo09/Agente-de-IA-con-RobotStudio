import React, { useState, useEffect, useRef } from 'react';
import { Gauge, Package, Send, Keyboard, Cpu } from 'lucide-react';
import StatusCard from './components/StatusCard';
import ChatMessage from './components/ChatMessage';
import ControlPanel from './components/ControlPanel';

function App() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'agent', content: 'Bienvenido a un **Centro de Control de ABB**. Sistemas React RAG activos.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({
    speed: localStorage.getItem('robot-speed') || '---',
    pieces: localStorage.getItem('robot-pieces') || '---',
    lastAction: 'Sistema React Listo'
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('robot-speed', status.speed);
    localStorage.setItem('robot-pieces', status.pieces);
  }, [status.speed, status.pieces]);

  const parseUpdates = (text) => {
    const low = text.toLowerCase();
    // Filtro de logs de sistema
    if (low.includes('[info]') || low.includes('fragmentos') || low.includes('cargado desde txt')) return;

    let next = { ...status };
    
    // Lógica de velocidad estricta
    const speedMatch = low.match(/(?:velocidad|speed)\s*(?:a|en|de)?\s*(\d{2,4})/i) || 
                       low.match(/(\d{2,4})\s*(?:mm\/s|mm\sper\ssec)/i);
    
    if (speedMatch) {
      const val = parseInt(speedMatch[1]);
      if (val > 5 && val < 5000) next.speed = val.toString();
    } else if (low.includes('rápido') || low.includes('acelera')) {
      next.speed = ((parseInt(status.speed) || 100) + 100).toString();
    }

    // Lógica de piezas
    const piecesMatch = low.match(/(?:m[áa]ximo|tope|cantidad|apila)\s*(?:de)?\s*(\d{1,2})/i) || 
                       low.match(/(\d{1,2})\s*(?:cajas|piezas|objetos)/i);
    if (piecesMatch) {
      const pVal = parseInt(piecesMatch[1]);
      if (pVal > 0 && pVal < 100) next.pieces = pVal.toString();
    }
    
    if (low.includes('apilar')) next.lastAction = 'Modo Apilar';
    if (low.includes('pick')) next.lastAction = 'Pick & Place';
    if (low.includes('detener') || low.includes('stop')) next.lastAction = 'Parada';
    if (low.includes('reanudar') || low.includes('continuar')) next.lastAction = 'Operando';
    
    setStatus(next);
  };

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim() || isLoading) return;

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: msg }]);
    setInput('');
    setIsLoading(true);
    parseUpdates(msg);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await response.json();
      const reply = data.response || "Instrucción procesada en RobotStudio.";
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'agent', content: reply }]);
      parseUpdates(reply);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'agent', content: '**Error crítico de comunicación.** Verifique el servidor Python.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8f9fa] font-sans">
      {/* Header */}
      <header className="h-20 bg-white border-b-4 border-abb-red flex items-center justify-between px-10 shadow-sm z-50">
        <div className="flex items-center gap-6">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/ABB_logo.svg/2560px-ABB_logo.svg.png" alt="ABB" className="h-6" />
          <div className="h-8 w-[1px] bg-gray-200"></div>
          <h1 className="text-xl font-black text-gray-800 tracking-tighter uppercase italic">RobotStudio <span className="font-light text-gray-400">React Interface</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">React System</span>
            <span className="text-xs font-bold text-green-600 flex items-center gap-2 uppercase tracking-tight">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Virtual Controller Online
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col p-6 gap-4 overflow-y-auto z-40">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-abb-red mb-3">Telemetría React</h2>
            <div className="space-y-3">
              <StatusCard label="Velocidad Nominal" value={status.speed} unit="mm/s" icon={Gauge} />
              <StatusCard label="Capacidad Max" value={status.pieces} unit="uds" icon={Package} />
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <div className="text-[9px] uppercase text-gray-400 font-bold mb-0.5">Estado de Ejecución</div>
                <div className="text-xs font-bold text-gray-700">{status.lastAction}</div>
              </div>
            </div>
          </div>

          <ControlPanel onSend={sendMessage} />
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#fafafa]">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
            ))}
            {isLoading && (
              <div className="flex gap-6 animate-pulse">
                <div className="w-10 h-10 rounded bg-abb-red flex items-center justify-center shadow-sm">
                  <Cpu className="text-white w-5 h-5" />
                </div>
                <div className="bg-white border border-red-50 p-6 rounded-lg shadow-sm flex gap-2">
                  <div className="w-2 h-2 bg-abb-red rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-abb-red rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-abb-red rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-8 bg-white border-t border-gray-200">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="max-w-5xl mx-auto flex gap-4"
            >
              <div className="relative flex-1 group">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Introduce comando o consulta técnica de RAPID..."
                  className="w-full border-2 border-gray-100 rounded py-4 px-6 text-sm focus:outline-none focus:border-abb-red transition-all shadow-inner bg-gray-50 font-sans"
                  disabled={isLoading}
                />
                <Keyboard className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 group-focus-within:text-abb-red transition-colors" />
              </div>
              <button 
                type="submit" 
                className="px-10 bg-abb-red hover:bg-abb-hover text-white rounded font-bold uppercase text-xs tracking-[0.2em] transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                disabled={isLoading || !input.trim()}
              >
                <span>Enviar</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
            <p className="text-[9px] text-center text-gray-400 mt-4 uppercase tracking-widest font-bold">© 2024 ABB ROBOTICS | REACT COMPONENT SYSTEM</p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
