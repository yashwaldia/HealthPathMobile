/**
 * HealthPath Firebase Cloud Functions
 * Phase 2 & 3: Push Notifications (Greetings & AI Weekly Reports)
 */

import { Expo, ExpoPushMessage } from "expo-server-sdk";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { setGlobalOptions } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";

// Import the new Weekly Report Service
import { generateWeeklyReport } from "./weeklyReportService";

// ✅ Define the secret so it can be used in function configurations
const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Expo Push Client
const expo = new Expo();

// Set global options for cost control
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});


// ============================================
// TYPES & INTERFACES
// ============================================

interface UserData {
  uid: string;
  email?: string;
  displayName?: string;
  pushToken?: string | null;
  timezone?: string;
  profile?: {
    notificationsEnabled?: boolean;
    fullName?: string;
  };
}

interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  color?: string;
  categoryIdentifier?: string;
}


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Send push notification via Expo Push Service
 */
async function sendPushNotification(
  payload: PushNotificationPayload
): Promise<void> {
  const {token, title, body, data, color, categoryIdentifier} = payload;

  if (!Expo.isExpoPushToken(token)) {
    logger.warn(`Invalid Expo push token: ${token}`);
    return;
  }

  const message: ExpoPushMessage = {
    to: token,
    sound: "default",
    title,
    body,
    data: data || {},
    priority: "high",
    ...(color && {color}),
    ...(categoryIdentifier && {categoryId: categoryIdentifier}),
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = await expo.sendPushNotificationsAsync(chunks[0]);
    const ticket = tickets[0];

    // Properly check if ticket is a success ticket (with id)
    if ("id" in ticket) {
      logger.info(`Push notification sent successfully: ${ticket.id}`);
    } else {
      logger.warn(`Push notification error: ${JSON.stringify(ticket)}`);
    }
  } catch (error) {
    logger.error("Error sending push notification:", error);
  }
}

/**
 * Get current hour in user's timezone
 */
function getUserLocalHour(timezone: string): number {
  const now = new Date();
  const userTime = now.toLocaleString("en-US", {timeZone: timezone});
  return new Date(userTime).getHours();
}

/**
 * Get users with notifications enabled and valid push tokens
 */
async function getNotifiableUsers(): Promise<UserData[]> {
  try {
    const usersSnapshot = await db
      .collection("users")
      .where("profile.notificationsEnabled", "==", true)
      .get();

    return usersSnapshot.docs
      .map((doc) => doc.data() as UserData)
      .filter((user) => user.pushToken && user.timezone);
  } catch (error) {
    logger.error("Error fetching notifiable users:", error);
    return [];
  }
}


// ============================================
// SCHEDULED FUNCTIONS
// ============================================

/**
 * Morning Greeting (8:00 AM user local time)
 * Runs every hour and checks which users are at 8 AM
 */
export const sendMorningGreetings = onSchedule(
  {
    schedule: "0 * * * *", // Every hour at minute 0
    timeZone: "UTC",
    memory: "256MiB",
  },
  async (event) => {
    logger.info("🌅 Starting morning greetings job");

    const users = await getNotifiableUsers();
    let sentCount = 0;

    for (const user of users) {
      if (!user.pushToken || !user.timezone) continue;

      const localHour = getUserLocalHour(user.timezone);

      // Send greeting if it's 8 AM in user's timezone
      if (localHour === 8) {
        const firstName = user.profile?.fullName?.split(" ")[0] ||
          user.displayName ||
          "there";

        await sendPushNotification({
          token: user.pushToken,
          title: `🌅 Good morning, ${firstName}!`,
          body: "Ready to start your healthy day? Time to log your vitals.",
          data: {
            type: "morning-greeting",
            userId: user.uid,
          },
          color: "#FFB199",
          categoryIdentifier: "greeting",
        });

        sentCount++;
        logger.info(`Sent morning greeting to user: ${user.uid}`);
      }
    }

    logger.info(`✅ Morning greetings sent to ${sentCount} users`);
  }
);


/**
 * Afternoon Reminder (2:00 PM user local time)
 * Runs every hour and checks which users are at 2 PM
 */
export const sendAfternoonReminder = onSchedule(
  {
    schedule: "0 * * * *", // Every hour at minute 0
    timeZone: "UTC",
    memory: "256MiB",
  },
  async (event) => {
    logger.info("💧 Starting afternoon reminder job");

    const users = await getNotifiableUsers();
    let sentCount = 0;

    for (const user of users) {
      if (!user.pushToken || !user.timezone) continue;

      const localHour = getUserLocalHour(user.timezone);

      // Send reminder if it's 2 PM in user's timezone
      if (localHour === 14) {
        await sendPushNotification({
          token: user.pushToken,
          title: "💧 Stay hydrated!",
          body: "Don't forget to drink water and log your vitals.",
          data: {
            type: "afternoon-reminder",
            userId: user.uid,
          },
          color: "#FF8C69",
          categoryIdentifier: "reminder",
        });

        sentCount++;
        logger.info(`Sent afternoon reminder to user: ${user.uid}`);
      }
    }

    logger.info(`✅ Afternoon reminders sent to ${sentCount} users`);
  }
);


/**
 * Evening Check-in (8:00 PM user local time)
 * Runs every hour and checks which users are at 8 PM
 */
export const sendEveningCheckIn = onSchedule(
  {
    schedule: "0 * * * *", // Every hour at minute 0
    timeZone: "UTC",
    memory: "256MiB",
  },
  async (event) => {
    logger.info("🌙 Starting evening check-in job");

    const users = await getNotifiableUsers();
    let sentCount = 0;

    for (const user of users) {
      if (!user.pushToken || !user.timezone) continue;

      const localHour = getUserLocalHour(user.timezone);

      // Send check-in if it's 8 PM in user's timezone
      if (localHour === 20) {
        await sendPushNotification({
          token: user.pushToken,
          title: "🌙 How was your day?",
          body: "Log your evening vitals before bed for better insights.",
          data: {
            type: "evening-checkin",
            userId: user.uid,
          },
          color: "#FF7B54",
          categoryIdentifier: "reminder",
        });

        sentCount++;
        logger.info(`Sent evening check-in to user: ${user.uid}`);
      }
    }

    logger.info(`✅ Evening check-ins sent to ${sentCount} users`);
  }
);


/**
 * Weekly Health Report (Monday 9:00 AM user local time)
 * Runs every hour on Monday and checks which users are at 9 AM
 */
export const sendWeeklyReport = onSchedule(
  {
    schedule: "0 * * * 1", // Every hour on Monday
    timeZone: "UTC",
    memory: "512MiB",
    secrets: [geminiApiKey],
  },
  async (event) => {
    logger.info("📊 Starting weekly report job");

    const users = await getNotifiableUsers();
    let sentCount = 0;

    for (const user of users) {
      if (!user.pushToken || !user.timezone) continue;

      const localHour = getUserLocalHour(user.timezone);

      // Send report if it's 9 AM on Monday in user's timezone
      if (localHour === 9) {
        const reportId = await generateWeeklyReport(user.uid);

        if (reportId) {
          await sendPushNotification({
            token: user.pushToken,
            title: "📊 Your Weekly Health Summary is Ready!",
            body: "Check out your AI-generated health insights for this week.",
            data: {
              type: "weekly-report",
              userId: user.uid,
              reportId: reportId
            },
            color: "#fa8a61ff",
            categoryIdentifier: "report",
          });

          sentCount++;
          logger.info(`Generated & sent weekly report to user: ${user.uid}`);
        } else {
          logger.info(`Skipped report generation for user: ${user.uid} (Inactive or Error)`);
        }
      }
    }

    logger.info(`✅ Weekly reports processed for ${sentCount} users`);
  }
);
