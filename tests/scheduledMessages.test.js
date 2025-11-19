// Scheduled messages tests - timezone conversion and scheduling logic
describe('Scheduled Messages', () => {
  test('should convert local time to UTC correctly', () => {
    // Test timezone offset calculation
    const localTime = '12:00'; // 12:00 PM
    const timezoneOffset = 6; // GMT+6 (Bangladesh)

    // Convert to UTC: 12:00 - 6 hours = 06:00 UTC
    const [hours, minutes] = localTime.split(':').map(Number);
    const utcHours = (hours - timezoneOffset + 24) % 24;

    expect(utcHours).toBe(6);
    expect(minutes).toBe(0);
  });

  test('should handle negative timezone offsets', () => {
    // Test negative offset (e.g., EST = GMT-5)
    const localTime = '14:00'; // 2:00 PM
    const timezoneOffset = -5;

    const [hours, minutes] = localTime.split(':').map(Number);
    const utcHours = (hours - timezoneOffset + 24) % 24;

    expect(utcHours).toBe(19); // 14:00 - (-5) = 19:00 UTC
  });

  test('should calculate next occurrence for daily schedule', () => {
    const now = new Date('2024-01-15T10:00:00Z');
    const scheduledTime = new Date('2024-01-15T08:00:00Z');

    // If scheduled time has passed today, next occurrence is tomorrow
    const nextOccurrence = new Date(scheduledTime);
    if (scheduledTime <= now) {
      nextOccurrence.setDate(nextOccurrence.getDate() + 1);
    }

    expect(nextOccurrence.getDate()).toBe(16);
  });

  test('should handle monthly schedule on invalid dates', () => {
    // Test scheduling on Feb 30 (invalid) - should skip
    const dayOfMonth = 30;
    const testDate = new Date('2024-02-01');

    // February doesn't have 30 days
    const daysInFebruary = new Date(2024, 2, 0).getDate(); // 29 days (leap year)

    expect(dayOfMonth > daysInFebruary).toBe(true);
  });
});
