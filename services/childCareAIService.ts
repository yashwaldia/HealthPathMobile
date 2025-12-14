// services/childCareAIService.ts
// AI-powered weekly batch content generation for child care
// Last Updated: December 13, 2025

import { FEEDING_GUIDELINES, getAgeGroup, getDailyTasksForAge, getMilestoneForAge } from '../constants/childCareData';
import { ChildCareProfile, DailyAIContent, WeeklyAIContent } from '../types/wellness';
import { generateWithGemini } from './wellnessAIService';

// Cache duration: 10 days (as per user requirement)
const CACHE_DURATION_DAYS = 10;

/**
 * Get current week ID (ISO week format: YYYY-Www)
 */
export function getWeekId(date: Date = new Date()): string {
  const tempDate = new Date(date.valueOf());
  const dayNum = (tempDate.getDay() + 6) % 7;
  tempDate.setDate(tempDate.getDate() - dayNum + 3);
  const firstThursday = tempDate.valueOf();
  tempDate.setMonth(0, 1);
  if (tempDate.getDay() !== 4) {
    tempDate.setMonth(0, 1 + ((4 - tempDate.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - tempDate.valueOf()) / 604800000);
  return `${tempDate.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Get day of week name
 */
function getDayOfWeek(dayNumber: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayNumber - 1] || 'Monday';
}

/**
 * Generate complete 7-day content in ONE AI call
 */
export async function generateWeeklyContent(
  profile: ChildCareProfile
): Promise<WeeklyAIContent> {
  try {
    console.log(`🤖 Generating weekly AI content for ${profile.childName} (${profile.ageInMonths} months)...`);

    const prompt = buildWeeklyPrompt(profile);
    const aiResponse = await generateWithGemini(prompt);
    const weeklyContent = parseWeeklyResponse(aiResponse, profile);

    console.log(`✅ Successfully generated 7 days of content for ${profile.childName}`);
    return weeklyContent;
  } catch (error) {
    console.error('❌ AI weekly generation failed:', error);
    throw error;
  }
}

/**
 * Build comprehensive prompt for 7 days
 */
function buildWeeklyPrompt(profile: ChildCareProfile): string {
  const gender = profile.gender === 'male' ? 'boy' : profile.gender === 'female' ? 'girl' : 'child';
  const pronoun = profile.gender === 'male' ? 'he/his' : profile.gender === 'female' ? 'she/her' : 'they/their';

  return `You are an expert pediatrician and child development specialist. Generate a complete 7-day personalized care plan for ${profile.childName}, a ${profile.ageInMonths}-month-old ${gender}.

CRITICAL INSTRUCTIONS:
1. Days 1-4: Create COMPLETELY UNIQUE content with NO repetition
2. Days 5-7: Create variations by intelligently combining/shuffling content from days 1-4
3. NEVER repeat the exact same task on the same day
4. Use ${profile.childName}'s name throughout (e.g., "Feed ${profile.childName}", "Play with ${profile.childName}")
5. Use appropriate pronouns (${pronoun})
6. Age-appropriate content for ${profile.ageInMonths} months old
7. Include emojis for visual appeal

CONTENT REQUIREMENTS PER DAY:
- 6-8 daily tasks (feeding, hygiene, play, learning, sleep)
- Developmental milestones (physical, cognitive, social, language)
- Feeding schedule with times
- Activities for morning, afternoon, evening

Return ONLY valid JSON in this EXACT format (no markdown, no explanations):

{
  "week": {
    "day1": {
      "tasks": [
        {
          "taskId": "d1-feed-morning",
          "name": "Feed ${profile.childName} morning bottle/meal",
          "category": "feeding",
          "priority": "high",
          "completed": false,
          "emoji": "🍼"
        },
        {
          "taskId": "d1-tummy-time",
          "name": "Tummy time with ${profile.childName} (10-15 mins)",
          "category": "activity",
          "priority": "high",
          "completed": false,
          "emoji": "🤸"
        },
        {
          "taskId": "d1-diaper",
          "name": "Check ${profile.childName}'s diaper (aim for 6-8 changes)",
          "category": "hygiene",
          "priority": "high",
          "completed": false,
          "emoji": "🧷"
        },
        {
          "taskId": "d1-reading",
          "name": "Read colorful books to ${profile.childName}",
          "category": "learning",
          "priority": "medium",
          "completed": false,
          "emoji": "📖"
        },
        {
          "taskId": "d1-nap",
          "name": "Afternoon nap routine for ${profile.childName}",
          "category": "sleep",
          "priority": "high",
          "completed": false,
          "emoji": "😴"
        },
        {
          "taskId": "d1-bath",
          "name": "Evening bath time with ${profile.childName}",
          "category": "hygiene",
          "priority": "medium",
          "completed": false,
          "emoji": "🛁"
        }
      ],
      "milestones": {
        "physical": ["${profile.childName} can lift ${pronoun.split('/')[1]} head 45 degrees", "Developing neck strength"],
        "cognitive": ["${profile.childName} tracks moving objects", "Recognizes familiar faces"],
        "social": ["${profile.childName} smiles responsively", "Enjoys interaction"],
        "language": ["${profile.childName} coos and babbles", "Responds to sounds"],
        "tips": ["Encourage tummy time daily", "Talk to ${profile.childName} frequently", "Read colorful books together"]
      },
      "feeding": {
        "summary": "At ${profile.ageInMonths} months, ${profile.childName} needs regular feedings every 2-4 hours",
        "schedule": [
          {"time": "7:00 AM", "activity": "Morning feed for ${profile.childName}", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "10:00 AM", "activity": "Mid-morning feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "1:00 PM", "activity": "Lunch feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "4:00 PM", "activity": "Afternoon feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "7:00 PM", "activity": "Evening feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "10:00 PM", "activity": "Bedtime feed", "amount": "6-8 oz", "emoji": "🍼"}
        ],
        "tips": ["Watch for hunger cues from ${profile.childName}", "Keep ${profile.childName} upright after feeding", "Track wet diapers (6-8 per day)"]
      },
      "activities": {
        "morning": ["🌅 Morning walk with ${profile.childName} in stroller", "🎵 Sing nursery rhymes during diaper change", "🪞 Mirror play time with ${profile.childName}"],
        "afternoon": ["📖 Read board books to ${profile.childName}", "🧸 Sensory play with soft toys", "🛌 Afternoon nap routine"],
        "evening": ["🛁 Bath time with gentle songs", "👶 Cuddle time before bed with ${profile.childName}", "🌙 Bedtime routine starting at 7 PM"]
      }
    },
    "day2": {
      "tasks": [
        {
          "taskId": "d2-feed-morning",
          "name": "Morning feeding session with ${profile.childName}",
          "category": "feeding",
          "priority": "high",
          "completed": false,
          "emoji": "🍼"
        },
        {
          "taskId": "d2-outdoor",
          "name": "Outdoor time - fresh air for ${profile.childName}",
          "category": "activity",
          "priority": "medium",
          "completed": false,
          "emoji": "🌳"
        },
        {
          "taskId": "d2-music",
          "name": "Music time - sing to ${profile.childName}",
          "category": "learning",
          "priority": "medium",
          "completed": false,
          "emoji": "🎵"
        },
        {
          "taskId": "d2-diaper",
          "name": "Regular diaper checks for ${profile.childName}",
          "category": "hygiene",
          "priority": "high",
          "completed": false,
          "emoji": "🧷"
        },
        {
          "taskId": "d2-floor-play",
          "name": "Floor playtime with ${profile.childName}",
          "category": "activity",
          "priority": "high",
          "completed": false,
          "emoji": "🧸"
        },
        {
          "taskId": "d2-evening-feed",
          "name": "Evening feeding time",
          "category": "feeding",
          "priority": "high",
          "completed": false,
          "emoji": "🍼"
        }
      ],
      "milestones": {
        "physical": ["Stronger head control developing", "${profile.childName} brings hands together"],
        "cognitive": ["Beginning to recognize ${pronoun.split('/')[1]} name", "Watches faces intently"],
        "social": ["Enjoys being held and talked to", "May laugh or giggle"],
        "language": ["Makes vowel sounds", "Cries differently for different needs"],
        "tips": ["Practice tummy time multiple times daily", "Respond to ${profile.childName}'s sounds", "Maintain eye contact during feeding"]
      },
      "feeding": {
        "summary": "${profile.childName} continues regular feeding schedule",
        "schedule": [
          {"time": "6:30 AM", "activity": "Early morning feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "9:30 AM", "activity": "Mid-morning snack", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "12:30 PM", "activity": "Lunch feeding", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "3:30 PM", "activity": "Afternoon feeding", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "6:30 PM", "activity": "Dinner time", "amount": "6-8 oz", "emoji": "🍼"}
        ],
        "tips": ["Burp ${profile.childName} after each feeding", "Watch for fullness cues", "Keep feeding times calm and quiet"]
      },
      "activities": {
        "morning": ["🌤️ Open curtains for natural light", "🎶 Play gentle music for ${profile.childName}", "💆 Gentle baby massage"],
        "afternoon": ["🧩 Show ${profile.childName} different textures", "👀 Face-to-face interaction time", "🎨 Show high-contrast images"],
        "evening": ["🌅 Dimmed lights for calm atmosphere", "📱 Photo time with ${profile.childName}", "🛌 Early bedtime preparation"]
      }
    },
    "day3": {
      "tasks": [
        {
          "taskId": "d3-feed-breakfast",
          "name": "Breakfast feeding for ${profile.childName}",
          "category": "feeding",
          "priority": "high",
          "completed": false,
          "emoji": "🍼"
        },
        {
          "taskId": "d3-sensory",
          "name": "Sensory exploration with ${profile.childName}",
          "category": "learning",
          "priority": "medium",
          "completed": false,
          "emoji": "👐"
        },
        {
          "taskId": "d3-skin-care",
          "name": "Skin care routine for ${profile.childName}",
          "category": "hygiene",
          "priority": "medium",
          "completed": false,
          "emoji": "🧴"
        },
        {
          "taskId": "d3-exercise",
          "name": "Gentle leg exercises with ${profile.childName}",
          "category": "activity",
          "priority": "medium",
          "completed": false,
          "emoji": "🦵"
        },
        {
          "taskId": "d3-story",
          "name": "Storytime with ${profile.childName}",
          "category": "learning",
          "priority": "medium",
          "completed": false,
          "emoji": "📚"
        },
        {
          "taskId": "d3-bedtime",
          "name": "Bedtime routine preparation",
          "category": "sleep",
          "priority": "high",
          "completed": false,
          "emoji": "🌙"
        }
      ],
      "milestones": {
        "physical": ["${profile.childName} pushes up during tummy time", "Improved head steadiness"],
        "cognitive": ["Focuses on moving objects", "Shows interest in new toys"],
        "social": ["Smiles at familiar people", "Calms with soothing voice"],
        "language": ["Babbles more frequently", "Makes sounds back to you"],
        "tips": ["Introduce new sounds and textures", "Provide supervised floor time", "Create a consistent daily routine"]
      },
      "feeding": {
        "summary": "Maintaining consistent feeding patterns for ${profile.childName}",
        "schedule": [
          {"time": "7:30 AM", "activity": "Morning meal", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "11:00 AM", "activity": "Late morning feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "2:00 PM", "activity": "Early afternoon feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "5:00 PM", "activity": "Late afternoon feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "8:00 PM", "activity": "Evening feed", "amount": "6-8 oz", "emoji": "🍼"}
        ],
        "tips": ["Note ${profile.childName}'s feeding preferences", "Ensure comfortable positioning", "Monitor diaper output"]
      },
      "activities": {
        "morning": ["☀️ Morning routine with ${profile.childName}", "🎈 Show colorful objects", "🗣️ Talk about daily activities"],
        "afternoon": ["🏃 Active play session", "🎭 Make funny faces for ${profile.childName}", "🧠 Cognitive stimulation activities"],
        "evening": ["🕯️ Calm down activities", "🎼 Lullabies for ${profile.childName}", "😴 Prepare sleep environment"]
      }
    },
    "day4": {
      "tasks": [
        {
          "taskId": "d4-morning-care",
          "name": "Morning care routine for ${profile.childName}",
          "category": "hygiene",
          "priority": "high",
          "completed": false,
          "emoji": "🧼"
        },
        {
          "taskId": "d4-feed",
          "name": "Regular feeding schedule",
          "category": "feeding",
          "priority": "high",
          "completed": false,
          "emoji": "🍼"
        },
        {
          "taskId": "d4-bonding",
          "name": "Bonding time with ${profile.childName}",
          "category": "social",
          "priority": "high",
          "completed": false,
          "emoji": "💕"
        },
        {
          "taskId": "d4-mobility",
          "name": "Practice motor skills with ${profile.childName}",
          "category": "activity",
          "priority": "medium",
          "completed": false,
          "emoji": "🏃"
        },
        {
          "taskId": "d4-communication",
          "name": "Communication practice - talk to ${profile.childName}",
          "category": "learning",
          "priority": "medium",
          "completed": false,
          "emoji": "💬"
        },
        {
          "taskId": "d4-sleep",
          "name": "Nap time for ${profile.childName}",
          "category": "sleep",
          "priority": "high",
          "completed": false,
          "emoji": "💤"
        }
      ],
      "milestones": {
        "physical": ["Better control of movements", "${profile.childName} may roll to side"],
        "cognitive": ["Recognizes bottle or breast", "Anticipates routine activities"],
        "social": ["Enjoys playtime more", "Shows excitement when seeing caregivers"],
        "language": ["More varied sounds", "Responds to tone of voice"],
        "tips": ["Encourage reaching for objects", "Respond promptly to ${profile.childName}'s needs", "Keep environment safe for exploration"]
      },
      "feeding": {
        "summary": "Fourth day feeding routine for ${profile.childName}",
        "schedule": [
          {"time": "7:00 AM", "activity": "Start day with feeding", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "10:30 AM", "activity": "Mid-morning nutrition", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "1:30 PM", "activity": "Afternoon meal", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "4:30 PM", "activity": "Late afternoon feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "7:30 PM", "activity": "Bedtime feeding", "amount": "6-8 oz", "emoji": "🍼"}
        ],
        "tips": ["Watch for growth spurts", "Maintain calm feeding environment", "Track ${profile.childName}'s intake patterns"]
      },
      "activities": {
        "morning": ["🌈 Show bright colors to ${profile.childName}", "🎪 Playtime activities", "🎤 Sing morning songs"],
        "afternoon": ["🛝 Floor gym time", "👋 Practice waving with ${profile.childName}", "🔊 Introduce new sounds"],
        "evening": ["📖 Quiet reading time", "🌜 Prepare for nighttime", "🤗 Extra cuddles with ${profile.childName}"]
      }
    },
    "day5": {
      "tasks": [
        {
          "taskId": "d5-feed-morning",
          "name": "Feed ${profile.childName} morning bottle/meal",
          "category": "feeding",
          "priority": "high",
          "completed": false,
          "emoji": "🍼"
        },
        {
          "taskId": "d5-outdoor",
          "name": "Outdoor time - fresh air for ${profile.childName}",
          "category": "activity",
          "priority": "medium",
          "completed": false,
          "emoji": "🌳"
        },
        {
          "taskId": "d5-diaper",
          "name": "Check ${profile.childName}'s diaper regularly",
          "category": "hygiene",
          "priority": "high",
          "completed": false,
          "emoji": "🧷"
        },
        {
          "taskId": "d5-sensory",
          "name": "Sensory exploration activities",
          "category": "learning",
          "priority": "medium",
          "completed": false,
          "emoji": "👐"
        },
        {
          "taskId": "d5-nap",
          "name": "Afternoon nap for ${profile.childName}",
          "category": "sleep",
          "priority": "high",
          "completed": false,
          "emoji": "😴"
        },
        {
          "taskId": "d5-bath",
          "name": "Evening bath time",
          "category": "hygiene",
          "priority": "medium",
          "completed": false,
          "emoji": "🛁"
        }
      ],
      "milestones": {
        "physical": ["${profile.childName} can lift ${pronoun.split('/')[1]} head 45 degrees", "Developing stronger muscles"],
        "cognitive": ["Tracks moving objects well", "Shows curiosity about surroundings"],
        "social": ["Enjoys interaction and play", "Responds to facial expressions"],
        "language": ["Babbles and coos regularly", "Makes happy sounds"],
        "tips": ["Continue tummy time practice", "Engage in face-to-face play", "Maintain consistent routines"]
      },
      "feeding": {
        "summary": "Weekend feeding routine for ${profile.childName}",
        "schedule": [
          {"time": "7:00 AM", "activity": "Morning feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "10:00 AM", "activity": "Mid-morning feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "1:00 PM", "activity": "Lunch feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "4:00 PM", "activity": "Afternoon feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "7:00 PM", "activity": "Evening feed", "amount": "6-8 oz", "emoji": "🍼"}
        ],
        "tips": ["Stay flexible with timing", "Watch ${profile.childName}'s hunger signals", "Keep feeding positive"]
      },
      "activities": {
        "morning": ["🌅 Morning walk with ${profile.childName}", "🎵 Music and movement", "🪞 Mirror exploration"],
        "afternoon": ["📖 Reading colorful books", "🧸 Toy playtime", "🎨 Visual stimulation"],
        "evening": ["🛁 Relaxing bath routine", "👶 Quiet bonding time", "🌙 Prepare for sleep"]
      }
    },
    "day6": {
      "tasks": [
        {
          "taskId": "d6-feed-breakfast",
          "name": "Breakfast feeding for ${profile.childName}",
          "category": "feeding",
          "priority": "high",
          "completed": false,
          "emoji": "🍼"
        },
        {
          "taskId": "d6-music",
          "name": "Music time with ${profile.childName}",
          "category": "learning",
          "priority": "medium",
          "completed": false,
          "emoji": "🎵"
        },
        {
          "taskId": "d6-skin-care",
          "name": "Skin care routine",
          "category": "hygiene",
          "priority": "medium",
          "completed": false,
          "emoji": "🧴"
        },
        {
          "taskId": "d6-floor-play",
          "name": "Floor playtime activities",
          "category": "activity",
          "priority": "high",
          "completed": false,
          "emoji": "🧸"
        },
        {
          "taskId": "d6-story",
          "name": "Story and reading time",
          "category": "learning",
          "priority": "medium",
          "completed": false,
          "emoji": "📚"
        },
        {
          "taskId": "d6-bedtime",
          "name": "Bedtime routine",
          "category": "sleep",
          "priority": "high",
          "completed": false,
          "emoji": "🌙"
        }
      ],
      "milestones": {
        "physical": ["Improved head control", "${profile.childName} brings hands together more"],
        "cognitive": ["Beginning name recognition", "Follows objects with eyes"],
        "social": ["Enjoys being talked to", "May show early laughter"],
        "language": ["Makes vowel sounds often", "Different cries for needs"],
        "tips": ["Practice tummy time several times", "Talk to ${profile.childName} frequently", "Maintain eye contact"]
      },
      "feeding": {
        "summary": "Saturday feeding schedule for ${profile.childName}",
        "schedule": [
          {"time": "7:30 AM", "activity": "Morning meal", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "11:00 AM", "activity": "Late morning feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "2:00 PM", "activity": "Early afternoon", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "5:00 PM", "activity": "Late afternoon", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "8:00 PM", "activity": "Evening feed", "amount": "6-8 oz", "emoji": "🍼"}
        ],
        "tips": ["Burp after feeding", "Watch fullness cues", "Keep atmosphere calm"]
      },
      "activities": {
        "morning": ["🌤️ Natural light exposure", "🎶 Gentle music play", "💆 Baby massage time"],
        "afternoon": ["🧩 Different textures to touch", "👀 Face-to-face interaction", "🎨 High-contrast visuals"],
        "evening": ["🌅 Dimmed calm environment", "📱 Family photo time", "🛌 Early bedtime prep"]
      }
    },
    "day7": {
      "tasks": [
        {
          "taskId": "d7-morning-care",
          "name": "Sunday morning care routine",
          "category": "hygiene",
          "priority": "high",
          "completed": false,
          "emoji": "🧼"
        },
        {
          "taskId": "d7-feed",
          "name": "Regular feeding for ${profile.childName}",
          "category": "feeding",
          "priority": "high",
          "completed": false,
          "emoji": "🍼"
        },
        {
          "taskId": "d7-tummy-time",
          "name": "Tummy time practice",
          "category": "activity",
          "priority": "high",
          "completed": false,
          "emoji": "🤸"
        },
        {
          "taskId": "d7-bonding",
          "name": "Family bonding time with ${profile.childName}",
          "category": "social",
          "priority": "high",
          "completed": false,
          "emoji": "💕"
        },
        {
          "taskId": "d7-communication",
          "name": "Talk and communicate with ${profile.childName}",
          "category": "learning",
          "priority": "medium",
          "completed": false,
          "emoji": "💬"
        },
        {
          "taskId": "d7-sleep",
          "name": "Rest time for ${profile.childName}",
          "category": "sleep",
          "priority": "high",
          "completed": false,
          "emoji": "💤"
        }
      ],
      "milestones": {
        "physical": ["${profile.childName} pushes up during tummy time", "Better movement control"],
        "cognitive": ["Recognizes feeding time", "Shows anticipation for routines"],
        "social": ["More engagement with family", "Shows excitement with caregivers"],
        "language": ["Varied babbling sounds", "Responds to voice tone"],
        "tips": ["Review week's progress", "Plan next week's activities", "Keep routines consistent"]
      },
      "feeding": {
        "summary": "Sunday relaxed feeding schedule",
        "schedule": [
          {"time": "8:00 AM", "activity": "Leisurely morning feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "11:30 AM", "activity": "Mid-day feeding", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "2:30 PM", "activity": "Afternoon meal", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "5:30 PM", "activity": "Early evening feed", "amount": "6-8 oz", "emoji": "🍼"},
          {"time": "8:30 PM", "activity": "Bedtime feeding", "amount": "6-8 oz", "emoji": "🍼"}
        ],
        "tips": ["Reflect on week's feeding", "Note any patterns", "Prepare for new week"]
      },
      "activities": {
        "morning": ["🌈 Colorful toy play", "🎪 Fun activities with family", "🎤 Singing together"],
        "afternoon": ["🛝 Floor gym activities", "👋 Waving practice", "🔊 Sound exploration"],
        "evening": ["📖 Bedtime story routine", "🌜 Prepare for week ahead", "🤗 Extra cuddles and bonding"]
      }
    }
  }
}

IMPORTANT: Ensure all JSON is valid. No trailing commas. All arrays complete. Return ONLY the JSON object, nothing else.`;
}

/**
 * Parse AI response and structure it properly
 */
function parseWeeklyResponse(response: string, profile: ChildCareProfile): WeeklyAIContent {
  try {
    let cleaned = response.trim();
    cleaned = cleaned.replace(/```json\n?/g, '');
    cleaned = cleaned.replace(/\n?```/g, '');
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    
    if (!parsed.week) {
      throw new Error('Invalid AI response: missing week object');
    }

    const days: DailyAIContent[] = [];
    
    for (let i = 1; i <= 7; i++) {
      const dayKey = `day${i}`;
      const dayData = parsed.week[dayKey];
      
      if (!dayData) {
        console.warn(`⚠️ Missing data for ${dayKey}, using fallback`);
        days.push(createFallbackDay(i, profile));
        continue;
      }

      days.push({
        dayNumber: i,
        dayOfWeek: getDayOfWeek(i),
        tasks: dayData.tasks || [],
        milestones: dayData.milestones || {
          physical: [],
          cognitive: [],
          social: [],
          language: [],
          tips: [],
        },
        feeding: dayData.feeding || {
          summary: '',
          schedule: [],
          tips: [],
        },
        activities: dayData.activities || {
          morning: [],
          afternoon: [],
          evening: [],
        },
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const weeklyContent: WeeklyAIContent = {
      weekId: getWeekId(now),
      childId: profile.childId,
      childName: profile.childName,
      ageInMonths: profile.ageInMonths,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      days,
    };

    return weeklyContent;
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error);
    console.log('Response preview:', response.substring(0, 500));
    throw new Error('Failed to parse AI weekly content');
  }
}

/**
 * Create fallback content if AI fails
 */
function createFallbackDay(dayNumber: number, profile: ChildCareProfile): DailyAIContent {
  const tasks = getDailyTasksForAge(profile.ageInMonths);
  const milestone = getMilestoneForAge(profile.ageInMonths);
  const ageGroup = getAgeGroup(profile.ageInMonths);
  const feeding = FEEDING_GUIDELINES[ageGroup as keyof typeof FEEDING_GUIDELINES];

  return {
    dayNumber,
    dayOfWeek: getDayOfWeek(dayNumber),
    tasks: tasks.map((task, index) => ({
      ...task,
      taskId: `d${dayNumber}-fallback-${index}`,
    })),
    milestones: {
      physical: milestone.physical || [],
      cognitive: milestone.cognitive || [],
      social: milestone.social || [],
      language: [],
      tips: ['Consult your pediatrician for personalized advice'],
    },
    feeding: {
      summary: feeding?.primary || 'Regular feeding schedule',
      schedule: [],
      tips: [feeding?.notes || 'Monitor feeding patterns'],
    },
    activities: {
      morning: ['Morning playtime', 'Outdoor time if weather permits'],
      afternoon: ['Reading time', 'Nap routine'],
      evening: ['Bath time', 'Bedtime routine'],
    },
  };
}

/**
 * Get content for a specific day of the week
 */
export function getContentForDay(
  weeklyContent: WeeklyAIContent,
  date: Date = new Date()
): DailyAIContent | null {
  try {
    const dayOfWeek = ((date.getDay() + 6) % 7) + 1;
    
    const dayContent = weeklyContent.days.find(d => d.dayNumber === dayOfWeek);
    
    if (!dayContent) {
      console.warn(`⚠️ No content found for day ${dayOfWeek}`);
      return null;
    }

    return dayContent;
  } catch (error) {
    console.error('❌ Error getting day content:', error);
    return null;
  }
}

/**
 * Check if weekly content is still valid
 */
export function isContentValid(weeklyContent: WeeklyAIContent | null): boolean {
  if (!weeklyContent) return false;

  try {
    const now = new Date();
    const expiresAt = new Date(weeklyContent.expiresAt);
    const isExpired = now > expiresAt;

    if (isExpired) {
      console.log(`⏰ Content expired for ${weeklyContent.childName}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking content validity:', error);
    return false;
  }
}

/**
 * Create fallback weekly content using static data
 */
export function createFallbackWeeklyContent(profile: ChildCareProfile): WeeklyAIContent {
  console.log(`📦 Creating fallback weekly content for ${profile.childName}`);

  const days: DailyAIContent[] = [];
  
  for (let i = 1; i <= 7; i++) {
    days.push(createFallbackDay(i, profile));
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000);

  return {
    weekId: getWeekId(now),
    childId: profile.childId,
    childName: profile.childName,
    ageInMonths: profile.ageInMonths,
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    days,
  };
}
