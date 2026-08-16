/**
 * Helper utility to parse date and time strings flexibly and compute dynamic status & countdowns.
 */

// Month name map for text dates like "14-Aug-2026" or "12-May-2026"
const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

export const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a Date object or date string into DD-Mon-YYYY (e.g. 14-Aug-2026)
 */
export const formatDateToDDMonYYYY = (dInput) => {
  if (!dInput) return '';
  if (typeof dInput === 'string' && /^\d{1,2}-[a-zA-Z]{3,}-\d{4}$/.test(dInput.trim())) {
    return dInput.trim();
  }
  const d = typeof dInput === 'string' ? new Date(dInput) : dInput;
  if (!d || isNaN(d.getTime())) return String(dInput || '');
  const day = String(d.getDate()).padStart(2, '0');
  const mon = MONTH_NAMES_SHORT[d.getMonth()] || 'Aug';
  const year = d.getFullYear();
  return `${day}-${mon}-${year}`;
};

/**
 * Returns current local date in DD-Mon-YYYY format (e.g. 14-Aug-2026)
 */
export const getCurrentDateDDMonYYYY = () => {
  return formatDateToDDMonYYYY(new Date());
};

/**
 * Standard 15-minute interval time options for time dropdown selector
 */
export const STANDARD_TIME_OPTIONS = [
  '12:00', '12:15', '12:30', '12:45',
  '01:00', '01:15', '01:30', '01:45',
  '02:00', '02:15', '02:30', '02:45',
  '03:00', '03:15', '03:30', '03:45',
  '04:00', '04:15', '04:30', '04:45',
  '05:00', '05:15', '05:30', '05:45',
  '06:00', '06:15', '06:30', '06:45',
  '07:00', '07:15', '07:30', '07:45',
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45'
];

/**
 * Returns current local date in YYYY-MM-DD format (legacy fallback)
 */
export const getCurrentDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns current local time split into { time: 'HH:MM', period: 'AM' | 'PM' }
 */
export const getCurrentTimeObject = (offsetHours = 0) => {
  const d = new Date();
  if (offsetHours !== 0) {
    d.setHours(d.getHours() + offsetHours);
  }
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes}`;
  return { time: timeStr, period };
};

/**
 * Parses date string and time string (e.g. "10:00" + "AM" or "10:00 AM") into a Date object
 */
export const parseQuizDateTime = (dateStr, timeStr, period = null) => {
  if (!dateStr) return null;

  try {
    let year = 2026;
    let month = 7; // Aug (0-indexed)
    let day = 14;

    const trimmedDate = String(dateStr).trim();

    // Case 1: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      const parts = trimmedDate.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }
    // Case 2: DD-MMM-YYYY (e.g. 14-Aug-2026)
    else if (/^\d{1,2}-[a-zA-Z]{3,}-\d{4}$/.test(trimmedDate)) {
      const parts = trimmedDate.split('-');
      day = parseInt(parts[0], 10);
      const mStr = parts[1].toLowerCase();
      month = MONTH_MAP[mStr] !== undefined ? MONTH_MAP[mStr] : 7;
      year = parseInt(parts[2], 10);
    }
    // Case 3: Standard JS Date parseable
    else {
      const d = new Date(trimmedDate);
      if (!isNaN(d.getTime())) {
        year = d.getFullYear();
        month = d.getMonth();
        day = d.getDate();
      }
    }

    let hours = 0;
    let minutes = 0;

    let fullTimeString = String(timeStr || '').trim();
    if (period && !fullTimeString.toLowerCase().includes('am') && !fullTimeString.toLowerCase().includes('pm')) {
      fullTimeString = `${fullTimeString} ${period}`;
    }

    if (fullTimeString) {
      const isPM = /pm/i.test(fullTimeString);
      const isAM = /am/i.test(fullTimeString);
      const match = fullTimeString.match(/(\d{1,2}):(\d{2})/);

      if (match) {
        let h = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);

        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        hours = h;
      }
    }

    return new Date(year, month, day, hours, minutes, 0);
  } catch (err) {
    console.warn('[parseQuizDateTime Error]:', err.message);
    return null;
  }
};

/**
 * Dynamically computes total quiz duration in minutes between start & end dates + times.
 */
export const calculateDynamicQuizDuration = (startDate, startTime, startPeriod, endDate, endTime, endPeriod) => {
  const start = parseQuizDateTime(startDate, startTime, startPeriod);
  const end = parseQuizDateTime(endDate || startDate, endTime, endPeriod);

  if (!start || !end) {
    return {
      durationMinutes: 30,
      formattedDuration: '30m',
      isValid: true,
      diffMinutes: 30
    };
  }

  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes <= 0) {
    return {
      durationMinutes: 30,
      formattedDuration: '30m (Invalid End Time)',
      isValid: false,
      diffMinutes
    };
  }

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  let formatted = '';
  if (hours > 0 && mins > 0) {
    formatted = `${hours}h ${mins}m`;
  } else if (hours > 0) {
    formatted = `${hours}h`;
  } else {
    formatted = `${mins}m`;
  }

  return {
    durationMinutes: diffMinutes,
    formattedDuration: formatted,
    isValid: true,
    diffMinutes
  };
};

/**
 * Determines dynamic quiz status based on current time:
 * 'upcoming' | 'running' | 'past' (completed / ended)
 */
export const getQuizAutoStatus = (quiz) => {
  if (!quiz) return 'running';

  // Explicit status override if explicitly specified as non-dynamic
  if (quiz.status === 'upcoming' && !quiz.startDate) return 'upcoming';
  if (quiz.status === 'past' && !quiz.startDate) return 'past';

  const startDateObj = parseQuizDateTime(quiz.startDate, quiz.startTime);
  const endDateObj = parseQuizDateTime(
    quiz.endDate || quiz.startDate,
    quiz.endTime
  );

  if (!startDateObj && !endDateObj) {
    return quiz.status || 'running';
  }

  const now = new Date();

  // If start date is in the future
  if (startDateObj && now < startDateObj) {
    return 'upcoming';
  }

  // If end date is passed
  if (endDateObj && now > endDateObj) {
    return 'past'; // Completed & Ended
  }

  // If duration is defined and start + duration has passed
  if (startDateObj && quiz.durationMinutes) {
    const calculatedEnd = new Date(startDateObj.getTime() + quiz.durationMinutes * 60 * 1000);
    if (now > calculatedEnd && (!endDateObj || now > endDateObj)) {
      return 'past'; // Completed & Ended
    }
  }

  // Otherwise, it is currently running (live)
  return 'running';
};

/**
 * Calculates countdown data (days, hours, minutes, seconds, text, and styling)
 * for a quiz challenge based on real-time current clock.
 * 
 * @param {Object} quiz 
 * @returns {Object} countdownData
 */
export const getQuizCountdownData = (quiz) => {
  const status = getQuizAutoStatus(quiz);
  const startDateObj = parseQuizDateTime(quiz?.startDate, quiz?.startTime);
  const endDateObj = parseQuizDateTime(
    quiz?.endDate || quiz?.startDate,
    quiz?.endTime
  ) || (startDateObj && quiz?.durationMinutes ? new Date(startDateObj.getTime() + quiz.durationMinutes * 60 * 1000) : null);

  const now = new Date();

  if (status === 'past') {
    return {
      status: 'past',
      label: 'Quiz Ended',
      formattedText: 'Completed',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isEnded: true,
      isCompleted: true,
      isExpired: true,
      badgeColor: 'bg-slate-500 text-white'
    };
  }

  const targetDate = status === 'upcoming' ? startDateObj : endDateObj;
  const label = status === 'upcoming' ? 'Starts in' : 'Ends in';
  const badgeColor = status === 'upcoming' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white';

  if (!targetDate) {
    return {
      status,
      label,
      formattedText: status === 'running' ? 'Live Now' : 'Scheduled',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isEnded: false,
      isCompleted: false,
      isExpired: false,
      badgeColor
    };
  }

  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    if (status === 'upcoming') {
      return {
        status: 'running',
        label: 'Starting Now!',
        formattedText: 'Live Now',
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isEnded: false,
        isCompleted: false,
        isExpired: false,
        badgeColor: 'bg-rose-500 text-white'
      };
    }
    return {
      status: 'past',
      label: 'Quiz Ended',
      formattedText: 'Completed',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isEnded: true,
      isCompleted: true,
      isExpired: true,
      badgeColor: 'bg-slate-500 text-white'
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  let formattedText;
  if (days > 0) {
    formattedText = `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  } else if (hours > 0) {
    formattedText = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  } else {
    formattedText = `${pad(minutes)}m ${pad(seconds)}s`;
  }

  return {
    status,
    label,
    formattedText,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isEnded: false,
    isCompleted: false,
    isExpired: false,
    badgeColor
  };
};

export default {
  getCurrentDateString,
  getCurrentTimeObject,
  parseQuizDateTime,
  calculateDynamicQuizDuration,
  getQuizAutoStatus,
  getQuizCountdownData
};
