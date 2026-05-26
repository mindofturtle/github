"""
AI Engine — uses Claude to generate a full-body performance overview,
daily action plan, and personalized recommendations from all logged data.
"""
import os
import json
from datetime import date, datetime
from typing import Optional
import anthropic

_client: Optional[anthropic.Anthropic] = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def build_user_context(data: dict) -> str:
    """Serialize all user data into a structured context block for Claude."""
    today = data.get("today", str(date.today()))
    user = data.get("user", {})
    sleep = data.get("sleep")
    recovery = data.get("recovery")
    heart = data.get("heart")
    nutrition = data.get("nutrition_summary")
    supplements = data.get("supplements", [])
    stimulants = data.get("stimulants", [])
    goals = data.get("goals", [])
    recent_workouts = data.get("recent_workouts", [])
    peak = data.get("peak_windows", {})
    streaks = data.get("streaks", {})

    lines = [
        f"DATE: {today}",
        "",
        "=== ATHLETE PROFILE ===",
        f"Name: {user.get('name', 'Athlete')}",
        f"Age: {user.get('age', 'unknown')} | Weight: {user.get('weight_kg', '?')} kg | Height: {user.get('height_cm', '?')} cm",
        f"Sex: {user.get('sex', 'not specified')} | Chronotype: {user.get('chronotype', 'intermediate')}",
        f"HRV Baseline: {user.get('hrv_baseline', 50)} ms | Resting HR Baseline: {user.get('resting_hr_baseline', 60)} bpm",
        "",
        "=== LAST NIGHT'S SLEEP ===",
    ]

    if sleep:
        lines += [
            f"Duration: {sleep.get('total_duration_hours', '?')} hours",
            f"Quality: {sleep.get('quality_score', '?')}/10",
            f"Deep sleep: {sleep.get('deep_sleep_hours', '?')} hrs | REM: {sleep.get('rem_sleep_hours', '?')} hrs",
            f"Morning HRV: {sleep.get('hrv_morning', '?')} ms",
            f"Awakenings: {sleep.get('awakenings', 0)}",
            f"Notes: {sleep.get('notes', 'none')}",
        ]
    else:
        lines.append("No sleep data logged for today.")

    lines += ["", "=== TODAY'S RECOVERY ==="]
    if recovery:
        lines += [
            f"Muscle Soreness: {recovery.get('muscle_soreness', '?')}/10",
            f"Energy Level: {recovery.get('energy_level', '?')}/10",
            f"Stress Level: {recovery.get('stress_level', '?')}/10",
            f"Mood: {recovery.get('mood_score', '?')}/10",
            f"Motivation: {recovery.get('motivation_score', '?')}/10",
            f"Cognitive Clarity: {recovery.get('cognitive_clarity', '?')}/10",
            f"Injuries: {recovery.get('injuries', 'none')}",
        ]
    else:
        lines.append("No recovery data logged for today.")

    lines += ["", "=== CARDIOVASCULAR DATA ==="]
    if heart:
        lines += [
            f"Resting HR: {heart.get('resting_hr', '?')} bpm | HRV: {heart.get('hrv', '?')} ms",
            f"SpO2: {heart.get('spo2', '?')}% | VO2 Max: {heart.get('vo2max', '?')}",
            f"BP: {heart.get('blood_pressure_systolic', '?')}/{heart.get('blood_pressure_diastolic', '?')} mmHg",
        ]
    else:
        lines.append("No heart data logged for today.")

    lines += ["", "=== TODAY'S NUTRITION ==="]
    if nutrition:
        lines += [
            f"Calories: {nutrition.get('total_calories', 0):.0f} kcal",
            f"Protein: {nutrition.get('total_protein', 0):.0f}g | Carbs: {nutrition.get('total_carbs', 0):.0f}g | Fat: {nutrition.get('total_fat', 0):.0f}g",
            f"Fiber: {nutrition.get('total_fiber', 0):.0f}g | Water: {nutrition.get('total_water_ml', 0):.0f} ml ({nutrition.get('total_water_ml', 0)/1000:.1f}L)",
        ]
    else:
        lines.append("No nutrition logged today.")

    lines += ["", "=== TODAY'S SUPPLEMENTS & STIMULANTS ==="]
    if supplements:
        for s in supplements:
            lines.append(f"  • {s.get('supplement_name')} {s.get('dosage', '')} {s.get('unit', '')} @ {_fmt_hour(s.get('taken_at_hour'))}")
    else:
        lines.append("No supplements logged.")

    if stimulants:
        for s in stimulants:
            lines.append(f"  • {s.get('stimulant_type')} {s.get('amount_mg', '')}mg @ {_fmt_hour(s.get('taken_at_hour'))}")
    else:
        lines.append("No stimulants logged.")

    lines += ["", "=== PEAK PERFORMANCE WINDOWS ==="]
    if peak:
        lines += [
            f"Overall Readiness: {peak.get('overall_readiness', '?')}/100 ({peak.get('readiness_label', '')})",
            f"Mental Peak Hour: {_fmt_hour(peak.get('mental_peak_hour'))} (score: {peak.get('mental_peak_score', '?'):.0f}/100)",
            f"Physical Peak Hour: {_fmt_hour(peak.get('physical_peak_hour'))} (score: {peak.get('physical_peak_score', '?'):.0f}/100)",
            f"Recommended Gym: {peak.get('gym_recommendation', '')}",
            f"Recommended Focus: {peak.get('focus_recommendation', '')}",
        ]
        factors = peak.get("factors", {})
        if factors:
            lines.append(f"Sleep Debt: {factors.get('sleep_debt_hours', 0)} hrs | HRV Modifier: {factors.get('hrv_modifier', 0):+.1f}")

    lines += ["", "=== ACTIVE GOALS ==="]
    if goals:
        for g in goals:
            progress = ""
            if g.get("target_value") and g.get("current_value") is not None:
                pct = (g["current_value"] / g["target_value"]) * 100
                progress = f" ({pct:.0f}% complete)"
            lines.append(f"  • [{g.get('category', '').upper()}] {g.get('name')} — {g.get('current_value', '?')}/{g.get('target_value', '?')} {g.get('unit', '')}{progress}")
    else:
        lines.append("No active goals set.")

    lines += ["", "=== RECENT WORKOUTS (last 7 days) ==="]
    if recent_workouts:
        for w in recent_workouts:
            lines.append(
                f"  • {w.get('date')} | {w.get('session_type').upper()} | "
                f"{w.get('duration_minutes', '?')} min | RPE {w.get('perceived_exertion', '?')}/10 | "
                f"Volume: {w.get('volume_total', 0):.0f} kg"
            )
    else:
        lines.append("No recent workouts.")

    lines += ["", "=== STREAKS ==="]
    for k, v in (streaks or {}).items():
        lines.append(f"  {k}: {v} days")

    return "\n".join(lines)


def _fmt_hour(h) -> str:
    if h is None:
        return "?"
    h = int(h)
    if h == 0:
        return "12 AM"
    if h < 12:
        return f"{h} AM"
    if h == 12:
        return "12 PM"
    return f"{h-12} PM"


SYSTEM_PROMPT = """You are an elite sports scientist, performance coach, and health optimization expert.
You analyze an athlete's comprehensive biometric, nutrition, training, and recovery data and provide
razor-sharp, actionable insights. You think like a blend of Dr. Andrew Huberman, Dr. Peter Attia,
and a top-tier strength & conditioning coach.

Your analysis is:
- Specific and data-driven (reference actual numbers from their data)
- Actionable (tell them exactly what to do, not vague suggestions)
- Prioritized (most impactful advice first)
- Honest (flag red flags and issues clearly)
- Performance-focused (optimize for peak mental AND physical output)

Always respond in valid JSON matching the exact schema requested."""


def generate_full_analysis(context: str) -> dict:
    client = _get_client()

    prompt = f"""Analyze the following athlete data and generate a comprehensive performance overview.

{context}

Respond with ONLY a JSON object matching this exact schema:
{{
  "body_state_summary": "2-3 sentences describing the athlete's overall state today — energy systems, nervous system, hormonal, and cognitive status based on the data",
  "peak_window_explanation": "2 sentences explaining WHY their mental and physical peaks are at those times based on their specific data (sleep, HRV, stimulants, etc.)",
  "todays_recommendations": [
    "Specific actionable item 1 (be very specific with times and actions)",
    "Specific actionable item 2",
    "Specific actionable item 3",
    "Specific actionable item 4",
    "Specific actionable item 5"
  ],
  "workout_advice": "Specific workout recommendation for today — type, intensity, timing, and any exercise adjustments based on their recovery state",
  "nutrition_advice": "Specific nutrition guidance for today — what macros to hit, timing around workouts, any deficiencies to address",
  "recovery_advice": "Recovery protocol for today based on soreness, HRV, and training load",
  "mental_performance_tips": [
    "Specific tip 1 for maximizing cognitive output today",
    "Specific tip 2",
    "Specific tip 3"
  ],
  "alerts": [
    "Any red flags or warnings based on the data (overtraining, poor sleep debt, low HRV trend, etc.) — leave empty array if none"
  ]
}}

Be extremely specific. Reference their actual data points. No generic advice."""

    message = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)


def generate_workout_plan(context: str, goals: list) -> dict:
    client = _get_client()
    goals_text = "\n".join(f"- {g}" for g in goals) if goals else "No specific goals set"

    prompt = f"""Based on this athlete data, generate a detailed workout recommendation.

{context}

ACTIVE GOALS:
{goals_text}

Respond with ONLY a JSON object:
{{
  "should_train_today": true/false,
  "recommended_session_type": "push/pull/legs/upper/lower/full/cardio/active_recovery/rest",
  "intensity_recommendation": 1-10,
  "duration_recommendation_minutes": number,
  "timing_recommendation": "specific time like '4:00 PM'",
  "key_exercises": ["Exercise 1 with sets/reps", "Exercise 2", "Exercise 3"],
  "progressive_overload_notes": "Any notes on progression — PRs to attempt, weights to increase",
  "warm_up_protocol": "Specific warm-up",
  "cool_down_protocol": "Specific cool-down",
  "reasoning": "Why this recommendation based on their data"
}}"""

    message = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
