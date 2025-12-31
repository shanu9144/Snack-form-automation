const cron = require("node-cron");
const runSnackBot = require("./snack");

// Schedule to run at 4:00 PM (16:00) Monday to Friday
cron.schedule("0 16 * * 1-5", () => {
  console.log("Running snack bot...");
  runSnackBot();
});