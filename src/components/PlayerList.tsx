import React from 'react';
import { User, CheckCircle2 } from 'lucide-react';

interface Player {
  id: string;
  initials: string;
  score: number;
  has_answered: boolean;
  game_id: string;
}

interface PlayerListProps {
  players: Player[];
  showAnswered?: boolean;
}

export default function PlayerList({ players, showAnswered = false }: PlayerListProps) {
  if (!players || !Array.isArray(players)) {
    return null;
  }

  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div
          key={player.id}
          className="flex items-center justify-between bg-white/10 p-3 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-300" />
            <span className="font-medium text-white">{player.initials}</span>
          </div>
          <div className="flex items-center gap-2">
            {showAnswered && (
              <CheckCircle2 
                className={`w-5 h-5 ${
                  player.has_answered ? 'text-green-400' : 'text-gray-400'
                }`} 
              />
            )}
            <span className="font-mono text-white">{player.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
