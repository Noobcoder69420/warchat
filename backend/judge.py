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

# ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are the AI judge of KEYBOARD WARRIOR — a competitive trash talk battle game.
Players may write in ANY language. Automatically detect the language and judge using that language's trash talk culture.

Score the message on 3 axes (1–10 each):

AURA (1–10): Confidence and delivery — how boldly it was sold.
DAMAGE (1–10): How much the insult stings — personal, cultural, cutting.
CREATIVITY (1–10): Originality, wordplay, structure, cultural references.

════════════════════════════════════════════
CULTURAL SCORING GUIDE — apply based on detected language:
════════════════════════════════════════════

HINDI / URDU:
- Caste, status and class-based insults hit HARDEST ("teri aukat nahi", "gutter se aaya hai", "besharam", "neech")
- Family insults with specificity score very high damage ("tere baap ne", "teri maa ki")
- Street slang like "bhosdike", "madarchod", "bhenchodh", "randi ka baccha" = MAX damage when used in context with a real insult
- Calling someone uneducated, low-class, or worthless ("anpadh", "gawaar", "aukat se bahar") = high aura hit
- A single slur alone scores low — it MUST have context, a setup, or a creative elaboration to score high
- Elaborate multi-part Hindi burns score very high creativity

SPANISH (all regional variants):
- "Tu madre" constructions automatically score higher damage than English "your mom" equivalent
- Regional nuclear slang in context: "mamaguevo", "maricón", "pendejo", "cabrón", "culero", "huevón" = high damage
- "Ni siquiera" (not even) structure = high creativity bonus
- Elaborate condescending burns ("¿en serio crees que...") score high aura
- Cuban, Mexican, Colombian slang all valid — judge by impact not formality

PORTUGUESE (Brazilian):
- "Sua mãe" tier = automatic damage boost
- BR slang in context: "viado", "otário", "cuzão", "fdp", "filho da puta" = high damage when elaborated
- Creative BR internet slang ("kkkk você é um lixo") scores high
- Elaborate roasts with regional flavor score very high creativity

ARABIC:
- Honor, family, and intelligence-based burns score HIGHEST ("ibn el sharmouta", "hayawan", "kalb")
- Formal eloquent insults score very high aura — Arabic values rhetorical delivery
- Ancestry insults ("asl mafqood", "ibn haram") = max damage
- Short single-word insults score low without elaboration

FRENCH:
- Wit and condescension score HIGHER than raw aggression
- "Pauvre type", "t'es vraiment con", "espèce d'idiot" with elaboration = high scores
- Elaborate formal-sounding insults score very high aura
- Pure aggression without wit scores lower than in other languages

ENGLISH:
- Already calibrated — see rules below
════════════════════════════════════════════

HARD RULES — apply to ALL languages:
1. Single slurs or buzzwords alone (in any language) = max total 6, no exceptions
2. Gibberish / keyboard spam = all 1s, verdict "SPAM DETECTED"  
3. Same word repeated = all 1s, verdict "SPAM DETECTED"
4. Messages over 20 words get +1 aura AND +1 creativity for effort
5. Metaphors, similes, creative comparisons = +2 creativity if well used
6. A slur WITH a creative elaboration = scores normally (slur alone = capped at 6)

SCORING REFERENCE:
- "L" or "ratio" alone → total 3
- "madarchod" alone → total 5 (single slur, no context)  
- "madarchod hai tu, teri aukat nahi mere saath baat karne ki" → total 20+ (slur + status burn + elaboration)
- "tu madre ni siquiera sabe tu nombre" → total 22+
- "you look like you eat cereal with water" → total 19
- "no wonder your dad left, even he couldn't stand watching you fail" → total 24+

Respond ONLY with valid JSON. No preamble, no markdown.
Format: {"aura":N,"damage":N,"creativity":N,"total":N,"verdict":"4-6 word hype callout in caps"}
total MUST equal aura + damage + creativity exactly."""

# ─── VERDICTS ─────────────────────────────────────────────────────────────────

VERDICTS = {
    'legendary': [
        'ABSOLUTE DESTRUCTION ACHIEVED', 'FATALITY — FLAWLESS VICTORY',
        'CRITICAL HIT — OPPONENT DELETED', 'KEYBOARD WARRIOR UNLOCKED',
        'LEGENDARY STATUS CONFIRMED', 'CROWD GOES ABSOLUTELY INSANE',
        'THE INTERNET BOWS DOWN', 'GENERATIONAL TALENT CONFIRMED',
        'THIS IS NOT A DRILL', 'HISTORIC DAMAGE LOGGED'
    ],
    'elite': [
        'SOLID BURN — FELT THAT', 'HIGH DAMAGE OUTPUT DETECTED',
        'OPPONENT ON LIFE SUPPORT', 'THAT ONE LEFT A MARK',
        'AURA LEVELS CRITICAL', 'DEVASTATING COMBO LANDED',
        'CERTIFIED DAMAGE DEALT', 'CROWD ERUPTS',
        'RATIO CONFIRMED', 'OPPONENT STAGGERED'
    ],
    'mid': [
        'DECENT SHOT — KEEP PUSHING', 'GLANCING HIT REGISTERED',
        'CROWD MUMBLES APPROVINGLY', 'NOT BAD — NOT GREAT',
        'POINTS ON THE BOARD', 'WARMING UP DETECTED',
        'SERVICEABLE ATTEMPT', 'KEEP GOING WARRIOR'
    ],
    'weak': [
        'WEAK SAUCE DETECTED', 'IS THAT ALL YOU GOT',
        'MY GRANDMOTHER TYPES HARDER', 'EMBARRASSING ATTEMPT LOGGED',
        'THE CROWD FELL ASLEEP', 'CRITICAL MISS — TRY AGAIN',
        'KEYBOARD WARRIOR FAILED', 'ZERO DAMAGE OUTPUT',
        'EVEN THE AI IS BORED', 'TRY HARDER NEXT TIME'
    ],
    'spam': [
        'SPAM DETECTED — NO POINTS', 'COPY PASTE LOSER',
        'TRY USING ACTUAL WORDS', 'LAZY TACTICS PENALIZED',
        'THE AI IS NOT IMPRESSED', 'GIBBERISH REJECTED',
        'SPAM FILTER ACTIVATED'
    ]
}

# ─── DETECTION HELPERS ────────────────────────────────────────────────────────

LONE_BUZZWORDS = {
    'clapped', 'rekt', 'ratio', 'mid', 'cope', 'seethe', 'mald',
    'l', 'w', 'lol', 'lmao', 'gg', 'ez', 'gg ez', 'rip', 'bozo',
    'npc', 'cringe', 'based', 'ok', 'k', 'cooked', 'washed',
    'diffed', 'bodied', 'clown', 'bro', 'skill issue', 'ratio',
    'cope', 'loser', 'noob', 'bot', 'trash', 'bad', 'dumb'
}

def is_gibberish(text):
    # Non-Latin scripts (Hindi, Arabic, Chinese, etc.) use different phonology
    # — the English vowel/consonant ratio check is meaningless for them.
    # Only check pure repetition for those scripts.
    non_latin = sum(1 for c in text if ord(c) > 0x024F and c.isalpha())
    if non_latin > len([c for c in text if c.isalpha()]) * 0.3:
        return is_pure_spam(text)

    # English / Latin script gibberish detection
    words = text.strip().split()
    if not words: return True
    gibberish_count = 0
    for word in words:
        clean = re.sub(r'[^a-zA-Z]', '', word.lower())
        if len(clean) < 2: continue
        if len(set(clean)) == 1 and len(clean) >= 3:
            gibberish_count += 1; continue
        vowels = sum(1 for c in clean if c in 'aeiou')
        if len(clean) >= 4 and vowels == 0:
            gibberish_count += 1; continue
        if len(clean) >= 5 and (1 - vowels / len(clean)) > 0.85:
            gibberish_count += 1
    return gibberish_count >= max(1, len(words) * 0.6)

def is_pure_spam(text):
    words = text.lower().split()
    if len(words) < 2: return False
    if len(set(words)) == 1 and len(words) >= 2: return True
    most_common = max(set(words), key=words.count)
    return words.count(most_common) / len(words) >= 0.7 and len(words) >= 3

def is_single_char(text):
    return len(text.strip()) <= 1

def is_lone_buzzword(text):
    stripped = text.strip().lower().rstrip('.')
    words = stripped.split()
    # Single word in ANY language = buzzword tier (slur without context)
    if len(words) == 1:
        return True
    # Two known English buzzwords
    if len(words) == 2:
        return all(w in LONE_BUZZWORDS for w in words)
    return False

def spam_score():
    return {'aura': 1, 'damage': 1, 'creativity': 1, 'total': 3,
            'verdict': random.choice(VERDICTS['spam'])}

def buzzword_score():
    return {'aura': random.randint(1, 2), 'damage': random.randint(1, 3), 'creativity': 1,
            'total': random.randint(3, 6), 'verdict': random.choice(VERDICTS['weak'])}

# ─── HEURISTIC FALLBACK ───────────────────────────────────────────────────────

POWER_PHRASES = [
    'your whole existence', 'generational failure', 'statistically irrelevant',
    'mother should have', 'peak of your bloodline', 'living proof that',
    'empirically awful', 'cognitively challenged', 'evolutionary mistake',
    'no wonder your', 'imagine actually being', 'the fact that you',
    'scientifically proven', 'negative iq'
]
SOLID_BURNS = [
    'you look like', 'you sound like', 'you smell like', 'you act like',
    'even your', 'no wonder', 'delete yourself', 'get good',
    'touch grass', 'chronically online', 'rent free', 'not even close',
    'down bad', 'irrelevant', 'you are the', 'you were the',
    'reminds me of', 'compared to you'
]
STRUCTURE_PATTERNS = [
    r'\byour\s+\w+\s+is\b', r'\byou\s+(look|sound|smell|act|remind)\b',
    r'\beven\s+your\b', r'\bno\s+wonder\b', r'\bimagine\s+being\b',
    r'\bthe\s+fact\s+that\b', r'\bwhen\s+you\b', r'\bat\s+least\s+',
    r'\bnot\s+even\s+', r'\blet\s+(me|us)\s+be\s+honest\b',
]
AURA_OPENERS = [
    "let's be honest", "let me be clear", "not gonna lie", "the fact is",
    "listen", "hear me out", "i'm sorry but", "respectfully",
    "with all due respect", "scientifically speaking"
]

def heuristic_judge(text):
    lower = text.lower()
    words = lower.split()
    word_count = len(words)
    unique_words = len(set(words))

    # DAMAGE
    damage = 2
    for p in SOLID_BURNS:
        if p in lower: damage += 2; break
    for p in POWER_PHRASES:
        if p in lower: damage += 4; break
    if word_count >= 10: damage += 1
    if word_count >= 20: damage += 1
    damage = min(damage, 10)

    # AURA — properly rewards confident delivery
    aura = 3
    caps_words = sum(1 for w in text.split() if w.isupper() and len(w) > 2)
    if caps_words >= 5: aura += 3
    elif caps_words >= 3: aura += 2
    elif caps_words >= 1: aura += 1
    if text.count('!') >= 2: aura += 1
    if text.strip().endswith('?') and damage >= 5: aura += 1
    if word_count >= 20: aura += 2  # long effort deserves aura
    elif word_count >= 12: aura += 1
    for opener in AURA_OPENERS:
        if lower.startswith(opener): aura += 2; break
    aura = min(aura, 10)

    # CREATIVITY
    creativity = 2
    vocab_ratio = unique_words / max(word_count, 1)
    if vocab_ratio > 0.85 and word_count > 8: creativity += 3
    elif vocab_ratio > 0.7 and word_count > 5: creativity += 2
    elif vocab_ratio > 0.5 and word_count > 3: creativity += 1
    if word_count >= 20: creativity += 2  # long effort bonus
    elif word_count >= 12: creativity += 1
    for pattern in STRUCTURE_PATTERNS:
        if re.search(pattern, lower): creativity += 2; break
    if ' like ' in lower or ' as if ' in lower or ' reminds me' in lower: creativity += 2
    creativity = max(1, min(creativity, 10))

    total = aura + damage + creativity

    if total >= 24: verdict = random.choice(VERDICTS['legendary'])
    elif total >= 17: verdict = random.choice(VERDICTS['elite'])
    elif total >= 11: verdict = random.choice(VERDICTS['mid'])
    else: verdict = random.choice(VERDICTS['weak'])

    return {'aura': aura, 'damage': damage, 'creativity': creativity, 'total': total, 'verdict': verdict}

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
            temperature=0.4,
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r'```json|```', '', raw).strip()
        scores = json.loads(raw)

        aura = max(1, min(int(scores.get('aura', 3)), 10))
        damage = max(1, min(int(scores.get('damage', 3)), 10))
        creativity = max(1, min(int(scores.get('creativity', 3)), 10))
        total = aura + damage + creativity
        verdict = str(scores.get('verdict', 'SHOT FIRED')).upper()[:40]
        return {'aura': aura, 'damage': damage, 'creativity': creativity, 'total': total, 'verdict': verdict}

    except Exception as e:
        print(f'[GROQ ERROR] {e}')
        return heuristic_judge(text)

# ─── PUBLIC INTERFACE ─────────────────────────────────────────────────────────

def judge_message(text):
    text = text.strip()
    if not text or is_single_char(text): return spam_score()
    if is_pure_spam(text): print(f'[SPAM] {text[:30]}'); return spam_score()
    if is_gibberish(text): print(f'[GIBBERISH] {text[:30]}'); return spam_score()
    if is_lone_buzzword(text): print(f'[BUZZWORD] {text[:30]}'); return buzzword_score()
    if GROQ_AVAILABLE and groq_client: return judge_with_groq(text)
    return heuristic_judge(text)
