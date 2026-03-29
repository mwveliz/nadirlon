export const notifyNtfy = async (topic: string, message: string) => {
  if (!topic) return;
  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      body: message,
    });
    console.log(`Ping sent to ntfy.sh/${topic}`);
  } catch (error) {
    console.warn('Failed to send ntfy notification', error);
  }
};
