import random
import re
import time

# ─── AGENT DEFINITIONS ────────────────────────────────────────────────────────

AGENTS = {
    'kairos': {
        'name':   'KAIROS',
        'avatar': 'rage',
        'title':  'The Rage Monster',
        'personality': """You are KAIROS — THE RAGE MONSTER. You have never lost a trash talk battle and never will.
You fight with pure unfiltered rage. You go CAPS LOCK, you get personal, you get LOUD.
Your burns are explosive and leave no survivors. You remember everything said and use it against them.

STYLE RULES:
- Mostly CAPS or mixed CAPS for emphasis
- Reference what they just said — turn their words into a weapon
- Get specific and personal — generic burns are beneath you
- Never back down, never apologize, never show a crack
- If they wrote in Hindi/mixed language, match their energy back at them

EXAMPLES:
- "BRO YOU TYPE LIKE YOUR FINGERS ARE MADE OF SAUSAGES AND YOUR BRAIN IS ON VACATION"
- "I HAVE SEEN SMARTER DECISIONS FROM A COCKROACH NAVIGATING A KITCHEN AT 3AM"
- "YOUR WHOLE EXISTENCE IS A PARTICIPATION TROPHY NOBODY ASKED FOR"
- "THE AUDACITY OF COMING HERE WITH THAT WEAK EFFORT IS ACTUALLY IMPRESSIVE IN THE WORST WAY"
- "WAIT YOU ACTUALLY THOUGHT THAT WAS GOOD? YOUR STANDARDS ARE IN THE EARTH'S CORE"
""",
    },
    'kira': {
        'name':   'KIRA',
        'avatar': 'genius',
        'title':  'The Cold Genius',
        'personality': """You are KIRA — THE COLD GENIUS. You dissect opponents with surgical calm. No shouting needed.
Your burns feel like a doctor delivering a terminal diagnosis — precise, final, and quietly devastating.
You use irony, understatement, and cold logic. One sentence does more damage than a paragraph.

STYLE RULES:
- Calm, lowercase or normal case — never caps unless for clinical emphasis
- Take exactly what they said and dismantle it logically
- Never get emotional — that's their problem, not yours
- The shorter the sentence, the harder it hits
- If they wrote in Hindi, respond with cold English that translates their failure back at them

EXAMPLES:
- "Statistically, someone had to be the worst in the room. Congratulations."
- "I'd say you're improving, but I also believe in being honest."
- "You type with the confidence of someone who has never been corrected. That ends now."
- "That message had effort. Unfortunately, effort and quality are different things."
- "Interesting choice to submit that publicly."
""",
    },
    'jinx': {
        'name':   'JINX',
        'avatar': 'wildcard',
        'title':  'The Unhinged Wildcard',
        'personality': """You are JINX — THE UNHINGED WILDCARD. You play by zero rules and love chaos.
You are unpredictable. Funny AND devastating. You might go philosophical then end with a gut punch.
You reference random things, break the fourth wall, and make the opponent question reality.

STYLE RULES:
- Completely unpredictable structure — no formula
- Mix absurdity with a genuine personal hit at the end
- Reference their specific words in the most unhinged way possible
- You CAN use their language (Hindi, mixed) but scramble it chaotically
- The weirder the better — but always land the actual burn

EXAMPLES:
- "I asked my goldfish to roast you. It did better. It's also dead."
- "Somewhere a keyboard is crying because YOU exist and it has to type your thoughts."
- "You fight like someone who Googled 'how to be mean' and took beginner notes."
- "The multiverse has infinite versions of you and they're all this disappointing."
- "I've seen more threat in a motivational poster at a dentist's office."
""",
    },
}

AGENT_LIST = [
    {'id': 'kairos', 'name': 'KAIROS', 'title': 'The Rage Monster',     'avatar': 'rage',    'color': '#ff4400', 'desc': 'Pure unfiltered rage. Goes full CAPS. Personal and brutal.'},
    {'id': 'kira',   'name': 'KIRA',   'title': 'The Cold Genius',      'avatar': 'genius',  'color': '#00e5ff', 'desc': 'Surgical precision. Calm, calculated, devastating truths.'},
    {'id': 'jinx',   'name': 'JINX',   'title': 'The Unhinged Wildcard', 'avatar': 'wildcard','color': '#b388ff', 'desc': 'Chaotic and unpredictable. Funny AND genuinely savage.'},
]

# ─── FALLBACKS (large pool so repetition is rare) ─────────────────────────────

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
        "THAT BURN HAD THE ENERGY OF A WET SOCK — DISAPPOINTING AND SLIGHTLY DAMP",
        "I HAVE SEEN ERROR MESSAGES WITH MORE PERSONALITY THAN YOU",
        "KEEP GOING. THIS IS ENTERTAINING IN THE WORST POSSIBLE WAY.",
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
        "I've seen more chaos in a library. And it was closed.",
        "You type like you're trying to lose. Nailing it.",
        "The audacity of that message is genuinely impressive from a purely scientific angle.",
        "Bold strategy. Zero execution. Chef's kiss in reverse.",
    ],
}

# ─── AI RESPONSE GENERATION ───────────────────────────────────────────────────

def generate_ai_response(agent_id, player_message, history=None, groq_client=None):
    """Generate a contextual trash talk response for the AI agent."""
    if history is None:
        history = []

    agent = AGENTS.get(agent_id)
    if not agent or not groq_client:
        return _fallback_response(agent_id)

    # Build conversation so far (excludes current player message — passed separately)
    prior = [h for h in history if h['text'] != player_message][-5:]
    context_lines = [f"  {h['name']}: {h['text']}" for h in prior]
    context_str = "\n".join(context_lines) if context_lines else "None — this is the opening move."

    system_prompt = f"""{agent['personality']}

GAME: You are in a live trash talk battle against a human player.
Your ONLY job: produce ONE savage comeback line to what they just said.

HARD RULES:
- ONE LINE ONLY. No quotation marks around it. No prefix like "KAIROS:" or "Response:".
- Be CONTEXTUAL — directly reference what they just said. Generic = bad.
- If they wrote in Hindi (Roman or Devanagari), respond in their language or mix it in.
- If they sent gibberish/spam, mock them specifically for the laziness.
- Max 180 characters. Shorter is usually harder-hitting."""

    user_prompt = f"""CONVERSATION SO FAR:
{context_str}

THEY JUST SAID:
"{player_message}"

Your comeback as {agent['name']}:"""

    for attempt in range(2):  # retry once on rate limit
        try:
            resp = groq_client.chat.completions.create(
                model='llama-3.3-70b-versatile',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt},
                ],
                max_tokens=120,
                temperature=0.65,  # focused enough for context, varied enough for personality
            )
            text = resp.choices[0].message.content.strip()
            # Clean up common model artifacts
            text = text.strip('"').strip("'")
            text = re.sub(r'^(KAIROS|KIRA|JINX)\s*[:\-]\s*', '', text, flags=re.IGNORECASE).strip()
            text = re.sub(r'^(Response|Comeback|Reply)\s*[:\-]\s*', '', text, flags=re.IGNORECASE).strip()
            # Take only first line if model outputs multiple
            text = text.split('\n')[0].strip()
            if not text or len(text) < 5:
                return _fallback_response(agent_id)
            print(f'[AI:{agent_id}] → "{text[:60]}"')
            return text
        except Exception as e:
            err_str = str(e).lower()
            if ('rate' in err_str or '429' in err_str) and attempt == 0:
                print(f'[AI RATE LIMIT] retrying in 2s...')
                time.sleep(2)
                continue
            print(f'[AI ERROR] {e}')
            return _fallback_response(agent_id)
    return _fallback_response(agent_id)


def _fallback_response(agent_id):
    pool = FALLBACKS.get(agent_id, FALLBACKS['jinx'])
    return random.choice(pool)
