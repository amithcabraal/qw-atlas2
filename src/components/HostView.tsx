// ... previous imports remain the same ...

export default function HostView({
  gameId,
  currentQuestion,
  players,
  answers: propAnswers,
  onNextQuestion,
  onRevealAnswers,
  question
}: HostViewProps) {
  // ... previous state declarations remain the same ...

  // Add key state for map remounting
  const [mapKey, setMapKey] = useState(0);

  // Reset map when question changes
  useEffect(() => {
    setIsRevealing(false);
    setDisplayedAnswers([]);
    setError(null);
    setRevealComplete(false);
    setPlayersWithScores(players.map(player => ({
      ...player,
      lastScore: player.score
    })));
    
    // Force map remount
    setMapKey(prev => prev + 1);
    
    // Reset map view if ref exists
    if (mapRef.current) {
      mapRef.current.resetView();
    }
  }, [currentQuestion, players]);

  // ... rest of the component remains the same until the return statement ...

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      {/* ... previous JSX remains the same ... */}
      <div className="h-[400px] rounded-xl overflow-hidden">
        <MapComponent 
          key={mapKey}
          ref={mapRef}
          markers={markers}
          interactive={!isRevealing}
          showLabels={displayedAnswers.length > 0}
          showMarkerLabels={displayedAnswers.length > 0}
        />
      </div>
    </div>
  );
}
