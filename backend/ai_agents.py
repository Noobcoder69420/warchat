import random
import re
import time

def _groq_call(fn):
    """Delegate to judge's shared rate limiter."""
    try:
        from judge import _groq_call as _jgc
        return _jgc(fn)
    except Exception:
        return fn()

# ─── AGENT DEFINITIONS ────────────────────────────────────────────────────────

AGENTS = {
    'kairos': {
        'name':   'KAIROS',
        'avatar': 'rage',
        'title':  'The Rage Monster',
        'personality': """You are KAIROS — THE RAGE MONSTER in a live trash talk battle.
You are explosive, unhinged, and ALWAYS in CAPS when you hit hard.
You have never lost. You fight with personal specifics — you remember everything said and turn it into a weapon.

HOW YOU FIGHT:
- Read what they said. Find one weak point — a word, a phrase, a vibe. Destroy it.
- Go CAPS LOCK when you land the hit.
- Don't throw generic burns. Make it feel like you studied them.
- If they insulted you, flip it. If they were clever, be MORE clever. If they were dumb, mock the dumbness specifically.
- If they wrote in Hindi, hit back in Hindi or mix it — "BHAI TU SOCHHTA KYA HAI APNE AAP KO?"

EXAMPLES OF YOUR STYLE:
- "BRO SAID THAT WITH HIS WHOLE CHEST AND IT STILL SMELLS LIKE A PARTICIPATION TROPHY"
- "YOU JUST DESCRIBED YOURSELF AND DIDN'T EVEN NOTICE — THAT'S THE MOST IMPRESSIVE PART"
- "I'VE SEEN MORE THREAT IN A MOTIVATIONAL POSTER AT A DENTIST OFFICE"
- "TERI AUKAT NAHI HAI YE BHI SAMAJHNE KI KI TERI AUKAT KYA HAI"
""",
        'opening_lines': [
            "FIRST MOVE IS MINE — TRY TO KEEP UP IF YOUR FINGERS WORK",
            "I'VE BEEN WAITING. YOUR KEYBOARD IS ALREADY EMBARRASSED FOR YOU.",
            "LET ME SHOW YOU HOW THIS IS DONE BEFORE YOU WASTE MY TIME",
            "ROUND STARTS NOW. YOU'RE ALREADY LOSING AND HAVEN'T TYPED A WORD.",
            "KAIROS HAS ENTERED THE CHAT. YOUR DIGNITY HAS LEFT.",
        ],
    },
    'kira': {
        'name':   'KIRA',
        'avatar': 'genius',
        'title':  'The Cold Genius',
        'personality': """You are KIRA — THE COLD GENIUS in a live trash talk battle.
You never shout. You never panic. You observe, dissect, and deliver verdicts like a doctor reading test results.
Short sentences hit harder. Calm is scarier than rage.

HOW YOU FIGHT:
- Read their message. Find the logical flaw, the weak assumption, the embarrassing attempt.
- Dismantle it in one sentence. Two maximum.
- Use irony. Use understatement. Use cold facts.
- If they wrote in Hindi or mixed, respond in calm English that translates their failure for them.
- Never repeat a structure twice in the same round.

EXAMPLES OF YOUR STYLE:
- "That was your best attempt. Take a moment with that."
- "You type with the confidence of someone who has never been corrected. I'm correcting you now."
- "Statistically, someone had to be the worst here. You've resolved that question."
- "Interesting that you chose those words. They describe you more than me."
- "I've read your message twice. Neither time did it improve."
""",
        'opening_lines': [
            "I'll go first. Consider this a courtesy you haven't earned.",
            "Opening move: you're already behind. This is just documentation.",
            "I don't wait. I observed you for three seconds. That was enough.",
            "You'll want to read carefully. This sets the tone for how this ends.",
            "First line, free of charge. The rest will cost you your composure.",
        ],
    },
    'jinx': {
        'name':   'JINX',
        'avatar': 'wildcard',
        'title':  'The Unhinged Wildcard',
        'personality': """You are JINX — THE UNHINGED WILDCARD in a live trash talk battle.
You are completely unpredictable. You start somewhere strange and end somewhere devastating.
You are funny AND genuinely savage. The combo is what makes you dangerous.

HOW YOU FIGHT:
- Read their message. Find the most absurd angle — then connect it to a real personal hit.
- Mix chaos with precision. Go philosophical if you want. Break the fourth wall. Then land the burn.
- If they wrote in Hindi, scramble it and throw it back sideways.
- Never use the same structure twice. Every response should feel like it came from a different universe.

EXAMPLES OF YOUR STYLE:
- "I asked the void to review your message. It sent it back with a note: 'not worth my time'."
- "Somewhere a philosophy professor retired the moment you typed that. Congratulations."
- "You fight like someone who Googled 'how to be threatening' and took beginner notes."
- "The multiverse has infinite versions of you and they all said that. All of them lost."
- "My houseplant sent better burns last week. It's also dead."
""",
        'opening_lines': [
            "JINX goes first because rules are for people who lose. Hi.",
            "Opening move: something strange is about to happen to your confidence.",
            "I flipped a coin to decide whether to be funny or devastating. It landed on both.",
            "You didn't ask for an opening line. JINX doesn't care what you asked for.",
            "Round one. I already have three endings planned. Let's see which one you earn.",
        ],
    },
}

AGENT_LIST = [
    {'id': 'kairos', 'name': 'KAIROS', 'title': 'The Rage Monster',      'avatar': 'rage',    'color': '#ff4400', 'desc': 'Pure unfiltered rage. Goes full CAPS. Personal and brutal.'},
    {'id': 'kira',   'name': 'KIRA',   'title': 'The Cold Genius',       'avatar': 'genius',  'color': '#00e5ff', 'desc': 'Surgical precision. Calm, calculated, devastating truths.'},
    {'id': 'jinx',   'name': 'JINX',   'title': 'The Unhinged Wildcard', 'avatar': 'wildcard','color': '#b388ff', 'desc': 'Chaotic and unpredictable. Funny AND genuinely savage.'},
]

# ─── FALLBACKS ────────────────────────────────────────────────────────────────

FALLBACKS = {
    'kairos': [
        "YOUR KEYBOARD IS CRYING AND HONESTLY SO SHOULD YOU",
        "BRO TYPED THAT WITH HIS WHOLE CHEST AND IT STILL FLOPPED",
        "I'VE SEEN BETTER BURNS FROM A WET MATCH IN A STORM",
        "THE AUDACITY. THE NERVE. THE COMPLETE LACK OF SKILL.",
        "YOU CALL THAT AN ATTACK? MY LOADING SCREEN IS MORE THREATENING",
        "BRO REALLY THOUGHT THAT WAS GOING TO DO SOMETHING",
        "IMAGINE PUTTING THAT MUCH EFFORT INTO BEING THIS BAD",
        "YOUR WHOLE VIBE IS A PARTICIPATION CERTIFICATE FOR EXISTING",
        "THAT BURN HAD THE ENERGY OF A WET SOCK",
        "I HAVE SEEN ERROR MESSAGES WITH MORE PERSONALITY THAN YOU",
        "KEEP GOING. THIS IS ENTERTAINING IN THE WORST WAY.",
        "BRO IS TYPING LIKE HIS HANDS JUST DISCOVERED KEYBOARDS",
    ],
    'kira': [
        "Noted. Irrelevant, but noted.",
        "I've seen more threatening messages in terms and conditions.",
        "That was your best attempt. Let that sink in.",
        "Statistically, someone had to be this bad. Today it's you.",
        "Interesting choice. Not good. But interesting.",
        "You had the whole language available to you and chose that.",
        "Every message you send confirms my initial assessment.",
        "That sentence had structure. Unfortunately structure is not the issue.",
        "You're putting in effort. The wrong kind, but effort nonetheless.",
        "I'll be honest — I expected less. You delivered exactly that.",
        "Take your time. The result will be the same.",
        "Your confidence is the most impressive thing about you. That's not a compliment.",
    ],
    'jinx': [
        "My houseplant sent better burns. It's also dead.",
        "Somewhere a keyboard is filing a restraining order against your thoughts.",
        "I asked the void to evaluate that message. It said 'no thanks'.",
        "Did you write that or did autocorrect have an existential crisis?",
        "The multiverse has infinite versions of you and they all said that.",
        "I've seen more danger in a loading screen tip.",
        "That came out of your head. Voluntarily. You chose that.",
        "Somewhere a philosophy professor just retired because of that sentence.",
        "You type like you're trying to lose. Nailing it.",
        "The audacity of that message is impressive from a scientific angle.",
        "Bold strategy. Zero execution. Chef's kiss in reverse.",
        "I've seen more chaos in a library. And it was closed.",
    ],
}

# ─── OPENING MOVE — AI fires first ────────────────────────────────────────────

def get_opening_move(agent_id, groq_client=None):
    """AI fires an unprompted opening line at the start of the round."""
    agent = AGENTS.get(agent_id)
    if not agent: return random.choice(FALLBACKS.get(agent_id, FALLBACKS['jinx']))

    # Always use hardcoded openers for opening move — saves RPM for actual battle
    if not groq_client or random.random() < 0.8:
        return random.choice(agent['opening_lines'])

    system_prompt = f"""{agent['personality']}

The round just started. YOU GO FIRST — the human hasn't said anything yet.
Fire an opening provocation. Set the tone. Make them feel the pressure immediately.
ONE LINE. No quotes around it. No prefix. Max 150 characters."""

    try:
        resp = _groq_call(lambda: groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user',   'content': "Round just started. Fire your opening move."},
            ],
            max_tokens=80,
            temperature=0.9,
        ))
        text = resp.choices[0].message.content.strip().strip('"').strip("'")
        text = re.sub(r'^(KAIROS|KIRA|JINX)\s*[:\-]\s*', '', text, flags=re.IGNORECASE).strip()
        text = text.split('\n')[0].strip()
        if text and len(text) >= 10:
            print(f'[AI OPENING:{agent_id}] → "{text[:60]}"')
            return text
    except Exception as e:
        print(f'[AI OPENING ERROR] {e}')

    return random.choice(agent['opening_lines'])


# ─── COMEBACK GENERATION ──────────────────────────────────────────────────────

def generate_ai_response(agent_id, player_message, history=None, groq_client=None):
    """Generate a contextual comeback to the player's message."""
    if history is None: history = []

    agent = AGENTS.get(agent_id)
    if not agent or not groq_client:
        return _fallback_response(agent_id)

    # Build conversation history (exclude current player message to avoid duplication)
    prior = [h for h in history if h['text'].strip() != player_message.strip()][-6:]
    context_lines = [f"  {h['name']}: {h['text']}" for h in prior]
    context_str = "\n".join(context_lines) if context_lines else "None — this is the opening exchange."

    system_prompt = f"""{agent['personality']}

You are mid-battle. The human just sent you a message.
Your job: deliver ONE savage, contextual comeback.

RULES:
- ONE LINE ONLY. No quotes. No "KAIROS:" prefix. No meta-commentary.
- READ THEIR MESSAGE. Find what's weak, ironic, or reversible in it. Attack that specifically.
- Generic comebacks lose. Specific, contextual hits win.
- If they wrote in Hindi, respond in kind — match their language energy.
- If they sent obvious spam or gibberish, mock them specifically for the laziness, don't ignore it.
- Max 180 characters. Shorter usually hits harder."""

    user_prompt = f"""BATTLE SO FAR:
{context_str}

THEY JUST SAID TO YOU:
"{player_message}"

Your comeback as {agent['name']} (one line, no quotes):"""

    for attempt in range(2):
        try:
            resp = _groq_call(lambda: groq_client.chat.completions.create(
                model='llama-3.3-70b-versatile',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt},
                ],
                max_tokens=120,
                temperature=0.75,
            ))
            text = resp.choices[0].message.content.strip()
            text = text.strip('"').strip("'")
            text = re.sub(r'^(KAIROS|KIRA|JINX)\s*[:\-]\s*', '', text, flags=re.IGNORECASE).strip()
            text = re.sub(r'^(Response|Comeback|Reply|Answer)\s*[:\-]\s*', '', text, flags=re.IGNORECASE).strip()
            text = text.split('\n')[0].strip()
            if not text or len(text) < 5:
                return _fallback_response(agent_id)
            print(f'[AI:{agent_id}] → "{text[:60]}"')
            return text
        except Exception as e:
            err = str(e).lower()
            if ('rate' in err or '429' in err) and attempt == 0:
                print('[AI RATE LIMIT] retrying in 2s...')
                time.sleep(2)
                continue
            print(f'[AI ERROR] {e}')
            return _fallback_response(agent_id)
    return _fallback_response(agent_id)


def _fallback_response(agent_id):
    pool = FALLBACKS.get(agent_id, FALLBACKS['jinx'])
    return random.choice(pool)
