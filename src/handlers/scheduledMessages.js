/**
 * Scheduled Messages Handler - Automatic announcements and reminders
 * UPDATED: Now supports timezone-aware scheduling with one-time/daily/weekly/monthly types
 * Properly handles guild config resets by cancelling active timers
 * Author: nayandas69
 */

import { getScheduledMessages, removeScheduledMessage } from '../data/storage.js';
import { ActivityType } from 'discord.js';
import { setTemporaryStatus } from '../utils/activityManager.js';
import log from '../utils/colors.js';

// Store active timers so they can be cleared on reset or bot shutdown
const activeTimers = new Map();

/**
 * Calculate next execution time for scheduled message
 * UPDATED: Now supports timezone offsets and monthly schedules
 * @param {Object} schedule - Schedule configuration
 * @returns {number} Milliseconds until next execution, or null if invalid
 */
function calculateNextExecution(schedule) {
  const now = new Date();

  // Parse the scheduled time
  const [hours, minutes] = schedule.time.split(':').map(Number);

  // timezoneOffset is in hours (e.g., -5 for EST, +5.5 for IST)
  const timezoneOffsetHours = schedule.timezoneOffset || 0;
  const utcHours = (hours - timezoneOffsetHours + 24) % 24; // Convert to UTC

  let nextExecution = new Date();

  switch (schedule.type) {
    case 'once':
      nextExecution.setUTCHours(utcHours, minutes, 0, 0);

      // If the time has passed today, this message should not execute again
      if (nextExecution <= now) {
        log.warn(`One-time message has already passed its execution time`);
        return null;
      }
      break;

    case 'daily':
      nextExecution.setUTCHours(utcHours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (nextExecution <= now) {
        nextExecution.setUTCDate(nextExecution.getUTCDate() + 1);
      }
      break;

    case 'weekly':
      const currentDay = now.getUTCDay();
      let daysUntilNext = schedule.dayOfWeek - currentDay;

      // Calculate days until the target day of week
      if (
        daysUntilNext < 0 ||
        (daysUntilNext === 0 &&
          now.getUTCHours() * 60 + now.getUTCMinutes() >= utcHours * 60 + minutes)
      ) {
        daysUntilNext += 7; // Schedule for next week
      }

      nextExecution.setUTCDate(now.getUTCDate() + daysUntilNext);
      nextExecution.setUTCHours(utcHours, minutes, 0, 0);
      break;

    case 'monthly':
      nextExecution.setUTCHours(utcHours, minutes, 0, 0);
      nextExecution.setUTCDate(schedule.dayOfMonth);

      // If this month's date has passed, schedule for next month
      if (nextExecution <= now) {
        nextExecution.setUTCMonth(nextExecution.getUTCMonth() + 1);
      }

      // Handle months with fewer days (e.g., February 30th -> March 2nd)
      // This ensures the message still sends, just on the closest valid date
      if (nextExecution.getUTCDate() !== schedule.dayOfMonth) {
        log.warn(`Day ${schedule.dayOfMonth} doesn't exist in this month, using closest date`);
      }
      break;

    default:
      log.error(`Unknown schedule type: ${schedule.type}`);
      return null;
  }

  return nextExecution.getTime() - now.getTime();
}

/**
 * Execute a scheduled message
 * UPDATED: Now removes one-time messages after execution
 * @param {Client} client - Discord client instance
 * @param {Object} messageConfig - Message configuration
 */
async function executeScheduledMessage(client, messageConfig) {
  try {
    setTemporaryStatus(`Sending: ${messageConfig.name}`, ActivityType.Playing, 6000);

    // Find the target channel
    const channel = client.channels.cache.get(messageConfig.channelId);
    if (!channel) {
      log.error(`Scheduled message channel not found: ${messageConfig.channelId}`);
      return;
    }

    // Check bot permissions
    if (!channel.permissionsFor(client.user).has('SendMessages')) {
      log.error(`Bot missing send messages permission in ${channel.name}`);
      return;
    }

    // Create message content
    const messageData = {};

    // Add text content if provided
    if (messageConfig.content) {
      messageData.content = messageConfig.content;
    }

    // Add embed if configured
    if (messageConfig.embed) {
      messageData.embeds = [
        {
          color: parseInt(messageConfig.embed.color.replace('#', ''), 16) || 0x0099ff,
          title: messageConfig.embed.title,
          description: messageConfig.embed.description,
          timestamp: new Date().toISOString(),
          footer: messageConfig.embed.footer
            ? { text: messageConfig.embed.footer }
            : { text: 'Scheduled Message' }
        }
      ];
    }

    // Send the message
    await channel.send(messageData);
    log.success(`Sent scheduled message to ${channel.name} in ${channel.guild.name}`);

    if (messageConfig.recurring) {
      // Reschedule recurring messages (daily, weekly, monthly)
      scheduleMessage(client, messageConfig);
    } else {
      // Remove one-time messages after execution
      log.info(`One-time message "${messageConfig.name}" completed, removing from schedule`);
      removeScheduledMessage(messageConfig.guildId, messageConfig.id);
      activeTimers.delete(messageConfig.id);
    }
  } catch (error) {
    log.error('Error executing scheduled message', error);
  }
}

/**
 * Schedule a message for future execution
 * UPDATED: Handles timezone-aware scheduling
 * @param {Client} client - Discord client instance
 * @param {Object} messageConfig - Message configuration
 */
function scheduleMessage(client, messageConfig) {
  // Clear any existing timer for this message
  const existingTimer = activeTimers.get(messageConfig.id);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Calculate when to execute this message
  const delay = calculateNextExecution(messageConfig.schedule);
  if (!delay || delay < 0) {
    log.warn(`Cannot schedule message "${messageConfig.name}" - invalid execution time`);
    return;
  }

  const nextTime = new Date(Date.now() + delay);
  const timezoneStr =
    messageConfig.schedule.timezoneOffset === 0
      ? 'UTC'
      : `UTC${messageConfig.schedule.timezoneOffset > 0 ? '+' : ''}${messageConfig.schedule.timezoneOffset}`;

  log.system(
    `Scheduled message "${messageConfig.name}" will execute at ${nextTime.toLocaleString()} (${timezoneStr})`
  );

  // Set the timer
  const timer = setTimeout(() => {
    executeScheduledMessage(client, messageConfig);
  }, delay);

  activeTimers.set(messageConfig.id, timer);
}

/**
 * Initialize scheduled messages system
 * UPDATED: Properly handles guild config resets and timezone-aware scheduling
 * @param {Client} client - Discord client instance
 */
export function setupScheduledMessages(client) {
  log.success('Scheduled messages handler initialized');

  // Load all existing scheduled messages from storage
  const allScheduled = getScheduledMessages();

  for (const [guildId, messages] of allScheduled) {
    for (const message of messages) {
      if (message.enabled) {
        scheduleMessage(client, message);
      }
    }
  }

  // Listen for new scheduled messages being added
  client.on('scheduleAdded', (messageConfig) => {
    log.info(`Activating new scheduled message: ${messageConfig.name}`);
    scheduleMessage(client, messageConfig);
  });

  // This ensures scheduled messages stop immediately when /reset is used
  client.on('guildConfigReset', (guildId) => {
    log.system(`[RESET] Clearing scheduled messages for guild: ${guildId}`);

    // Get the guild's scheduled messages BEFORE they're deleted from storage
    const allScheduled = getScheduledMessages();
    const guildMessages = allScheduled.get(guildId) || [];

    let cancelledCount = 0;
    for (const message of guildMessages) {
      const timer = activeTimers.get(message.id);
      if (timer) {
        clearTimeout(timer); // Cancel the timer
        activeTimers.delete(message.id); // Remove from active timers map
        cancelledCount++;
        log.system(`[RESET] Cancelled scheduled message: ${message.name} (ID: ${message.id})`);
      }
    }

    log.success(`[RESET] Cancelled ${cancelledCount} scheduled message(s) for guild`);
  });

  log.system(`Loaded ${allScheduled.size} scheduled message configurations`);
  log.info('Scheduled messages active - automatic announcements enabled');
}

/**
 * Cancel a specific scheduled message
 * Used by the remove-scheduled command
 * @param {string} messageId - Message ID to cancel
 * @returns {boolean} True if cancelled, false if not found
 */
export function cancelScheduledMessage(messageId) {
  const timer = activeTimers.get(messageId);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(messageId);
    log.info(`Cancelled scheduled message: ${messageId}`);
    return true;
  }
  return false;
}

/**
 * Cancel all scheduled messages (for graceful bot shutdown)
 */
export function cancelAllScheduledMessages() {
  for (const [id, timer] of activeTimers) {
    clearTimeout(timer);
  }
  activeTimers.clear();
  log.system('All scheduled messages cancelled');
}
