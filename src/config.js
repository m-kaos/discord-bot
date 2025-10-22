/**
 * Bot Configuration
 * Birthday list and other settings
 */

const birthdays = [
  { name: 'Quetzali', month: 1, day: 10 },
  { name: 'Javier', month: 1, day: 16 },
  { name: 'Charlie', month: 2, day: 10 },
  { name: 'Eugenio', month: 3, day: 12 },
  { name: 'JJ', month: 3, day: 20 },
  { name: 'Limo', month: 3, day: 29 },
  { name: 'David', month: 4, day: 9 },
  { name: 'Chapa', month: 4, day: 20 },
  { name: 'Somi Joto', month: 4, day: 27 },
  { name: 'Lidia', month: 5, day: 19 },
  { name: 'Miranda', month: 5, day: 23 },
  { name: 'Bruno', month: 6, day: 28 },
  { name: 'Nina', month: 7, day: 1 },
  { name: 'Paola', month: 7, day: 19 },
  { name: 'Mau Guerra', month: 8, day: 8 },
  { name: 'Melicoff', month: 8, day: 31 },
  { name: 'Pato', month: 9, day: 24 },
  { name: 'Betty', month: 9, day: 27 },
  { name: 'Dante', month: 10, day: 3 },
  { name: 'Harper', month: 10, day: 16 },
  { name: 'Lynn', month: 10, day: 21 },
  { name: 'Mike', month: 11, day: 3 },
  { name: 'Alex M.', month: 12, day: 7 },
  { name: 'Mau Ruiz', month: 12, day: 18 },
];

module.exports = {
  birthdays,

  // Bot settings
  settings: {
    checkBirthdaysAt: '00:00', // Time to check birthdays (HH:mm format, 24-hour)
    birthdayMessage: (name) => `🎉🎂 **HAPPY BIRTHDAY ${name.toUpperCase()}!** 🎂🎉\n\nHave an amazing day! 🥳`,
  },

  // AI Chat settings
  // Add channel IDs here where the bot should actively respond to all messages
  // The bot will also respond when @mentioned or when its name is used in any channel
  chatChannels: [
    // Channel removed - bot only responds when @mentioned or name is used
  ],
};
