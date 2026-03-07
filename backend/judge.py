import os
import json
import random
import re

groq_client = None
GROQ_AVAILABLE = False

_groq_key = os.environ.get('GROQ_API_KEY', '').strip()
print(f'[JUDGE] GROQ_API_KEY present: {bool(_groq_key)}, length: {len(_groq_key)}')

if _groq_key:
    try:
        from groq import Groq
        groq_client = Groq(api_key=_groq_key)
        GROQ_AVAILABLE = True
        print(f'[JUDGE] Groq client initialized successfully')
    except Exception as e:
        print(f'[JUDGE] Groq init failed: {e}')
        groq_client = None
        GROQ_AVAILABLE = False
else:
    print('[JUDGE] No GROQ_API_KEY — falling back to heuristic')

# ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are the judge of KEYBOARD WARRIOR — a competitive trash talk battle game.

CRITICAL RULE #1 — SELF-DEGRADING = ZERO POINTS:
If the sender is talking negatively about THEMSELVES (surrendering, self-insults, admitting loss),
that scores near zero. Examples that score 1-3 total:
- "I'm gay", "I'm losing", "I give up", "I suck", "you won", "I can't do this"
- "I'm bad at this", "you're better than me", "I admit defeat"
These help the OPPONENT not the sender. Score them 1-1-1 = total 3.

CRITICAL RULE #2 — MUST TARGET THE OPPONENT:
Real trash talk attacks the OTHER person. Score based on how hard it hits THEM.
"You look like..." "Your whole existence..." "No wonder you..." = high scores.

CRITICAL RULE #3 — SPAM = ZERO:
Single words, letters, repeated words, gibberish = total 3 max.
Rapid single-word spam = total 3.

Score on 3 axes (1–10 each):
- aura: confidence and swagger of delivery
- damage: how badly it would sting the OPPONENT
- creativity: originality, metaphors, wordplay, structure

CULTURAL SCORING (auto-detect language):
HINDI/URDU: "teri aukat nahi", status/class burns, "gutter se aaya" = max damage. Single slurs alone = capped at 6.
SPANISH: "tu madre" constructions score higher. Regional slang in context = high.
PORTUGUESE BR: "sua mãe" = damage boost. BR slang elaborated = high.
ARABIC: Honor/family/intelligence burns score highest. Eloquent delivery = high aura.
FRENCH: Wit + condescension > raw aggression. Elaborate formal insults = high aura.

SCORING SCALE (for reference):
- Self-degrading ("I'm losing") → {aura:1, damage:1, creativity:1, total:3}
- Single buzzword ("ratio") → {aura:2, damage:2, creativity:1, total:5}
- Generic ("you suck") → {aura:3, damage:3, creativity:2, total:8}
- Creative sim ("you look like you eat cereal with water") → {aura:5, damage:7, creativity:8, total:20}
- Elite burn ("no wonder your dad left, even he couldn't watch you fail") → {aura:8, damage:9, creativity:8, total:25}
- Legendary (long, layered, personal, creative) → total 26-28

Respond ONLY with valid JSON. No markdown, no preamble.
Format: {"aura":N,"damage":N,"creativity":N,"total":N,"verdict":"4-6 word hype callout in caps"}
total MUST equal aura+damage+creativity."""

# ─── VERDICTS ─────────────────────────────────────────────────────────────────

VERDICTS = {
    'legendary': ['ABSOLUTE DESTRUCTION ACHIEVED','FATALITY — FLAWLESS VICTORY','KEYBOARD WARRIOR UNLOCKED','LEGENDARY STATUS CONFIRMED','THE INTERNET BOWS DOWN','HISTORIC DAMAGE LOGGED'],
    'elite':     ['SOLID BURN — FELT THAT','OPPONENT ON LIFE SUPPORT','THAT ONE LEFT A MARK','DEVASTATING COMBO LANDED','AURA LEVELS CRITICAL','RATIO CONFIRMED'],
    'mid':       ['DECENT SHOT — KEEP PUSHING','GLANCING HIT REGISTERED','NOT BAD — NOT GREAT','POINTS ON THE BOARD','WARMING UP DETECTED','SERVICEABLE ATTEMPT'],
    'weak':      ['WEAK SAUCE DETECTED','IS THAT ALL YOU GOT','MY GRANDMOTHER TYPES HARDER','THE CROWD FELL ASLEEP','CRITICAL MISS — TRY AGAIN','ZERO DAMAGE OUTPUT'],
    'self':      ['SELF DESTRUCTION ACTIVATED','DID YOU JUST INSULT YOURSELF','OWN GOAL DETECTED','THAT HURT YOU MORE','FREE POINTS FOR OPPONENT','FRIENDLY FIRE — NO POINTS'],
    'spam':      ['SPAM DETECTED — NO POINTS','TRY USING ACTUAL WORDS','LAZY TACTICS PENALIZED','GIBBERISH REJECTED','SPAM FILTER ACTIVATED'],
}

def pick(tier): return random.choice(VERDICTS[tier])

# ─── SELF-DEGRADING DETECTION ─────────────────────────────────────────────────

SELF_PATTERNS = [
    # First person surrender / admission
    r"\bi('m| am)\s+(losing|lost|done|finished|gay|bad|trash|terrible|awful|stupid|dumb|weak|pathetic|worthless|useless)",
    r"\bi\s+(give up|quit|surrender|concede|admit|lost|suck|can'?t|cannot)",
    r"\bi\s+(can'?t|cannot)\s+(do|win|compete|fight|beat)",
    r"\byou('?re| are)\s+(better|winning|won|right|correct|amazing|great|good|the best)",
    r"\byou\s+win\b",
    r"\bi\s+lose\b",
    r"\bi\s+admit\b",
    r"\bi\s+was\s+wrong\b",
    r"\bsorry\b.{0,20}\bi\b",
    r"\bforgive me\b",
    r"\bi\s+deserve\b.{0,20}\blow\b",
    r"\bi'?m\s+not\s+(good|great|smart|clever|funny)",
    r"\bmy\s+(fault|bad|mistake|loss)\b",
    r"\bi\s+should\s+(give up|stop|quit|leave)",
    r"\bkill me\b",
]

SELF_PHRASES = [
    "i'm gay", "im gay", "i am gay", "i'm bad", "i'm trash", "i'm losing",
    "i give up", "you won", "you win", "you're better", "you are better",
    "i lose", "my loss", "i surrender", "i quit", "i'm done", "i'm finished",
    "i can't do this", "i suck", "i'm weak", "i'm pathetic", "i'm worthless",
    "you're amazing", "you're great", "you're the best", "well played",
    "good game", "gg you win", "i admit defeat", "you're winning",
]

def is_self_degrading(text):
    lower = text.lower().strip()
    for phrase in SELF_PHRASES:
        if phrase in lower:
            return True
    for pattern in SELF_PATTERNS:
        if re.search(pattern, lower):
            return True
    return False

# ─── SPAM / GIBBERISH DETECTION ───────────────────────────────────────────────

LONE_BUZZWORDS = {
    'clapped','rekt','ratio','mid','cope','seethe','mald','l','w','lol','lmao',
    'gg','ez','gg ez','rip','bozo','npc','cringe','based','ok','k','cooked',
    'washed','diffed','bodied','clown','bro','skill issue','loser','noob','bot',
    'trash','bad','dumb','ratio','cope','bruh','dawg','fam','bro','nah',
}

def is_gibberish(text):
    # Non-Latin scripts (Hindi, Arabic etc.) — only check repetition
    non_latin = sum(1 for c in text if ord(c) > 0x024F and c.isalpha())
    if non_latin > len([c for c in text if c.isalpha()]) * 0.3:
        return is_pure_spam(text)
    words = text.strip().split()
    if not words: return True
    bad = 0
    for word in words:
        clean = re.sub(r'[^a-zA-Z]', '', word.lower())
        if len(clean) < 2: continue
        if len(set(clean)) == 1 and len(clean) >= 3: bad += 1; continue
        vowels = sum(1 for c in clean if c in 'aeiou')
        if len(clean) >= 4 and vowels == 0: bad += 1; continue
        if len(clean) >= 5 and (1 - vowels/len(clean)) > 0.85: bad += 1
    return bad >= max(1, len(words) * 0.6)

def is_pure_spam(text):
    words = text.lower().split()
    if len(words) < 2: return False
    if len(set(words)) == 1: return True
    most = max(set(words), key=words.count)
    return words.count(most)/len(words) >= 0.7 and len(words) >= 3

def is_single_char(text):
    return len(text.strip()) <= 2

def is_lone_buzzword(text):
    stripped = text.strip().lower().rstrip('.,!')
    words = stripped.split()
    if len(words) == 1: return True  # ANY single word = capped
    if len(words) == 2: return all(w in LONE_BUZZWORDS for w in words)
    return False

# ─── HARDCODED RESULT HELPERS ─────────────────────────────────────────────────

def spam_result():
    return {'aura':1,'damage':1,'creativity':1,'total':3,'verdict':pick('spam')}

def self_result():
    return {'aura':1,'damage':1,'creativity':1,'total':3,'verdict':pick('self')}

def buzzword_result():
    return {'aura':random.randint(1,3),'damage':random.randint(1,3),'creativity':1,
            'total':random.randint(3,7),'verdict':pick('weak')}

# ─── SMART HEURISTIC JUDGE ────────────────────────────────────────────────────
# This runs when Groq is unavailable. Much smarter than the old flat-7 version.

# Phrases that score high damage (targeting opponent)
TARGET_PHRASES = [
    'your whole existence','no wonder your','the fact that you','even your',
    'you look like','you sound like','you smell like','you act like',
    'you remind me of','your mom','your dad','your family',
    'you type like','you think like','you fight like',
    'imagine being','how does it feel','must be hard being',
    'teri aukat','tu madre','sua mae','ibn el',
]

STRUCTURE_PATTERNS = [
    r'\byou(r)?\s+\w+\s+(is|are|was|were|looks?|sounds?|smells?)\b',
    r'\beven\s+your\b',
    r'\bno\s+wonder\b',
    r'\bimagine\s+(being|thinking|believing)\b',
    r'\bthe\s+fact\s+that\s+you\b',
    r'\bhow\s+does\s+it\s+feel\b',
    r'\bwhen\s+you\b.{10,}',
    r'\byou\s+type\s+like\b',
    r'\bnot\s+even\s+your\b',
]

AURA_OPENERS = [
    "let me be honest","let's be honest","not gonna lie","honestly though",
    "the truth is","scientifically speaking","statistically","at this point",
    "with all due respect","listen","hear me out","i'm sorry but",
]

def heuristic_judge(text):
    lower = text.lower()
    words = lower.split()
    word_count = len(words)
    unique_ratio = len(set(words)) / max(word_count, 1)

    # ── DAMAGE: must be targeting opponent ──
    damage = 1
    for phrase in TARGET_PHRASES:
        if phrase in lower:
            damage += 3
            break
    for pat in STRUCTURE_PATTERNS:
        if re.search(pat, lower):
            damage += 2
            break
    # Length scaling — longer = more effort = more damage potential
    if word_count >= 8:  damage += 1
    if word_count >= 15: damage += 1
    if word_count >= 25: damage += 1
    # Simile/metaphor bonus
    if re.search(r'\blike\s+a\b|\bas\s+\w+\s+as\b', lower): damage += 2
    damage = min(damage, 10)

    # ── AURA: delivery confidence ──
    aura = 2
    caps_words = sum(1 for w in text.split() if w.isupper() and len(w) > 2)
    if caps_words >= 4: aura += 3
    elif caps_words >= 2: aura += 2
    elif caps_words >= 1: aura += 1
    if text.strip().endswith('?') and damage >= 4: aura += 1
    if word_count >= 20: aura += 2
    elif word_count >= 12: aura += 1
    for opener in AURA_OPENERS:
        if lower.strip().startswith(opener): aura += 2; break
    if text.count('!') >= 2: aura += 1
    aura = min(aura, 10)

    # ── CREATIVITY: originality ──
    creativity = 1
    if unique_ratio > 0.9 and word_count > 8:  creativity += 3
    elif unique_ratio > 0.75 and word_count > 5: creativity += 2
    elif unique_ratio > 0.6 and word_count > 3:  creativity += 1
    if word_count >= 20: creativity += 2
    elif word_count >= 12: creativity += 1
    for pat in STRUCTURE_PATTERNS:
        if re.search(pat, lower): creativity += 2; break
    if re.search(r'\blike\s+a\b|\bas\s+\w+\s+as\b|\breminds?\s+me\b', lower): creativity += 2
    creativity = min(creativity, 10)

    total = aura + damage + creativity

    if total >= 24: verdict = pick('legendary')
    elif total >= 17: verdict = pick('elite')
    elif total >= 11: verdict = pick('mid')
    else: verdict = pick('weak')

    return {'aura':aura,'damage':damage,'creativity':creativity,'total':total,'verdict':verdict}

# ─── GROQ JUDGE ───────────────────────────────────────────────────────────────

def judge_with_groq(text):
    try:
        resp = groq_client.chat.completions.create(
            model='llama3-8b-8192',
            messages=[
                {'role':'system','content':SYSTEM_PROMPT},
                {'role':'user','content':f'Rate this trash talk: "{text}"'}
            ],
            max_tokens=120, temperature=0.4,
        )
        raw = re.sub(r'```json|```','',resp.choices[0].message.content.strip()).strip()
        s = json.loads(raw)
        aura       = max(1, min(int(s.get('aura',3)), 10))
        damage     = max(1, min(int(s.get('damage',3)), 10))
        creativity = max(1, min(int(s.get('creativity',3)), 10))
        total      = aura + damage + creativity
        verdict    = str(s.get('verdict','SHOT FIRED')).upper()[:40]
        return {'aura':aura,'damage':damage,'creativity':creativity,'total':total,'verdict':verdict}
    except Exception as e:
        print(f'[GROQ ERROR] {e}')
        return heuristic_judge(text)

# ─── PUBLIC INTERFACE ─────────────────────────────────────────────────────────

def judge_message(text):
    text = text.strip()
    if not text or is_single_char(text):
        return spam_result()
    if is_pure_spam(text):
        print(f'[SPAM] {text[:30]}')
        return spam_result()
    if is_gibberish(text):
        print(f'[GIBBERISH] {text[:30]}')
        return spam_result()
    if is_self_degrading(text):
        print(f'[SELF-DEGRADE] {text[:30]}')
        return self_result()
    if is_lone_buzzword(text):
        print(f'[BUZZWORD] {text[:30]}')
        return buzzword_result()
    if GROQ_AVAILABLE and groq_client:
        return judge_with_groq(text)
    return heuristic_judge(text)
