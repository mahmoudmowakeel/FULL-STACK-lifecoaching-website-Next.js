
export function convertTo12Hour(datetime: string) {
    // Extract the time part from the datetime string
    // Format: "2025-11-20 08:30"
    console.log(datetime + "timeeeeeeeeee")
    const timePart = datetime.split(' ')[1];
    const [hours, minutes] = timePart?.split(':');

    // Convert hours to a number
    let hour = parseInt(hours);

    // Determine AM or PM
    const period = hour >= 12 ? 'PM' : 'AM';

    // Convert hour to 12-hour format
    if (hour === 0) {
        hour = 12; // Midnight case
    } else if (hour > 12) {
        hour = hour - 12; // Afternoon/evening case
    }

    // Get the date part
    const datePart = datetime.split(' ')[0];

    // Return formatted datetime
    return `${datePart} ${hour}:${minutes} ${period}`;
}