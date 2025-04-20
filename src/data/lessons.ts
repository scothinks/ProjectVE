export const sampleLesson = {
    id: "honesty-001",
    title: "The Value of Honesty",
    thumbnail: require('../assets/thumbnails/honesty.png'),
    pages: [
      {
        type: "content",
        title: "Trust Starts with Truth",
        text: "Being honest builds trust, helps people rely on each other, and builds strong relationships.",
        image: require('../assets/pages/honesty-1.png'),
      },
      {
        type: "content",
        title: "The Ripple Effect",
        text: "One honest moment can inspire others. Your truthfulness creates a ripple that encourages others to be sincere too.",
        image: require('../assets/pages/honesty-1.png'),
      },
      {
        type: "quiz",
        question: "Which of these is a benefit of being honest?",
        options: ["More money", "Trust", "Being popular", "None of the above"],
        answerIndex: 1,
      },
      {
        type: "quiz",
        question: "What can honesty help build?",
        options: ["Loneliness", "Confusion", "Trust", "Doubt"],
        answerIndex: 2,
      },
      {
        type: "reflection",
        prompt: "Describe a time when being honest changed the outcome of a situation. How did it make you feel?"
      }
    ]
  };
  