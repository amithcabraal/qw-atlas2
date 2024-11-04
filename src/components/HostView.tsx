// Previous imports remain the same...

export default function HostView({
  gameId,
  currentQuestion,
  players,
  answers: propAnswers,
  onNextQuestion,
  onRevealAnswers
}: HostViewProps) {
  const [showingAnswers, setShowingAnswers] = useState(false);
  const [displayedAnswers, setDisplayedAnswers] = useState<Answer[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const question = questions[currentQuestion];
  const allPlayersAnswered = players.length > 0 && players.every(p => p.has_answered);

  // Reset state when question changes
  useEffect(() => {
    console.log('Question changed, resetting state');
    setShowingAnswers(false);
    setDisplayedAnswers([]);
    setIsRevealing(false);
  }, [currentQuestion]);

  // Update displayed answers when answers prop changes or showing state changes
  useEffect(() => {
    console.log('Answers prop changed:', propAnswers);
    
    if (showingAnswers) {
      // Only show answers for the current question
      const relevantAnswers = propAnswers.filter(a => a.question_id === currentQuestion);
      console.log('Setting displayed answers:', relevantAnswers);
      setDisplayedAnswers(relevantAnswers);
    } else {
      setDisplayedAnswers([]);
    }
  }, [propAnswers, showingAnswers, currentQuestion]);

  // Prepare markers for the map
  const markers = showingAnswers ? [
    { 
      latitude: question.latitude, 
      longitude: question.longitude, 
      color: 'text-green-500',
      fill: true,
      label: 'Correct Location'
    },
    ...displayedAnswers.map(answer => {
      const player = players.find(p => p.id === answer.player_id);
      return {
        latitude: answer.latitude,
        longitude: answer.longitude,
        color: 'text-red-500',
        fill: true,
        label: player?.initials || 'Unknown'
      };
    })
  ] : [];

  const handleReveal = async () => {
    if (isRevealing) return;

    try {
      setIsRevealing(true);
      
      // Update game status
      onRevealAnswers();

      // Fetch answers for current question
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', gameId)
        .eq('question_id', currentQuestion);

      if (answersError) throw answersError;

      console.log('Fetched answers on reveal:', answersData);
      
      // Update local state
      setShowingAnswers(true);
      if (answersData) {
        setDisplayedAnswers(answersData);
      }
    } catch (err) {
      console.error('Error revealing answers:', err);
    } finally {
      setIsRevealing(false);
    }
  };

  const handleNext = () => {
    setShowingAnswers(false);
    setDisplayedAnswers([]);
    onNextQuestion();
  };

  // Rest of the component remains the same...
}
