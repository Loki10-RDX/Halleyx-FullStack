export function evaluateCondition(condition, input) {
  try {
   const match = condition.match(/(\w+)\s*(>|<|==|!=)\s*(\w+)/);

if (!match) return false;

const [, field, operator, value] = match;

    const inputValue = input[field];

    if (inputValue === undefined) return false;

    switch (operator) {
      case ">":
        return inputValue > Number(value);
      case "<":
        return inputValue < Number(value);
      case "==":
        return inputValue == value;
      case "!=":
        return inputValue != value;
      default:
        return false;
    }
  } catch (e) {
    return false;
  }
}

export function getNextStep(rules, input) {
  for (let rule of rules) {
    if (evaluateCondition(rule.condition, input)) {
      return rule.nextStepId;
    }
  }
  return null;
}