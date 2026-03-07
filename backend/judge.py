import os
import json
import random
import re

groq_client = None
GROQ_AVAILABLE = False

# ─── RATE LIMITER ─────────────────────────────────────────────────────────────
# Serialises all Groq calls to avoid RPM bursts on free tier (30 req/min)
import threading as _threading
import time as _time

_groq_lock    = _threading.Lock()
_last_call_ts = 0.0
_MIN_GAP_SEC  = 2.2   # ~27 req/min max — stays safely under 30 RPM limit

def _groq_call(fn):
    """Wrap any groq API call with rate limiting."""
    global _last_call_ts
    with _groq_lock:
        now = _time.time()
        wait = _MIN_GAP_SEC - (now - _last_call_ts)
        if wait > 0:
            _time.sleep(wait)
        result = fn()
        _last_call_ts = _time.time()
        return result

_groq_key = os.environ.get('GROQ_API_KEY', '').strip()
print(f'[JUDGE] GROQ_API_KEY present: {bool(_groq_key)}, length: {len(_groq_key)}')

if _groq_key:
    try:
        from groq import Groq
        groq_client = Groq(api_key=_groq_key)
        _test = _groq_call(lambda: groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role': 'user', 'content': 'say ok'}],
            max_tokens=5,
        ))
        GROQ_AVAILABLE = True
        print('[JUDGE] Groq client verified and working')
    except Exception as e:
        print(f'[JUDGE] Groq init/test failed: {type(e).__name__}: {e}')
        groq_client = None
        GROQ_AVAILABLE = False
else:
    print('[JUDGE] No GROQ_API_KEY — falling back to heuristic')

# ─── HEURISTIC VERDICT POOLS (fallback only) ──────────────────────────────────

VERDICTS = {
    'legendary': ['ABSOLUTE DESTRUCTION ACHIEVED','FATALITY — FLAWLESS VICTORY','KEYBOARD WARRIOR UNLOCKED','LEGENDARY STATUS CONFIRMED','THE INTERNET BOWS DOWN','HISTORIC DAMAGE LOGGED'],
    'elite':     ['SOLID BURN — FELT THAT','OPPONENT ON LIFE SUPPORT','THAT ONE LEFT A MARK','DEVASTATING COMBO LANDED','AURA LEVELS CRITICAL','RATIO CONFIRMED'],
    'callback':  ['PERFECT COUNTER REGISTERED','CONTEXT MASTER DETECTED','COMEBACK OF THE ROUND','READ AND DESTROYED','THEY WALKED RIGHT INTO IT'],
    'mid':       ['DECENT SHOT — KEEP PUSHING','GLANCING HIT REGISTERED','NOT BAD — NOT GREAT','POINTS ON THE BOARD','WARMING UP DETECTED'],
    'weak':      ['WEAK SAUCE DETECTED','IS THAT ALL YOU GOT','MY GRANDMOTHER TYPES HARDER','THE CROWD FELL ASLEEP','CRITICAL MISS — TRY AGAIN'],
    'self':      ['SELF DESTRUCTION ACTIVATED','DID YOU JUST INSULT YOURSELF','OWN GOAL DETECTED','FREE POINTS FOR OPPONENT','FRIENDLY FIRE — NO POINTS'],
    'spam':      ['SPAM DETECTED — NO POINTS','TRY USING ACTUAL WORDS','LAZY TACTICS PENALIZED','GIBBERISH REJECTED','SPAM FILTER ACTIVATED'],
}

def pick(tier): return random.choice(VERDICTS[tier])

# ─── SELF-DEGRADING DETECTION ─────────────────────────────────────────────────

SELF_PATTERNS = [
    r"\bi('m| am)\s+(losing|lost|done|finished|gay|bad|trash|terrible|awful|stupid|dumb|weak|pathetic|worthless|useless|a cuck|a loser|nothing)",
    r"\bi\s+(give up|quit|surrender|concede|admit|lost|suck|can'?t|cannot)",
    r"\bi\s+(can'?t|cannot)\s+(do|win|compete|fight|beat)",
    r"\byou('?re| are)\s+(better|winning|won|right|correct|amazing|great|good|the best)",
    r"\byou\s+win\b", r"\bi\s+lose\b", r"\bi\s+admit\b", r"\bi\s+was\s+wrong\b",
    r"\bsorry\b.{0,20}\bi\b", r"\bforgive me\b",
    r"\bi'?m\s+not\s+(good|great|smart|clever|funny)",
    r"\bmy\s+(fault|bad|mistake|loss)\b",
    r"\bi\s+should\s+(give up|stop|quit|leave)",
    r"\bkill me\b",
    r"\b(fuck|use|rape|bang|breed)\s+(my|me)\b",
    r"\bcome\s+(fuck|use|do|take)\s+(my|me)\b",
    r"\bi('?m| am)\s+a?\s*(cuck|simp|slave|bottom|sub|toy|doormat)",
    r"\bi('?m| am)\s+gay\b",
    r"\bme\s+gay\s+hu\b", r"\bmain\s+gay\s+hu\b", r"\bmai\s+gay\s+hu\b",
    r"\bmera\s+gaand\b", r"\buse\s+me\b",
    r"\bmain\s+haar\s+gaya\b", r"\bmain\s+haar\s+gayi\b",
    r"\btu\s+(jeet|jeeta|jiti)\b", r"\btune\s+jeeta?\b",
    r"\btu\s+better\s+hai\b", r"\btum\s+better\s+ho\b",
]
# Compiled once at import — avoids re-parsing on every message
_RE_SELF = re.compile('|'.join(SELF_PATTERNS), re.IGNORECASE)

SELF_PHRASES = [
    "i'm gay","im gay","i am gay","i'm bad","i'm trash","i'm losing",
    "i give up","you won","you win","you're better","you are better",
    "i lose","my loss","i surrender","i quit","i'm done","i'm finished",
    "i can't do this","i suck","i'm weak","i'm pathetic","i'm worthless",
    "you're amazing","you're great","you're the best","well played",
    "good game","gg you win","i admit defeat","you're winning",
    "i'm a cuck","im a cuck","come fuck my","fuck my mum","fuck my mom",
    "use my","i'm a simp","im a simp","me gay hu","mera gaand",
    "main gay hu","mai gay hu","main haar gaya","tu jeet gaya",
    "tu better hai","mujhe le lo",
]

def is_self_degrading(text):
    lower = text.lower().strip()
    for phrase in SELF_PHRASES:
        if phrase in lower: return True
    return bool(_RE_SELF.search(lower))

# ─── SPAM / GIBBERISH ─────────────────────────────────────────────────────────

LONE_BUZZWORDS = {
    'clapped','rekt','ratio','mid','cope','seethe','mald','l','w','lol','lmao',
    'gg','ez','rip','bozo','npc','cringe','based','ok','k','cooked',
    'washed','diffed','bodied','clown','bro','skill issue','loser','noob','bot',
    'trash','bad','dumb','bruh','dawg','fam','nah',
}

def is_gibberish(text):
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

def is_single_char(text): return len(text.strip()) <= 2

def is_lone_buzzword(text):
    stripped = text.strip().lower().rstrip('.,!')
    words = stripped.split()
    if len(words) == 1: return True
    if len(words) == 2: return all(w in LONE_BUZZWORDS for w in words)
    return False

def is_repeat_spam(text, history, role):
    if not history: return False
    normalized = text.lower().strip()
    same = [h for h in history if h['role'] == role and h['text'].lower().strip() == normalized]
    return len(same) >= 2

# ─── RESULT HELPERS ───────────────────────────────────────────────────────────

def zero_result(tier):
    return {'aura':0,'damage':0,'creativity':0,'total':0,'verdict':pick(tier)}

def spam_result(): return zero_result('spam')
def self_result(): return zero_result('self')

def buzzword_result():
    return {'aura':random.randint(1,2),'damage':random.randint(1,2),'creativity':1,
            'total':random.randint(3,5),'verdict':pick('weak')}

# ─── CONTEXT BUILDER ──────────────────────────────────────────────────────────

def build_context_string(history):
    if not history:
        return "NONE — opening move of the round."
    lines = [f"  [{h['name']}]: {h['text']}" for h in history[-6:]]
    return "\n".join(lines)

# ─── LANGUAGE DETECTION ───────────────────────────────────────────────────────

ROMAN_HINDI_KEYWORDS = {
    'teri','tere','tera','meri','mera','mere','tujhe','tujhse',
    'bhai','yaar','sala','saala','kya','hai','nahi','hoga','kar',
    'diya','gaya','raha','liya','wala','wali','apna','apni','unka',
    'aukat','izzat','gaand','maa','baap','behen','kutte','harami',
    'bakwaas','chutiya','madarchod','behenchod','randi','kamina','bhadwa',
    'naali','gutter','nalayak','nikamma','bewakoof','gadha','ullu',
}

def detect_language(text):
    lower = text.lower()
    devanagari   = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    arabic_script = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
    total_alpha  = max(len([c for c in text if c.isalpha()]), 1)
    if devanagari  / total_alpha > 0.15: return 'hindi'
    if arabic_script / total_alpha > 0.15: return 'arabic'
    words = set(re.findall(r'\b\w+\b', lower))
    if len(words & ROMAN_HINDI_KEYWORDS) >= 1: return 'hindi'
    return 'english'

# ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are the judge in KEYBOARD WARRIOR — a real-time AI-judged trash talk battle.

YOUR JOB: Score the CURRENT MESSAGE and write a verdict that fits the language and energy of the battle.

━━━ STEP 1 — READ HISTORY FIRST ━━━
Before scoring anything, read the opponent's last message in HISTORY.
Ask yourself: does the CURRENT MESSAGE respond to, flip, or weaponize something from that last message?
This is the most important question you will answer.

━━━ STEP 2 — SELF-INSULT CHECK ━━━
If the sender is degrading THEMSELVES (not the opponent) — surrender, self-deprecation, sexual self-offering — return zeros.
English: "I give up", "you're better", "I'm trash"
Hindi: "main haar gaya", "tu jeet gaya", "tu better hai"
ZERO: {"aura":0,"damage":0,"creativity":0,"total":0,"verdict":"OWN GOAL DETECTED"}

━━━ STEP 3 — SCORE THE MESSAGE ━━━
Three dimensions, each 1–10:

aura (1–10): confidence and delivery — how hard did they sell it
damage (1–10): how badly this stings the opponent in real life
creativity (1–10):
  REWARD: turning opponent words against them, clever metaphors, unexpected comparisons, specific personal details
  DO NOT REWARD: longer sentences alone, profanity alone, repeated insults, generic phrases

━━━ SCORING SCALE ━━━
Generic one-liner ("you suck", "tu bura hai") → total 3–8
Basic structured insult → total 9–14
Creative roast with specific imagery → total 15–20
Strong contextual comeback → total 21–26
Perfect reversal — flips opponent's own words against them → total 27–30

━━━ CONTEXT RULE ━━━
If CURRENT MESSAGE directly references, mocks, or flips something from HISTORY:
  → Add +2 to creativity AND +2 to damage
  → These can push scores above 10 only via this bonus (cap each at 10 after bonus)
A message that weaponizes the opponent's previous insult deserves the highest creativity.

━━━ IRRELEVANCE PENALTY ━━━
If CURRENT MESSAGE has no connection to the opponent's last message AND history exists:
  → creativity must not exceed 5
  → total must not exceed 12
Generic insults sent into the void are boring — punish them.

━━━ VERDICT RULE ━━━
Write the verdict in THE SAME LANGUAGE as the CURRENT MESSAGE:
- Hindi (Roman or Devanagari): "EKDUM KHATAM KAR DIYA" / "BHAI NE MAAR DAALA" / "AUKAT DIKHA DI AAKHIR" / "TERE WORDS TUJHPE GIRE"
- Arabic: match the language
- English: match the energy of the score
Verdict: 4–6 words, ALL CAPS, savage and hype. Make it feel earned.

━━━ OUTPUT ━━━
JSON only. No markdown. No explanation. No reasoning in output.
{"aura":N,"damage":N,"creativity":N,"total":N,"verdict":"TEXT"}
total MUST equal aura+damage+creativity exactly."""

# ─── GROQ JUDGE ───────────────────────────────────────────────────────────────

def judge_with_groq(text, history=None, role=None):
    if history is None: history = []

    lang = detect_language(text)
    context_str = build_context_string(history)

    # Pull out opponent's last message explicitly for the model to focus on
    opp_last = ''
    if history:
        for h in reversed(history):
            if h.get('role') != role:
                opp_last = h['text']
                break

    user_prompt = f"""ROUND HISTORY (last {min(len(history),6)} messages):
{context_str}

OPPONENT'S LAST MESSAGE: "{opp_last if opp_last else 'none yet'}"

CURRENT MESSAGE (language: {lang}):
"{text}"

Does this message respond to or flip the opponent's last message? Score it."""

    for attempt in range(2):
        try:
            resp = _groq_call(lambda: groq_client.chat.completions.create(
                model='llama-3.3-70b-versatile',
                messages=[
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    {'role': 'user',   'content': user_prompt},
                ],
                max_tokens=120,
                temperature=0.15,
            ))
            raw = re.sub(r'```json|```', '', resp.choices[0].message.content.strip()).strip()
            m = re.search(r'\{.*\}', raw, re.DOTALL)
            if not m:
                raise ValueError(f'No JSON: {raw}')
            s = json.loads(m.group())
            aura       = max(0, min(int(s.get('aura',       0)), 10))
            damage     = max(0, min(int(s.get('damage',     0)), 10))
            creativity = max(0, min(int(s.get('creativity', 0)), 10))
            total      = aura + damage + creativity
            verdict    = str(s.get('verdict', 'SHOT FIRED')).upper()[:60]

            # Never override Groq's verdict — it already follows the language rule
            print(f'[GROQ:{lang}] "{text[:35]}" → {total}pts | {verdict}')
            return {'aura': aura, 'damage': damage, 'creativity': creativity, 'total': total, 'verdict': verdict}

        except Exception as e:
            err = str(e).lower()
            if ('rate' in err or '429' in err) and attempt == 0:
                print('[GROQ RATE LIMIT] retrying in 2s...')
                import time as _t; _t.sleep(2)
                continue
            print(f'[GROQ ERROR] {e}')
            return heuristic_judge(text)
    return heuristic_judge(text)

# ─── HEURISTIC FALLBACK ───────────────────────────────────────────────────────

TARGET_PHRASES = [
    'your whole existence','no wonder your','the fact that you','even your',
    'you look like','you sound like','you smell like','you act like',
    'you remind me of','your mom','your dad','your family',
    'you type like','you think like','you fight like',
    'imagine being','how does it feel','must be hard being',
    'teri aukat','tu madre','sua mae','ibn el','teri maa','tere baap',
]

STRUCTURE_PATTERNS = [
    r'\byou(r)?\s+\w+\s+(is|are|was|were|looks?|sounds?|smells?)\b',
    r'\beven\s+your\b', r'\bno\s+wonder\b',
    r'\bimagine\s+(being|thinking|believing)\b',
    r'\bthe\s+fact\s+that\s+you\b', r'\bhow\s+does\s+it\s+feel\b',
    r'\byou\s+type\s+like\b', r'\bnot\s+even\s+your\b',
]
_RE_STRUCTURE  = re.compile('|'.join(STRUCTURE_PATTERNS), re.IGNORECASE)
_RE_SIMILE     = re.compile(r'\blike\s+a\b|\bas\s+\w+\s+as\b', re.IGNORECASE)
_RE_SIMILE_EXT = re.compile(r'\blike\s+a\b|\bas\s+\w+\s+as\b|\breminds?\s+me\b', re.IGNORECASE)

AURA_OPENERS = [
    "let me be honest","not gonna lie","honestly though","the truth is",
    "scientifically speaking","at this point","with all due respect",
    "listen","hear me out","i'm sorry but","suno","bhai sun",
]

def heuristic_judge(text, history=None):
    lower = text.lower()
    words = lower.split()
    word_count = len(words)
    unique_ratio = len(set(words)) / max(word_count, 1)

    # ── DAMAGE ──────────────────────────────────────────────
    damage = 2  # base raised from 1→2
    for phrase in TARGET_PHRASES:
        if phrase in lower: damage += 4; break  # raised 3→4
    if _RE_STRUCTURE.search(lower): damage += 3   # raised 2→3
    if word_count >= 6:  damage += 1   # lowered threshold 8→6
    if word_count >= 12: damage += 1   # lowered 15→12
    if word_count >= 20: damage += 2   # new: big bonus for long burns
    if _RE_SIMILE.search(lower): damage += 3      # raised 2→3
    # specific personal attack patterns
    import re as _re
    if _re.search(r'your\s+\w+\s+(is|are|was|looks?|sounds?|smells?|acts?)', lower): damage += 2
    if _re.search(r'imagine\s+being', lower): damage += 2
    if _re.search(r'how\s+(does\s+it\s+feel|dare\s+you)', lower): damage += 2
    damage = min(damage, 10)

    # ── AURA ────────────────────────────────────────────────
    aura = 3  # base raised from 2→3
    caps_words = sum(1 for w in text.split() if w.isupper() and len(w) > 2)
    if caps_words >= 3: aura += 4   # lowered threshold, raised bonus
    elif caps_words >= 2: aura += 3
    elif caps_words >= 1: aura += 2  # raised 1→2
    if text.strip().endswith('?'): aura += 2   # removed damage gate
    if word_count >= 15: aura += 2   # lowered 20→15
    elif word_count >= 8: aura += 1  # lowered 12→8
    for opener in AURA_OPENERS:
        if lower.strip().startswith(opener): aura += 3; break  # raised 2→3
    if text.count('!') >= 1: aura += 1   # lowered threshold 2→1
    if text.count('!') >= 3: aura += 1   # extra for really hyped delivery
    aura = min(aura, 10)

    # ── CREATIVITY ──────────────────────────────────────────
    creativity = 2  # base raised from 1→2
    if unique_ratio > 0.85 and word_count > 6:   creativity += 4  # lowered thresholds
    elif unique_ratio > 0.7  and word_count > 4:  creativity += 3
    elif unique_ratio > 0.55 and word_count > 2:  creativity += 2
    if word_count >= 15: creativity += 2   # lowered 20→15
    elif word_count >= 8: creativity += 1  # lowered 12→8
    if _RE_STRUCTURE.search(lower):  creativity += 3   # raised 2→3
    if _RE_SIMILE_EXT.search(lower): creativity += 3   # raised 2→3
    # reward comma-separated multi-part burns (complex sentence structure)
    if text.count(',') >= 2 and word_count >= 10: creativity += 2
    if text.count('—') >= 1 or text.count('...') >= 1: creativity += 1  # deliberate pacing
    creativity = min(creativity, 10)

    total = aura + damage + creativity
    if total >= 24: verdict = pick('legendary')
    elif total >= 17: verdict = pick('elite')
    elif total >= 11: verdict = pick('mid')
    else: verdict = pick('weak')

    return {'aura':aura,'damage':damage,'creativity':creativity,'total':total,'verdict':verdict}

# ─── PUBLIC INTERFACE ─────────────────────────────────────────────────────────

def judge_message(text, history=None, role=None):
    if history is None: history = []
    text = text.strip()

    if not text or is_single_char(text):           return spam_result()
    if is_pure_spam(text):
        print(f'[SPAM] {text[:30]}');              return spam_result()
    if is_gibberish(text):
        print(f'[GIBBERISH] {text[:30]}');         return spam_result()
    if is_self_degrading(text):
        print(f'[SELF] {text[:30]}');              return self_result()
    if is_lone_buzzword(text):
        print(f'[BUZZWORD] {text[:30]}');          return buzzword_result()
    if role and is_repeat_spam(text, history, role):
        print(f'[REPEAT] {text[:30]}');            return spam_result()

    if GROQ_AVAILABLE and groq_client:
        return judge_with_groq(text, history=history, role=role)
    return heuristic_judge(text, history=history)

# ─── BEST BURN ────────────────────────────────────────────────────────────────

BEST_BURN_PROMPT = """You are the KEYBOARD WARRIOR commentator. A trash talk round just ended.

Given the messages below, pick the single most devastating, creative, or contextually perfect burn of the round.

Rules:
- Ignore messages that scored 0 or were spam/self-insults
- Pick the one that would make the crowd go wild
- If it was a perfect comeback to the previous message, that wins
- Write a savage 1-sentence reason (max 12 words, brutal and hype, no punctuation fluff)

Respond ONLY with valid JSON:
{"name":"sender name","text":"the burn text","reason":"YOUR SHORT SAVAGE REASON"}"""

def get_best_burn(full_history, scores_by_msg=None):
    if not GROQ_AVAILABLE or not groq_client: return None
    real = [h for h in full_history if len(h['text'].strip()) > 5]
    if len(real) < 2: return None
    try:
        lines = "\n".join([f"[{h['name']}]: {h['text']}" for h in real])
        resp = _groq_call(lambda: groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {'role': 'system', 'content': BEST_BURN_PROMPT},
                {'role': 'user',   'content': f"ROUND MESSAGES:\n{lines}\n\nPick the best burn."}
            ],
            max_tokens=120,
            temperature=0.3,
        ))
        raw = re.sub(r'```json|```', '', resp.choices[0].message.content.strip()).strip()
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if not m: return None
        result = json.loads(m.group())
        if not result.get('text') or not result.get('reason'): return None
        print(f'[BEST BURN] {result["name"]}: "{result["text"][:30]}" — {result["reason"][:40]}')
        return result
    except Exception as e:
        print(f'[BEST BURN ERROR] {e}')
        return None
