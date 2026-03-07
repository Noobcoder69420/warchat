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
        _test = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role': 'user', 'content': 'say ok'}],
            max_tokens=5,
        )
        GROQ_AVAILABLE = True
        print(f'[JUDGE] Groq client verified and working')
    except Exception as e:
        print(f'[JUDGE] Groq init/test failed: {type(e).__name__}: {e}')
        groq_client = None
        GROQ_AVAILABLE = False
else:
    print('[JUDGE] No GROQ_API_KEY — falling back to heuristic')

# ─── VERDICTS ─────────────────────────────────────────────────────────────────

VERDICTS = {
    'legendary': ['ABSOLUTE DESTRUCTION ACHIEVED','FATALITY — FLAWLESS VICTORY','KEYBOARD WARRIOR UNLOCKED','LEGENDARY STATUS CONFIRMED','THE INTERNET BOWS DOWN','HISTORIC DAMAGE LOGGED'],
    'elite':     ['SOLID BURN — FELT THAT','OPPONENT ON LIFE SUPPORT','THAT ONE LEFT A MARK','DEVASTATING COMBO LANDED','AURA LEVELS CRITICAL','RATIO CONFIRMED'],
    'callback':  ['PERFECT COUNTER REGISTERED','CONTEXT MASTER DETECTED','COMEBACK OF THE ROUND','READ AND DESTROYED','THEY WALKED RIGHT INTO IT'],
    'mid':       ['DECENT SHOT — KEEP PUSHING','GLANCING HIT REGISTERED','NOT BAD — NOT GREAT','POINTS ON THE BOARD','WARMING UP DETECTED','SERVICEABLE ATTEMPT'],
    'weak':      ['WEAK SAUCE DETECTED','IS THAT ALL YOU GOT','MY GRANDMOTHER TYPES HARDER','THE CROWD FELL ASLEEP','CRITICAL MISS — TRY AGAIN','ZERO DAMAGE OUTPUT'],
    'self':      ['SELF DESTRUCTION ACTIVATED','DID YOU JUST INSULT YOURSELF','OWN GOAL DETECTED','THAT HURT YOU MORE','FREE POINTS FOR OPPONENT','FRIENDLY FIRE — NO POINTS'],
    'spam':      ['SPAM DETECTED — NO POINTS','TRY USING ACTUAL WORDS','LAZY TACTICS PENALIZED','GIBBERISH REJECTED','SPAM FILTER ACTIVATED'],
}

def pick(tier): return random.choice(VERDICTS[tier])

# ─── SELF-DEGRADING DETECTION ─────────────────────────────────────────────────

SELF_PATTERNS = [
    # Standard surrender
    r"\bi('m| am)\s+(losing|lost|done|finished|gay|bad|trash|terrible|awful|stupid|dumb|weak|pathetic|worthless|useless|a cuck|a loser|nothing)",
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
    # Sexual self-submission — sender offering themselves / self-humiliation
    r"\b(fuck|use|rape|bang|breed)\s+(my|me)\b",
    r"\bcome\s+(fuck|use|do|take)\s+(my|me)\b",
    r"\bi('?m| am)\s+a?\s*(cuck|simp|slave|bottom|sub|toy|doormat)",
    r"\bmy\s+(ass|gaand|butt|hole)\b.{0,15}\b(you|come|yours|take|use)\b",
    r"\bi('?m| am)\s+gay\b",
    r"\bme\s+gay\s+hu\b",
    r"\bmera\s+gaand\b",
    r"\bmai(n)?\s+gay\s+hu\b",
    r"\buse\s+me\b",
]

SELF_PHRASES = [
    "i'm gay", "im gay", "i am gay", "i'm bad", "i'm trash", "i'm losing",
    "i give up", "you won", "you win", "you're better", "you are better",
    "i lose", "my loss", "i surrender", "i quit", "i'm done", "i'm finished",
    "i can't do this", "i suck", "i'm weak", "i'm pathetic", "i'm worthless",
    "you're amazing", "you're great", "you're the best", "well played",
    "good game", "gg you win", "i admit defeat", "you're winning",
    "i'm a cuck", "im a cuck", "i am a cuck", "come fuck my", "fuck my mum",
    "fuck my mom", "use my", "i'm a simp", "im a simp", "me gay hu",
    "mera gaand", "main gay hu", "mai gay hu", "mujhe maaro", "mujhe le lo",
]

def is_self_degrading(text):
    lower = text.lower().strip()
    for phrase in SELF_PHRASES:
        if phrase in lower: return True
    for pattern in SELF_PATTERNS:
        if re.search(pattern, lower): return True
    return False

# ─── SPAM / GIBBERISH DETECTION ───────────────────────────────────────────────

LONE_BUZZWORDS = {
    'clapped','rekt','ratio','mid','cope','seethe','mald','l','w','lol','lmao',
    'gg','ez','gg ez','rip','bozo','npc','cringe','based','ok','k','cooked',
    'washed','diffed','bodied','clown','bro','skill issue','loser','noob','bot',
    'trash','bad','dumb','ratio','cope','bruh','dawg','fam','bro','nah',
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

def is_single_char(text):
    return len(text.strip()) <= 2

def is_lone_buzzword(text):
    stripped = text.strip().lower().rstrip('.,!')
    words = stripped.split()
    if len(words) == 1: return True
    if len(words) == 2: return all(w in LONE_BUZZWORDS for w in words)
    return False

# ─── RESULT HELPERS ───────────────────────────────────────────────────────────

def zero_result(tier):
    """Truly zero points — self-insult or repeat spam."""
    return {'aura':0,'damage':0,'creativity':0,'total':0,'verdict':pick(tier)}

def spam_result():
    return zero_result('spam')

def self_result():
    return zero_result('self')

def buzzword_result():
    return {'aura':random.randint(1,2),'damage':random.randint(1,2),'creativity':1,
            'total':random.randint(3,5),'verdict':pick('weak')}

# ─── REPEAT SPAM DETECTION ────────────────────────────────────────────────────

def is_repeat_spam(text, history, role):
    """Returns True if this player sent the same/similar message 2+ times already."""
    if not history: return False
    normalized = text.lower().strip()
    same = [h for h in history if h['role'] == role and h['text'].lower().strip() == normalized]
    return len(same) >= 2  # 3rd time sending same thing = spam

# ─── LANGUAGE DETECTION ───────────────────────────────────────────────────────

def detect_language(text):
    """Rough language detection for verdict language selection."""
    devanagari = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    arabic_script = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
    total_alpha = max(len([c for c in text if c.isalpha()]), 1)
    if devanagari / total_alpha > 0.2: return 'hindi'
    if arabic_script / total_alpha > 0.2: return 'arabic'
    return 'english'

def needs_translation(text):
    """Detect if text contains significant non-English script."""
    non_ascii = sum(1 for c in text if ord(c) > 127)
    return non_ascii > len(text) * 0.15

def translate_to_english(text):
    """Translate text to English using Groq for better judging accuracy."""
    try:
        resp = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{
                'role': 'user',
                'content': f'Translate this to English. Return ONLY the translation, nothing else: "{text}"'
            }],
            max_tokens=150,
            temperature=0.1,
        )
        translated = resp.choices[0].message.content.strip().strip('"')
        print(f'[TRANSLATE] "{text[:30]}" → "{translated[:40]}"')
        return translated
    except Exception as e:
        print(f'[TRANSLATE ERROR] {e}')
        return text  # fallback to original

# ─── CONTEXT BUILDER ──────────────────────────────────────────────────────────

def build_context_string(history):
    """Format chat history for the judge prompt."""
    if not history:
        return "No previous messages — this is the opening move."
    lines = []
    for entry in history[-4:]:  # last 4 messages max
        lines.append(f"  [{entry['name']}]: {entry['text']}")
    return "\n".join(lines)

# ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are the KEYBOARD WARRIOR judge — the most ruthless, culturally fluent trash talk referee on the internet.

You receive:
1. The CURRENT MESSAGE to score
2. The CONVERSATION HISTORY from this round (what was said before)
3. The detected language of the message

YOUR JOB: Score the current message. Be merciless and fair.

━━━ STEP 1: SELF-INSULT DETECTION (highest priority) ━━━
If the sender is degrading, submitting, or humiliating THEMSELVES — score 0 instantly.
This includes ANY of:
- Admitting defeat, giving up, surrendering in any language
- Calling themselves weak, bad, gay, a cuck, a simp, worthless
- Offering their body/inviting sexual acts done TO them ("come fuck my...", "use me", "mera gaand...")
- Praising the opponent ("you're better", "tu jeet gaya", "you won")
- Sexual self-submission in any language

SELF-INSULT SCORE: {"aura":0,"damage":0,"creativity":0,"total":0,"verdict":"<IN THEIR LANGUAGE>"}

━━━ STEP 2: CLASSIFY AND SCORE ATTACKS ━━━

aura (1-10): Confidence, swagger, delivery
damage (1-10): How badly it stings the opponent's ego
creativity (1-10): Originality, wordplay, metaphor, structure

CONTEXT BONUSES:
+2 all scores: direct clever callback to opponent's previous message
+1 creativity: flips opponent's own words against them
-2 creativity: repeats something sender already said this round

SCORING SCALE:
- Weak generic → total 7-10
- Structured burn with metaphor/simile → total 12-17
- Personal/creative devastation → total 18-23
- Elaborate layered multi-angle roast → total 24-28
- Perfect contextual callback → total 25-30

CULTURAL SCORING:
- Hindi/Urdu: ancestry, class, status burns on opponent → damage 8-10
- Arabic: honor, family burns on opponent → damage 8-10
- Spanish: tu madre constructions on opponent → damage 7-9

━━━ VERDICT LANGUAGE RULE ━━━
If the message is in Hindi/Urdu → write the verdict in Hindi (Devanagari or Roman Hindi)
If the message is in Arabic → write the verdict in Arabic
If the message is in English → write the verdict in English
The verdict must be 4-6 words, ALL CAPS, hype and savage.

Hindi verdict examples: "EKDUM KHATAM KAR DIYA", "BHAI NE MAAR HI DAALA", "AUKAT DIKHA DI TUNE"
Arabic verdict examples: "تم التدمير الكامل", "ضربة قاضية مسجلة"

━━━ OUTPUT ━━━
Respond ONLY with valid JSON. No markdown, no preamble.
{"aura":N,"damage":N,"creativity":N,"total":N,"verdict":"CALLOUT HERE"}
total MUST equal aura+damage+creativity exactly."""

# ─── GROQ JUDGE ───────────────────────────────────────────────────────────────

def judge_with_groq(text, history=None, role=None):
    if history is None:
        history = []

    lang = detect_language(text)

    # Translate non-Latin scripts for judging accuracy, but keep original for language detection
    judge_text = text
    was_translated = False
    if lang in ('hindi', 'arabic') and groq_client:
        translated = translate_to_english(text)
        if translated != text:
            judge_text = translated
            was_translated = True

    context_str = build_context_string(history)

    user_prompt = f"""DETECTED LANGUAGE: {lang.upper()}

CONVERSATION HISTORY THIS ROUND:
{context_str}

CURRENT MESSAGE TO SCORE:
"{judge_text}"
{f'(Original {lang}: "{text}")' if was_translated else ''}

Score this message. Remember: if sender is self-insulting or submitting, total must be 0."""

    try:
        resp = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user',   'content': user_prompt},
            ],
            max_tokens=120,
            temperature=0.1,
        )
        raw = re.sub(r'```json|```', '', resp.choices[0].message.content.strip()).strip()
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            raise ValueError(f'No JSON in response: {raw}')
        s = json.loads(match.group())
        aura       = max(0, min(int(s.get('aura', 0)), 10))
        damage     = max(0, min(int(s.get('damage', 0)), 10))
        creativity = max(0, min(int(s.get('creativity', 0)), 10))
        total      = aura + damage + creativity
        verdict    = str(s.get('verdict', 'SHOT FIRED')).upper()[:50]

        # Callback verdict boost
        if total >= 25 and history:
            verdict = pick('callback') if random.random() > 0.4 else verdict

        print(f'[GROQ] "{text[:25]}" → {total}pts | {verdict}')
        return {'aura': aura, 'damage': damage, 'creativity': creativity, 'total': total, 'verdict': verdict}
    except Exception as e:
        print(f'[GROQ ERROR] {e}')
        return heuristic_judge(text)

# ─── SMART HEURISTIC JUDGE (fallback) ────────────────────────────────────────

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
    r'\beven\s+your\b',r'\bno\s+wonder\b',r'\bimagine\s+(being|thinking|believing)\b',
    r'\bthe\s+fact\s+that\s+you\b',r'\bhow\s+does\s+it\s+feel\b',
    r'\bwhen\s+you\b.{10,}',r'\byou\s+type\s+like\b',r'\bnot\s+even\s+your\b',
]

AURA_OPENERS = [
    "let me be honest","let's be honest","not gonna lie","honestly though",
    "the truth is","scientifically speaking","statistically","at this point",
    "with all due respect","listen","hear me out","i'm sorry but",
]

def heuristic_judge(text, history=None):
    lower = text.lower()
    words = lower.split()
    word_count = len(words)
    unique_ratio = len(set(words)) / max(word_count, 1)

    damage = 1
    for phrase in TARGET_PHRASES:
        if phrase in lower: damage += 3; break
    for pat in STRUCTURE_PATTERNS:
        if re.search(pat, lower): damage += 2; break
    if word_count >= 8:  damage += 1
    if word_count >= 15: damage += 1
    if word_count >= 25: damage += 1
    if re.search(r'\blike\s+a\b|\bas\s+\w+\s+as\b', lower): damage += 2
    damage = min(damage, 10)

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

# ─── PUBLIC INTERFACE ─────────────────────────────────────────────────────────

def judge_message(text, history=None, role=None):
    if history is None:
        history = []
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
    if role and is_repeat_spam(text, history, role):
        print(f'[REPEAT-SPAM] {text[:30]}')
        return spam_result()

    if GROQ_AVAILABLE and groq_client:
        return judge_with_groq(text, history=history, role=role)
    return heuristic_judge(text, history=history)
