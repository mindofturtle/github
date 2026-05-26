"""
Peak Window Calculator
Computes hourly mental and physical performance scores (0-100) using:
- Circadian rhythm model (process-S + process-C two-process model)
- Sleep quality/debt adjustments
- HRV-based readiness
- Stimulant pharmacokinetics
- Recovery metrics
- Chronotype offsets
"""
from datetime import date
from typing import List, Optional
import math
from schemas import HourlyScore, PeakWindowResult


CHRONOTYPE_OFFSET = {
    "morning": -1.5,
    "intermediate": 0.0,
    "evening": 1.5,
}


def _circadian_mental(hours_awake: float) -> float:
    """Two-peak mental alertness curve based on circadian research."""
    if hours_awake < 0:
        return 10.0
    if hours_awake < 0.5:
        return 20.0
    if hours_awake < 2:
        return 20 + (hours_awake - 0.5) * 33  # Rising: grogginess clearing
    if hours_awake < 4.5:
        return 70 + (hours_awake - 2) * 8  # First peak rising
    if hours_awake < 6:
        return 90 - (hours_awake - 4.5) * 13  # Post-lunch dip approaching
    if hours_awake < 7.5:
        return 70 - (hours_awake - 6) * 3  # Dip
    if hours_awake < 10:
        return 66 + (hours_awake - 7.5) * 5  # Secondary afternoon peak
    if hours_awake < 12:
        return 78 - (hours_awake - 10) * 4   # Declining
    if hours_awake < 15:
        return 70 - (hours_awake - 12) * 7   # Significant decline
    return max(5.0, 49 - (hours_awake - 15) * 6)


def _circadian_physical(hours_awake: float) -> float:
    """Physical performance curve — typically peaks 6-12 hrs after wake."""
    if hours_awake < 0:
        return 15.0
    if hours_awake < 1:
        return 20.0
    if hours_awake < 3:
        return 20 + (hours_awake - 1) * 20   # Early warm-up
    if hours_awake < 6:
        return 60 + (hours_awake - 3) * 10   # Building toward peak
    if hours_awake < 10:
        return 90 + (hours_awake - 6) * 1    # Physical peak window
    if hours_awake < 13:
        return 94 - (hours_awake - 10) * 4   # Gradual decline
    if hours_awake < 16:
        return 82 - (hours_awake - 13) * 5   # Continued decline
    return max(10.0, 67 - (hours_awake - 16) * 7)


def _caffeine_boost(hour: float, stims: list) -> float:
    """Model caffeine/stimulant effect as time-based bell curve."""
    total_boost = 0.0
    for stim in stims:
        taken_at = stim.get("taken_at_hour", 7.0)
        amount_mg = stim.get("amount_mg", 100.0) or 100.0
        half_life = stim.get("half_life_hours", 5.0)

        # Time since intake (handle next-day wrap)
        delta = hour - taken_at
        if delta < 0:
            continue  # Not yet taken

        # Absorption: peaks ~45-90min after intake
        absorption_peak = 1.0
        if delta < absorption_peak:
            rise = (delta / absorption_peak) ** 0.7
        else:
            rise = 1.0

        # Elimination via half-life
        decay = math.exp(-0.693 * (delta - absorption_peak) / half_life) if delta >= absorption_peak else 1.0
        concentration = rise * decay

        # Scale by dose (200mg = standard dose)
        dose_factor = min(1.8, amount_mg / 200.0)
        boost = concentration * dose_factor * 18  # max ~18 point boost at 200mg
        total_boost += max(0.0, boost)

    return min(25.0, total_boost)  # cap total stimulant boost


def _sleep_debt_factor(duration: Optional[float], quality: Optional[int]) -> tuple:
    """Returns (mental_mod, physical_mod, debt_hours)."""
    target_duration = 7.5
    target_quality = 7

    actual_duration = duration or target_duration
    actual_quality = quality or target_quality

    debt = max(0.0, target_duration - actual_duration)
    duration_mod = (actual_duration - target_duration) * 5  # ±5pts per hour
    quality_mod = (actual_quality - target_quality) * 3     # ±3pts per quality point

    combined_mod = duration_mod + quality_mod
    return (
        max(-40.0, min(15.0, combined_mod)),
        max(-30.0, min(10.0, combined_mod * 0.8)),
        debt,
    )


def _hrv_readiness(hrv: Optional[float], baseline: float) -> float:
    """HRV deviation from baseline → performance modifier."""
    if not hrv or baseline == 0:
        return 0.0
    deviation_pct = (hrv - baseline) / baseline
    return max(-20.0, min(20.0, deviation_pct * 30))


def _recovery_modifier(recovery_data: Optional[dict]) -> float:
    if not recovery_data:
        return 0.0
    soreness = recovery_data.get("muscle_soreness", 5) or 5
    energy = recovery_data.get("energy_level", 5) or 5
    stress = recovery_data.get("stress_level", 5) or 5
    mood = recovery_data.get("mood_score", 5) or 5
    # Combine: high soreness/stress = bad, high energy/mood = good
    score = ((10 - soreness) + energy + (10 - stress) + mood - 20) * 2.5
    return max(-20.0, min(20.0, score))


def calculate_readiness_score(
    sleep_duration: Optional[float],
    sleep_quality: Optional[int],
    hrv: Optional[float],
    hrv_baseline: float,
    recovery: Optional[dict],
) -> tuple:
    """Returns (readiness_0_to_100, label)."""
    base = 70.0

    duration_score = min(15.0, ((sleep_duration or 7.0) - 7.5) * 10)
    quality_score = ((sleep_quality or 6) - 5) * 4
    hrv_score = _hrv_readiness(hrv, hrv_baseline)
    rec_score = _recovery_modifier(recovery)

    raw = base + duration_score + quality_score + hrv_score + rec_score
    clamped = max(0.0, min(100.0, raw))

    if clamped >= 85:
        label = "Peak"
    elif clamped >= 70:
        label = "High"
    elif clamped >= 55:
        label = "Moderate"
    elif clamped >= 40:
        label = "Low"
    else:
        label = "Recovery Day"

    return round(clamped, 1), label


def calculate_peak_windows(
    log_date: date,
    wake_hour: Optional[float],
    sleep_duration: Optional[float],
    sleep_quality: Optional[int],
    hrv_morning: Optional[float],
    hrv_baseline: float,
    chronotype: str,
    stimulants: list,
    recovery: Optional[dict],
) -> PeakWindowResult:

    wake = wake_hour or 7.0
    chron_offset = CHRONOTYPE_OFFSET.get(chronotype, 0.0)
    adjusted_wake = wake + chron_offset

    mental_mod, physical_mod, sleep_debt = _sleep_debt_factor(sleep_duration, sleep_quality)
    hrv_mod = _hrv_readiness(hrv_morning, hrv_baseline)
    rec_mod = _recovery_modifier(recovery)

    overall_readiness, readiness_label = calculate_readiness_score(
        sleep_duration, sleep_quality, hrv_morning, hrv_baseline, recovery
    )

    hourly_scores: List[HourlyScore] = []
    for hour in range(24):
        hours_awake = hour - adjusted_wake
        # After-midnight adjustment
        if hours_awake < -2:
            hours_awake += 24

        caff_boost = _caffeine_boost(float(hour), stimulants)

        raw_mental = _circadian_mental(hours_awake)
        raw_physical = _circadian_physical(hours_awake)

        mental = max(0.0, min(100.0, raw_mental + mental_mod + hrv_mod * 0.5 + caff_boost))
        physical = max(0.0, min(100.0, raw_physical + physical_mod + hrv_mod + rec_mod))

        # Sleeping hours: performance close to 0
        if hours_awake < 0 or hours_awake > 17:
            mental = max(0.0, mental * 0.15)
            physical = max(0.0, physical * 0.10)

        combined = mental * 0.45 + physical * 0.55

        if combined >= 80:
            label = "Peak"
        elif combined >= 65:
            label = "High"
        elif combined >= 45:
            label = "Moderate"
        elif hours_awake < 0 or hours_awake > 17:
            label = "Sleep"
        else:
            label = "Low"

        hourly_scores.append(HourlyScore(
            hour=hour,
            mental=round(mental, 1),
            physical=round(physical, 1),
            combined=round(combined, 1),
            label=label,
        ))

    # Find peaks (only during waking hours)
    waking = [s for s in hourly_scores if 0 <= s.hour - adjusted_wake <= 17]
    if not waking:
        waking = hourly_scores

    mental_peak = max(waking, key=lambda s: s.mental)
    physical_peak = max(waking, key=lambda s: s.physical)

    def _fmt_hour(h: int) -> str:
        if h == 0:
            return "12:00 AM"
        if h < 12:
            return f"{h}:00 AM"
        if h == 12:
            return "12:00 PM"
        return f"{h-12}:00 PM"

    gym_hour = physical_peak.hour
    focus_hour = mental_peak.hour

    gym_rec = (
        f"Optimal gym window: {_fmt_hour(gym_hour)} — "
        f"physical performance score {physical_peak.physical:.0f}/100. "
        f"{'Great day to push hard!' if overall_readiness >= 70 else 'Consider a lighter session today.'}"
    )
    focus_rec = (
        f"Peak focus window: {_fmt_hour(focus_hour)} — "
        f"mental performance score {mental_peak.mental:.0f}/100. "
        f"Block this time for your most demanding cognitive work."
    )

    # Stimulant timing window
    stim_window = None
    if stimulants:
        stim_window = (
            f"Stimulant effects peak ~90 min after intake. "
            f"Time caffeine ~90 min before {_fmt_hour(focus_hour)} for maximum cognitive boost."
        )

    factors = {
        "sleep_quality": sleep_quality,
        "sleep_duration": sleep_duration,
        "sleep_debt_hours": round(sleep_debt, 1),
        "hrv_morning": hrv_morning,
        "hrv_baseline": hrv_baseline,
        "hrv_modifier": round(hrv_mod, 1),
        "sleep_modifier": round(mental_mod, 1),
        "recovery_modifier": round(rec_mod, 1),
        "stimulant_count": len(stimulants),
    }

    return PeakWindowResult(
        date=log_date,
        hourly_scores=hourly_scores,
        mental_peak_hour=mental_peak.hour,
        physical_peak_hour=physical_peak.hour,
        mental_peak_score=mental_peak.mental,
        physical_peak_score=physical_peak.physical,
        overall_readiness=overall_readiness,
        readiness_label=readiness_label,
        recommended_gym_hour=gym_hour,
        recommended_focus_hour=focus_hour,
        gym_recommendation=gym_rec,
        focus_recommendation=focus_rec,
        stimulant_window=stim_window,
        sleep_debt_hours=round(sleep_debt, 1),
        factors=factors,
    )
