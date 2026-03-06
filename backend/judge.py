import os
import json
import random
import re

try:
    from groq import Groq
    groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY', ''))
    GROQ_AVAILABLE = bool(os.environ.get('GROQ_API_KEY'))
except Exception:
    groq_client = None
    GROQ_AVAILABLE = False

SYSTEM_PROMPT = """You are the AI judge of KEYBOARD WARRIOR — a trash talk battle game. 
Score the given trash talk message on 3 parameters, each from 1–10.
Respond ONLY with valid JSON. No preamble, no markdown, no explanation.
Format: {"aura":N,"damage":N,"creativity":N,"total":N,"verdict":"4-6 word hype callout in caps"}
- aura: confidence and delivery style
- damage: sting and impact of the insult
- creativity: originality, wordplay, references
- total: sum of all three (max 30)
- verdict: a short punchy callout like "FATAL BLOW LANDED" or "WEAK SAUCE DETECTED"
Be harsh but fair. Reward clever wordplay and cultural references heavily."""

VERDICTS_BY_tier = {
    'legendary': [
        'ABSOLUTE DESTRUCTION ACHIEVED', 'FATALITY — FLAWLESS VICTORY',
        'CRITICAL HIT — OPPONENT DELETED', 'KEYBOARD WARRIOR UNLOCKED',
        'LEGENDARY STATUS CONFIRMED', 'CROWD GOES ABSOLUTELY INSANE',
        'THIS IS NOT A DRILL — FATAL', 'THE INTERNET BOWS DOWN'
    ],
    'elite': [
        'SOLID BURN — FELT THAT', 'HIGH DAMAGE OUTPUT DETECTED',
        'OPPONENT ON LIFE SUPPORT', 'THAT ONE LEFT A MARK',
        'CERTIFIED CLAPPER MOVE', 'AURA LEVELS CRITICAL',
        'RATIO INCOMING', 'DEVASTATING COMBO LANDED'
    ],
    'mid': [
        'DECENT SHOT — KEEP PUSHING', 'GLANCING HIT REGISTERED',
        'MEDIUM DAMAGE DEALT', 'CROWD MUMBLES APPROVINGLY',
        'NOT BAD — NOT GREAT', 'SERVICEABLE INSULT LOGGED',
        'POINTS ON THE BOARD', 'KEEPING IT IN THE GAME'
    ],
    'weak': [
        'WEAK SAUCE DETECTED', 'IS THAT ALL YOU GOT',
        'MY GRANDMOTHER TYPES HARDER', 'EMBARRASSING ATTEMPT LOGGED',
        'THE CROWD FELL ASLEEP', 'CRITICAL MISS — TRY AGAIN',
        'KEYBOARD WARRIOR FAILED', 'ZERO DAMAGE OUTPUT'
    ]
}

# ─── HEURISTIC FALLBACK ───────────────────────────────────────────────────────

TIER_1_PHRASES = [
    'you lose', 'go home', 'get rekt', 'gg ez', 'trash', 'noob', 'bot',
    'suck', 'bad', 'loser', 'kid', 'nerd', 'dumb', 'idiot', 'stupid'
]

TIER_2_PHRASES = [
    'ratio', 'clapped', 'destroyed', 'cringe', 'skill issue', 'npc',
    'boomer', 'mid', 'cope', 'seethe', 'mald', 'get good', 'delete yourself',
    'irrelevant', 'washed', 'cooked', 'down bad', 'no cap', 'based',
    'touch grass', 'chronically online', 'rent free', 'main character',
    'not even close', 'diffed', 'smurfed', 'bodied'
]

TIER_3_PHRASES = [
    'your whole existence', 'generational failure', 'statistically irrelevant',
    'the algorithm rejected', 'negative iq', 'cognitively challenged',
    'evolutionary mistake', 'wifi password protected', 'legally braindead',
    'mother should have', 'dad left for', 'peak of your bloodline',
    'the universe autocorrected', 'living proof that', 'empirically awful'
]

COMEBACK_PHRASES = [
    'that all you got', 'is that your best', 'try again',
    'nice try', 'keep going', 'not impressed', 'more like',
    'actually though', 'speaking of', 'at least'
]

STRUCTURE_PATTERNS = [
    r'\byour\s+\w+\s+is\b',
    r'\byou\s+(look|sound|smell|act)\b',
    r'\beven\s+your\b',
    r'\bwhen\s+you\b',
    r'\bthe\s+fact\s+that\b',
    r'\bno\s+wonder\b',
    r'\bimagine\s+being\b',
    r'\bactually\s+think\b',
]


def heuristic_judge(text):
    lower = text.lower()
    words = lower.split()
    word_count = len(words)
    unique_words = len(set(words))

    # ── DAMAGE ────────────────────────────────────────────────────────────────
    damage = 2
    for p in TIER_1_PHRASES:
        if p in lower:
            damage += 1
    for p in TIER_2_PHRASES:
        if p in lower:
            damage += 2
    for p in TIER_3_PHRASES:
        if p in lower:
            damage += 3
    damage = min(damage, 10)

    # ── AURA ──────────────────────────────────────────────────────────────────
    aura = 3
    caps_words = sum(1 for w in text.split() if w.isupper() and len(w) > 2)
    if caps_words >= 3:
        aura += 2
    elif caps_words >= 1:
        aura += 1
    if text.count('!') >= 2:
        aura += 1
    if text.endswith('?') and damage >= 5:
        aura += 1  # rhetorical question = confident
    if word_count <= 6 and damage >= 6:
        aura += 2  # short & deadly
    if word_count >= 20:
        aura += 1  # elaborate rant
    for p in COMEBACK_PHRASES:
        if p in lower:
            aura += 1
            break
    aura = min(aura, 10)

    # ── CREATIVITY ────────────────────────────────────────────────────────────
    creativity = 2
    vocab_ratio = unique_words / max(word_count, 1)
    if vocab_ratio > 0.85 and word_count > 5:
        creativity += 2
    if word_count > 12:
        creativity += 1
    for pattern in STRUCTURE_PATTERNS:
        if re.search(pattern, lower):
            creativity += 2
            break
    # metaphor/simile bonus
    if ' like ' in lower or ' as ' in lower:
        creativity += 1
    # emoji penalty (lazy)
    emoji_count = sum(1 for c in text if ord(c) > 0x1F300)
    if emoji_count > 2:
        creativity -= 1
    creativity = max(1, min(creativity, 10))

    total = aura + damage + creativity

    # ── VERDICT ───────────────────────────────────────────────────────────────
    if total >= 25:
        verdict = random.choice(VERDICTS_BY_tier['legendary'])
    elif total >= 18:
        verdict = random.choice(VERDICTS_BY_tier['elite'])
    elif total >= 11:
        verdict = random.choice(VERDICTS_BY_tier['mid'])
    else:
        verdict = random.choice(VERDICTS_BY_tier['weak'])

    return {
        'aura': aura,
        'damage': damage,
        'creativity': creativity,
        'total': total,
        'verdict': verdict
    }


# ─── GROQ JUDGE ───────────────────────────────────────────────────────────────

def judge_with_groq(text):
    try:
        response = groq_client.chat.completions.create(
            model='llama3-8b-8192',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': f'Rate this trash talk: "{text}"'}
            ],
            max_tokens=120,
            temperature=0.7,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace('```json', '').replace('```', '').strip()
        scores = json.loads(raw)

        # Validate and clamp
        scores['aura'] = max(1, min(int(scores.get('aura', 5)), 10))
        scores['damage'] = max(1, min(int(scores.get('damage', 5)), 10))
        scores['creativity'] = max(1, min(int(scores.get('creativity', 5)), 10))
        scores['total'] = scores['aura'] + scores['damage'] + scores['creativity']
        scores['verdict'] = str(scores.get('verdict', 'SHOT FIRED')).upper()[:40]
        return scores

    except Exception as e:
        print(f'[GROQ ERROR] {e} — falling back to heuristic')
        return heuristic_judge(text)


# ─── PUBLIC INTERFACE ─────────────────────────────────────────────────────────

def judge_message(text, room_id=None, role=None, room_manager=None):
    """
    Judge a message. Uses Groq if available, falls back to heuristic.
    room_id/role/room_manager are available for future context-aware scoring.
    """
    if GROQ_AVAILABLE and groq_client:
        return judge_with_groq(text)
    else:
        return heuristic_judge(text)
