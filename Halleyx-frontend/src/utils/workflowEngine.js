import { getNextStep } from "./ruleEngine";

export function runWorkflow(startStepId, steps, allRules, input) {
  let currentStepId = startStepId;

  const path = [];

const visited = new Set();

while (currentStepId && !visited.has(currentStepId)) {
  visited.add(currentStepId);
    const currentStep = steps.find(s => s.id === currentStepId);

    if (!currentStep) break;

    path.push(currentStep.name);

    // 🔥 Get rules for this step
    const stepRules = allRules
      .filter(r => r.stepId === currentStepId)
      .map(r => ({
        condition: r.condition,
        nextStepId: r.nextStep?.id || r.nextStepId
      }));

    const nextStepId = getNextStep(stepRules, input);

    if (!nextStepId) break;

    currentStepId = nextStepId;
  }

  return path;
}