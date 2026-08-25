// Shared Monday-anchored week boundary, used by both weekly-activity
// tracking and the completion history log so "this week" means the same
// thing in both places.
export function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
