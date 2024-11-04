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
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setSelectedLocation(null);
    setError(null);
    setHasAnswered(initialHasAnswered);
  }, [question.id, initialHasAnswered]);

  useEffect(() => {
    if (hasAnswered && question) {
      mapRef.current?.flyTo({
        center: [question.longitude, question.latitude],
        zoom: 5,
        duration: 2000
      });
    }
  }, [hasAnswered, question]);

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

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto px-4">
      <div className="flex-none py-4">
        <QuestionCard question={question} />
      </div>
      
      <div className="h-[calc(100vh-24rem)] min-h-[300px] rounded-xl overflow-hidden shadow-lg">
        <MapComponent
          ref={mapRef}
          onMapClick={hasAnswered ? undefined : handleMapClick}
          markers={selectedLocation ? [{ 
            longitude: selectedLocation[0], 
            latitude: selectedLocation[1],
            color: 'text-blue-500',
            fill: true
          }] : []}
          showLabels={false}
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
        
        {hasAnswered && (
          <div className="text-center text-white text-lg bg-blue-500/20 rounded-lg p-4">
            Answer submitted! Waiting for other players...
          </div>
        )}
      </div>
    </div>
  );
}
