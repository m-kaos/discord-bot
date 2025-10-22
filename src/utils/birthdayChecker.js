/**
 * Birthday Checker
 * Checks for birthdays and sends notifications to Discord
 */

const logger = require('./logger');
const { birthdays, settings } = require('../config');

/**
 * Check if today is anyone's birthday
 * @returns {Array} Array of birthday people today
 */
function checkBirthdays() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  const currentDay = now.getDate();

  const birthdaysToday = birthdays.filter(
    birthday => birthday.month === currentMonth && birthday.day === currentDay
  );

  return birthdaysToday;
}

/**
 * Send birthday notification to Discord channel
 */
async function sendBirthdayNotification(client, channelId) {
  try {
    const birthdaysToday = checkBirthdays();

    if (birthdaysToday.length === 0) {
      logger.info('No birthdays today');
      return;
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      logger.error(`Birthday channel not found: ${channelId}`);
      return;
    }

    for (const birthday of birthdaysToday) {
      const message = settings.birthdayMessage(birthday.name);
      await channel.send(message);
      logger.success(`Sent birthday notification for ${birthday.name}`);
    }
  } catch (error) {
    logger.error('Error sending birthday notification:', error);
  }
}

/**
 * Get upcoming birthdays (next 7 days)
 */
function getUpcomingBirthdays(days = 7) {
  const now = new Date();
  const upcoming = [];

  for (let i = 0; i < days; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);

    const month = checkDate.getMonth() + 1;
    const day = checkDate.getDate();

    const birthdaysOnDate = birthdays.filter(
      birthday => birthday.month === month && birthday.day === day
    );

    if (birthdaysOnDate.length > 0) {
      upcoming.push({
        date: checkDate,
        daysUntil: i,
        birthdays: birthdaysOnDate
      });
    }
  }

  return upcoming;
}

/**
 * Get all birthdays sorted by next occurrence
 */
function getAllBirthdaysSorted() {
  const now = new Date();
  const currentYear = now.getFullYear();

  return birthdays.map(birthday => {
    let nextBirthday = new Date(currentYear, birthday.month - 1, birthday.day);

    // If birthday has passed this year, use next year
    if (nextBirthday < now) {
      nextBirthday = new Date(currentYear + 1, birthday.month - 1, birthday.day);
    }

    const daysUntil = Math.ceil((nextBirthday - now) / (1000 * 60 * 60 * 24));

    return {
      ...birthday,
      nextDate: nextBirthday,
      daysUntil
    };
  }).sort((a, b) => a.daysUntil - b.daysUntil);
}

module.exports = {
  checkBirthdays,
  sendBirthdayNotification,
  getUpcomingBirthdays,
  getAllBirthdaysSorted
};
