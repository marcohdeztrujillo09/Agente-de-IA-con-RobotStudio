import React from 'react';
import { Layers, Hand, Play, CircleStop } from 'lucide-react';

const controls = [
  { label: 'Modo Apilado', icon: Layers, command: 'Ponte a apilar' },
  { label: 'Pick & Place', icon: Hand, command: 'Cambia a modo pick and place' },
  { label: 'Reanudar', icon: Play, command: 'Reanudar operación', variant: 'success' },
  { label: 'Paro / Reposo', icon: CircleStop, command: 'Detener robot', variant: 'danger' },
];

const ControlPanel = ({ onSend }) => (
  <section>
    <h2 className="text-[10px] font-black uppercase tracking-widest text-abb-red mb-3">Control Directo</h2>
    <div className="grid grid-cols-1 gap-1.5">
      {controls.map((ctrl) => (
        <button 
          key={ctrl.label} 
          onClick={() => onSend(ctrl.command)}
          className="bg-white border border-gray-200 p-3 rounded flex items-center gap-4 text-left group hover:border-abb-red hover:text-abb-red transition-all abb-shadow active:scale-95"
        >
          <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center group-hover:bg-red-50 transition-colors">
            <ctrl.icon className="w-4 h-4 text-gray-400 group-hover:text-abb-red" />
          </div>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-tight group-hover:text-abb-red">{ctrl.label}</span>
        </button>
      ))}
    </div>
  </section>
);

export default ControlPanel;
