import React, { useState, useEffect, useRef } from 'react';
import { MapLayerMouseEvent } from 'react-map-gl';
import QuestionCard from './QuestionCard';
import MapComponent from './MapComponent';
import { supabase } from '../lib/supabase';
import { calculateDistance } from '../lib/utils';

interface Question {
  id: number;
  text: string;
  latitude: number;
  longitude: number;
  image?: string;
  hint?: string;
}

interface Answer {
  id: string;
  player_id: string;
  game_id: string;
  question_id: number;
  latitude: number;
  longitude: number;
  distance: number;
  score: number;
}

interface Player {
  id: string;
  initials: string;
}

interface Game {
  status: 'waiting' | 'playing' | 'revealing' | 'finished';
  current_question: number;
}

interface PlayerViewProps {
  gameId: string;
  playerId: string;
  question: Question;
  hasAnswered: boolean;
}

export default function PlayerView({
  gameId,
  playerId,
  question,
  hasAnswered: initialHasAnswered
}: PlayerViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(initialHasAnswered);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [isRevealing, setIsRevealing] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(question.id);
  const mapRef = useRef<any>(null);

  // Handle question changes
  useEffect(() => {
    if (question.id !== currentQuestionId) {
      setCurrentQuestionId(question.id);
      setSelectedLocation(null);
      setError(null);
      setHasAnswered(initialHasAnswered);
      setAnswers([]);
      setIsRevealing(false);
      
      // Reset map view
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [0, 20],
          zoom: 1.5,
          duration: 1000
        });
      }
    }
  }, [question.id, currentQuestionId, initialHasAnswered]);

  // Subscribe to game status changes
  useEffect(() => {
    const channel = supabase.channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        async (payload: { new: Game }) => {
          const newGame = payload.new;
          
          if (newGame.status === 'revealing') {
            setIsRevealing(true);
            await fetchAnswers();
          } else if (newGame.status === 'playing') {
            // Reset state for new question
            setSelectedLocation(null);
            setError(null);
            setHasAnswered(false);
            setAnswers([]);
            setIsRevealing(false);
            
            // Reset map view
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: [0, 20],
                zoom: 1.5,
                duration: 1000
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const fetchAnswers = async () => {
    try {
      // Fetch all answers for the current question
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', gameId)
        .eq('question_id', question.id - 1);

      if (answersError) throw answersError;

      // Fetch all players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, initials')
        .eq('game_id', gameId);

      if (playersError) throw playersError;

      if (playersData) {
        const playersMap = playersData.reduce((acc, player) => ({
          ...acc,
          [player.id]: player
        }), {});
        setPlayers(playersMap);
      }

      if (answersData) {
        setAnswers(answersData);
        
        // Animate map to show correct location
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [question.longitude, question.latitude],
            zoom: 3,
            duration: 2000
          });
        }
      }
    } catch (err) {
      console.error('Error fetching answers:', err);
    }
  };

  const handleMapClick = (e: MapLayerMouseEvent) => {
    if (hasAnswered || isSubmitting) return;
    
    const lng = e.lngLat?.lng;
    const lat = e.lngLat?.lat;
    
    if (typeof lng === 'number' && typeof lat === 'number') {
      setSelectedLocation([lng, lat]);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLocation || hasAnswered || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const [longitude, latitude] = selectedLocation;

      const distance = calculateDistance(
        latitude,
        longitude,
        question.latitude,
        question.longitude
      );

      const score = Math.max(0, Math.floor(1000 * Math.exp(-distance / 1000)));

      const { data: playerData, error: fetchError } = await supabase
        .from('players')
        .select('score')
        .eq('id', playerId)
        .single();

      if (fetchError) throw fetchError;

      const { error: answerError } = await supabase
        .from('answers')
        .insert({
          player_id: playerId,
          game_id: gameId,
          question_id: question.id - 1,
          latitude,
          longitude,
          distance,
          score
        });

      if (answerError) throw answerError;

      const { error: playerError } = await supabase
        .from('players')
        .update({ 
          has_answered: true,
          score: (playerData?.score || 0) + score
        })
        .eq('id', playerId);

      if (playerError) throw playerError;
      
      setHasAnswered(true);

    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const markers = isRevealing ? [
    { 
      latitude: question.latitude, 
      longitude: question.longitude, 
      color: 'text-green-500',
      fill: true,
      label: 'Correct Location'
    },
    ...answers.map(answer => ({
      latitude: answer.latitude,
      longitude: answer.longitude,
      color: answer.player_id === playerId ? 'text-blue-500' : 'text-red-500',
      fill: true,
      label: `${players[answer.player_id]?.initials || 'Unknown'} (${answer.score} pts)`
    }))
  ] : selectedLocation ? [{ 
    longitude: selectedLocation[0], 
    latitude: selectedLocation[1],
    color: 'text-blue-500',
    fill: true
  }] : [];

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto px-4">
      <div className="flex-none py-4">
        <QuestionCard question={question} />
      </div>
      
      <div className="h-[calc(100vh-24rem)] min-h-[300px] rounded-xl overflow-hidden shadow-lg">
        <MapComponent
          ref={mapRef}
          onMapClick={hasAnswered ? undefined : handleMapClick}
          markers={markers}
          showLabels={isRevealing}
          showMarkerLabels={isRevealing}
        />
      </div>

      <div className="flex-none py-4 mt-auto">
        {error && (
          <div className="text-center text-red-400 bg-red-900/20 rounded-lg p-4 mb-4">
            {error}
          </div>
        )}
        
        {!hasAnswered && (
          <button
            onClick={handleSubmit}
            disabled={!selectedLocation || isSubmitting}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800
                     text-white rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        )}
        
        {hasAnswered && !isRevealing && (
          <div className="text-center text-white text-lg bg-blue-500/20 rounded-lg p-4">
            Answer submitted! Waiting for other players...
          </div>
        )}
      </div>
    </div>
  );
}
