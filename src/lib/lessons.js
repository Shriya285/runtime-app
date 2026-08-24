// Lesson data. One lesson for now (matching what Dashboard already showed),
// structured so a second lesson is just another entry in LESSONS — every
// per-lesson feature (LeetCode link, struggle timer, spaced-repetition
// review record) is keyed by `id`, not hardcoded to this one problem.

export const CURRENT_LESSON = {
  id: "two-pointers-two-sum",
  lessonNumber: 7,
  title: "Two Pointers",
  filename: "two-pointers.js",
  language: "javascript",
  entryPoint: "twoSum",
  prompt:
    "Given a sorted array nums and a target, return the indices of the two numbers that add up to target.",
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
  testCases: [
    { args: [[2, 7, 11, 15], 9], expected: [0, 1], describe: "[2,7,11,15], target 9" },
    { args: [[3, 2, 4], 6], expected: [1, 2], describe: "[3,2,4], target 6" },
    { args: [[3, 3], 6], expected: [0, 1], describe: "[3,3], target 6" },
  ],
};

export const LESSONS = [CURRENT_LESSON];
