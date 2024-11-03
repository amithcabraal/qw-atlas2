import React from 'react';
import { Player } from '../types';
import { User, CheckCircle2 } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  showAnswered?: boolean;
}

export default function PlayerList({ players, showAnswered = false }: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div
          key={player.id}
          className="flex items-center justify-between bg-white/10 p-3 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span className="font-medium">{player.initials}</span>
          </div>
          <div className="flex items-center gap-2">
            {showAnswered && (
              <CheckCircle2 
                className={`w-5 h-5 ${
                  player.hasAnswered ? 'text-green-400' : 'text-gray-400'
                }`} 
              />
            )}
            <span className="font-mono">{player.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
}