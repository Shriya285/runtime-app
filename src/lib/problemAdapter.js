// Converts a dataset problem (src/data/problems.json) into the same lesson
// shape Dashboard already knows how to render — see lessons.js for the
// hand-built version. This is what lets a study-plan day's problems run
// through the exact same struggle-timer/execution/completion flow as the
// two hand-built lessons without that flow needing to know the difference.
// testKind/pythonPrelude are the two fields hand-built lessons don't carry;
// useCodeExecution's driver defaults testKind to "args" when absent, so
// hand-built lessons are unaffected.
export function problemToLessonShape(problem) {
  return {
    id: `dataset-${problem.id}`,
    title: problem.title,
    pattern: problem.pattern,
    prompt: problem.description,
    testCases: problem.testCases,
    testKind: "assertions",
    pythonPrelude: problem.pythonPrelude,
    defaultLanguage: "python",
    languages: {
      python: {
        label: "Python",
        filename: `${problem.taskId}.py`,
        entryPoint: problem.entryPoint,
        starterCode: problem.starterCode,
        solutionCode: problem.solutionCode,
      },
    },
  };
}
