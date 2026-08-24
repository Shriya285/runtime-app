// Lesson data. One lesson for now (matching what Dashboard already showed),
// structured so a second lesson is just another entry in LESSONS — every
// per-lesson feature (LeetCode link, struggle timer, spaced-repetition
// review record) is keyed by `id`, not hardcoded to this one problem.
//
// Test cases are language-agnostic (just args/expected data); each entry
// in `languages` supplies the syntax-specific pieces (entry point name,
// starter/solution code, filename) for one language. Both variants solve
// the problem the same way (two pointers on a sorted array) so the lesson
// stays pedagogically consistent regardless of which language you pick.

export const CURRENT_LESSON = {
  id: "two-pointers-two-sum",
  lessonNumber: 7,
  title: "Two Pointers",
  prompt:
    "Given a sorted array nums and a target, return the indices of the two numbers that add up to target.",
  testCases: [
    { args: [[2, 7, 11, 15], 9], expected: [0, 1], describe: "[2,7,11,15], target 9" },
    // Two pointers requires sorted input — [2,3,4] not [3,2,4] (the
    // unsorted classic LeetCode example), so 2+4=6 lands at indices [0,2].
    { args: [[2, 3, 4], 6], expected: [0, 2], describe: "[2,3,4], target 6" },
    { args: [[3, 3], 6], expected: [0, 1], describe: "[3,3], target 6" },
  ],
  defaultLanguage: "javascript",
  languages: {
    javascript: {
      label: "JavaScript",
      filename: "two-pointers.js",
      entryPoint: "twoSum",
      starterCode: `// two pointers, sorted array
function twoSum(nums, target) {
  // your code here
}
`,
      solutionCode: `// two pointers, sorted array
function twoSum(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    sum < target ? left++ : right--;
  }
}
`,
    },
    python: {
      label: "Python",
      filename: "two_pointers.py",
      entryPoint: "two_sum",
      starterCode: `# two pointers, sorted array
def two_sum(nums, target):
    # your code here
    pass
`,
      solutionCode: `# two pointers, sorted array
def two_sum(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        if total < target:
            left += 1
        else:
            right -= 1
`,
    },
  },
};

export const LESSONS = [CURRENT_LESSON];
