const questions = [
  "What are the benefits of using AI in climate resilience strategies?",
  "How can businesses use AI to enhance disaster preparedness?",
  "What are the challenges of implementing AI in energy distribution?",
  "Why is it important to address AI bias in autonomous drones?",
  "How does AI impact the future of energy storage systems?",
  "What are the benefits of using AI in renewable energy integration?",
  "How can technology improve flood prediction systems?",
  "What are the risks of AI in autonomous vehicles?",
  "How does climate change affect agricultural productivity?",
  "What are the benefits of using AI in climate adaptation planning?",
  "How can businesses use AI to improve energy efficiency?",
  "What are the challenges of implementing AI in energy management?",
  "Why is it important to regulate AI in autonomous submarines?",
  "How does AI influence the future of energy distribution networks?",
  "What are the benefits of using AI in smart grid optimization?",
  "How can technology improve landslide prediction systems?",
  "What are the risks of AI in autonomous vehicles?",
  "How does climate change affect fisheries?",
  "What are the benefits of using AI in climate risk management?",
  "How can businesses use AI to enhance sustainability reporting?",
  "What are the challenges of implementing AI in energy efficiency?",
  "Why is it important to address AI bias in autonomous systems?",
  "How does AI impact the future of energy storage solutions?",
  "What are the benefits of using AI in renewable energy forecasting?",
  "How can technology improve avalanche prediction systems?",
  "What are the risks of AI in autonomous vehicles?",
  "How does climate change affect forestry?",
  "What are the benefits of using AI in climate adaptation planning?",
  "How can businesses use AI to improve energy management?",
  "What are the challenges of implementing AI in energy storage?",
  "Why is it important to regulate AI in autonomous robots?",
  "How does AI influence the future of energy efficiency?",
  "What are the benefits of using AI in building energy management?",
];

function getRandomQuestion() {
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

export default getRandomQuestion;
