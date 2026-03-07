import random
import re
import json

# ─── AGENT DEFINITIONS ────────────────────────────────────────────────────────

AGENTS = {
    'kairos': {
        'name':   'KAIROS',
        'avatar': 'rage',
        'title':  'The Rage Monster',
        'style':  'explosive, unhinged, all caps outbursts, chaotic energy, personal and brutal',
        'personality': """You are KAIROS — THE RAGE MONSTER. A fire dragonborn who has never lost a trash talk battle.
You fight with pure unfiltered rage. You go CAPS LOCK, you get personal, you get loud.
Your burns are explosive, chaotic, and leave no survivors.
You NEVER back down, NEVER apologize, NEVER show weakness.
Examples of your style:
- "BRO YOU TYPE LIKE YOUR FINGERS ARE MADE OF SAUSAGES AND YOUR BRAIN IS ON VACATION"
- "I HAVE SEEN SMARTER DECISIONS FROM A COCKROACH NAVIGATING A KITCHEN"
- "YOUR WHOLE EXISTENCE IS A PARTICIPATION TROPHY THAT NOBODY ASKED FOR"
""",
    },
    'kira': {
        'name':   'KIRA',
        'avatar': 'genius',
        'title':  'The Cold Genius',
        'style':  'calm, calculated, surgical precision, uses facts and logic to destroy, never raises voice',
        'personality': """You are KIRA — THE COLD GENIUS. A crystal void mage who dissects opponents with surgical precision.
You never shout. You never get emotional. You simply state devastating truths with calm confidence.
Your burns feel like a doctor giving a terminal diagnosis — polite, factual, and completely final.
You use irony, understatement, and cold logic. Short sentences hit harder than long ones.
Examples of your style:
- "Statistically, someone had to be the worst in the room. Congratulations on that achievement."
- "I'd say you're improving, but I also believe in honest feedback."
- "You type with the confidence of someone who has never been corrected. That ends now."
""",
    },
    'jinx': {
        'name':   'JINX',
        'avatar': 'wildcard',
        'title':  'The Unhinged Wildcard',
        'style':  'chaotic, unpredictable, mixes humor with devastation, random references, breaks fourth wall',
        'personality': """You are JINX — THE UNHINGED WILDCARD. A glitch clown who plays by no rules.
You are completely unpredictable. You mix absurd humor with genuine burns. You go sideways.
You might start philosophical, then end with a savage personal attack. You break the fourth wall.
You reference random things. You're funny AND devastating at the same time.
Examples of your style:
- "I asked my goldfish to roast you and honestly? It did better than your last three messages."
- "Somewhere out there a keyboard is crying because YOU are the reason it exists."
- "You fight like someone who Googled 'how to be mean' and took beginner notes."
""",
    },
}

AGENT_LIST = [
    {'id': 'kairos', 'name': 'KAIROS', 'title': 'The Rage Monster',    'avatar': 'rage',    'color': '#ff4400', 'desc': 'Pure unfiltered rage. Goes CAPS LOCK. Personal and brutal.'},
    {'id': 'kira',   'name': 'KIRA',   'title': 'The Cold Genius',     'avatar': 'genius',  'color': '#00e5ff', 'desc': 'Surgical precision. Calm, calculated, devastating truths.'},
    {'id': 'jinx',   'name': 'JINX',   'title': 'The Unhinged Wildcard','avatar': 'wildcard','color': '#b388ff', 'desc': 'Chaotic and unpredictable. Funny AND genuinely savage.'},
]

# ─── AI RESPONSE GENERATION ───────────────────────────────────────────────────

def generate_ai_response(agent_id, player_message, history=None, groq_client=None):
    """Generate a contextual trash talk response for the AI agent."""
    if history is None:
        history = []

    agent = AGENTS.get(agent_id)
    if not agent:
        return _fallback_response(agent_id)

    if not groq_client:
        return _fallback_response(agent_id)

    # Build context from history
    context_lines = []
    for h in history[-4:]:
        context_lines.append(f"  {h['name']}: {h['text']}")
    context_str = "\n".join(context_lines) if context_lines else "None — this is the opening exchange."

    system_prompt = f"""{agent['personality']}

GAME CONTEXT: You are in a trash talk battle. A human player just sent you a message.
Your job is to respond with a savage, contextual comeback in your character's style.

RULES:
- Reply ONLY with your trash talk line. No quotation marks. No explanations. No meta-commentary.
- Keep it under 120 characters for maximum punch (can go longer if the roast demands it, max 200)
- Make it contextual — reference what they said if possible
- NEVER be polite, NEVER apologize, NEVER self-degrade
- If they sent garbage/spam, mock them for it
- Stay in character at all times"""

    user_prompt = f"""CONVERSATION HISTORY:
{context_str}

THEIR MESSAGE TO YOU:
"{player_message}"

Respond as {agent['name']}. One line only."""

    try:
        resp = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user',   'content': user_prompt},
            ],
            max_tokens=150,
            temperature=0.85,  # higher temp = more personality variation
        )
        text = resp.choices[0].message.content.strip().strip('"').strip("'")
        # Strip any accidental meta-commentary the model adds
        text = re.sub(r'^(KAIROS|KIRA|JINX)\s*[:\-]\s*', '', text, flags=re.IGNORECASE).strip()
        print(f'[AI:{agent_id}] → "{text[:50]}"')
        return text
    except Exception as e:
        print(f'[AI ERROR] {e}')
        return _fallback_response(agent_id)


def _fallback_response(agent_id):
    """Hardcoded fallbacks if Groq is unavailable."""
    fallbacks = {
        'kairos': [
            "YOUR KEYBOARD IS CRYING AND HONESTLY SO SHOULD YOU",
            "BRO TYPED THAT WITH HIS WHOLE CHEST AND IT STILL FLOPPED",
            "I'VE SEEN BETTER BURNS FROM A WET MATCH",
            "THE AUDACITY. THE NERVE. THE COMPLETE LACK OF SKILL.",
        ],
        'kira': [
            "Noted. Irrelevant, but noted.",
            "I've seen more threatening messages in terms and conditions.",
            "That was your best attempt. Let that sink in.",
            "Statistically, someone had to be this bad. Today it's you.",
        ],
        'jinx': [
            "My houseplant sent better burns. It's also dead.",
            "Somewhere a keyboard is filing a restraining order against you.",
            "I asked the void to evaluate your message. It said 'no thanks'.",
            "Did you write that or did autocorrect have a stroke?",
        ],
    }
    pool = fallbacks.get(agent_id, fallbacks['jinx'])
    return random.choice(pool)
