import os
import uuid
import time
import random
import threading
import urllib.request
from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
from rooms import RoomManager
from judge import judge_message, get_best_burn
from ai_agents import AGENT_LIST, generate_ai_response, get_opening_move

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'kw-dev-secret')
CORS(app, origins="*")
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading', logger=False, engineio_logger=False)
room_manager = RoomManager()

# ─── MATCH MODES ──────────────────────────────────────────────────────────────

MATCH_MODES = {
    'blitz':    {'label': '⚡ BLITZ',     'round_time': 20, 'rounds_to_win': 2, 'max_rounds': 3},
    'standard': {'label': '⚔️ STANDARD',  'round_time': 45, 'rounds_to_win': 3, 'max_rounds': 5},
    'big_brain':{'label': '🧠 BIG BRAIN', 'round_time': 90, 'rounds_to_win': 2, 'max_rounds': 3},
}
DEFAULT_MODE = 'standard'

def get_mode(room):
    return MATCH_MODES.get(room.get('mode', DEFAULT_MODE), MATCH_MODES[DEFAULT_MODE])

# ─── ONLINE COUNT ─────────────────────────────────────────────────────────────

online_sids = set()
online_lock = threading.Lock()

def broadcast_online_count():
    with online_lock:
        count = len(online_sids)
    socketio.emit('online_count', {'count': count})

# ─── KEEP ALIVE ───────────────────────────────────────────────────────────────

def keep_alive():
    domain = os.environ.get('RAILWAY_PUBLIC_DOMAIN', '')
    if not domain: return
    url = f'https://{domain}/health'
    while True:
        time.sleep(600)
        try:
            urllib.request.urlopen(url, timeout=10)
            print(f'[PING] {url}')
        except Exception as e:
            print(f'[PING] fail: {e}')

threading.Thread(target=keep_alive, daemon=True).start()

# ─── TIMER ────────────────────────────────────────────────────────────────────

def run_round_timer(room_id, countdown_delay=4):
    """Wait for frontend countdown animation to finish before starting the round clock."""
    time.sleep(countdown_delay)
    room = room_manager.get_room(room_id)
    if not room: return
    mode = get_mode(room)
    round_time = mode['round_time']

    for remaining in range(round_time, -1, -1):
        room = room_manager.get_room(room_id)
        if not room or room.get('status') != 'battle' or not room.get('round_active'):
            return
        socketio.emit('timer_tick', {'seconds': remaining}, room=room_id)
        if remaining == 0:
            end_round(room_id)
            return
        time.sleep(1)

def end_round(room_id):
    room = room_manager.get_room(room_id)
    if not room or not room.get('round_active'): return
    room_manager.set_round_active(room_id, False)

    mode = get_mode(room)
    rounds_to_win = mode['rounds_to_win']
    max_rounds = mode['max_rounds']

    p1_score = room['scores']['p1']
    p2_score = room['scores']['p2']

    if p1_score > p2_score:
        winner_role = 'p1'
        room_manager.add_round_win(room_id, 'p1')
    elif p2_score > p1_score:
        winner_role = 'p2'
        room_manager.add_round_win(room_id, 'p2')
    else:
        winner_role = 'tie'

    room = room_manager.get_room(room_id)
    p1_wins = room['round_wins']['p1']
    p2_wins = room['round_wins']['p2']
    current_round = room['current_round']
    match_over = (p1_wins >= rounds_to_win or p2_wins >= rounds_to_win or current_round >= max_rounds)

    winner_name = ''
    if winner_role == 'p1': winner_name = room['players']['p1']['name']
    elif winner_role == 'p2': winner_name = room['players']['p2']['name']

    socketio.emit('round_end', {
        'winner_role': winner_role, 'winner_name': winner_name,
        'p1_score': p1_score, 'p2_score': p2_score,
        'p1_round_wins': p1_wins, 'p2_round_wins': p2_wins,
        'match_over': match_over
    }, room=room_id)

    # Fire best burn async — arrives ~1s later, displayed on round-over screen
    full_history = room_manager.get_full_history(room_id)
    def emit_best_burn():
        burn = get_best_burn(full_history)
        if burn:
            socketio.emit('best_burn', burn, room=room_id)
    threading.Thread(target=emit_best_burn, daemon=True).start()

    if match_over:
        if p1_wins > p2_wins:
            match_winner = room['players']['p1']['name']
            match_winner_role = 'p1'
        elif p2_wins > p1_wins:
            match_winner = room['players']['p2']['name']
            match_winner_role = 'p2'
        else:
            match_winner = 'TIE'
            match_winner_role = 'tie'

        def delayed_match_end():
            time.sleep(3.5)
            r = room_manager.get_room(room_id)
            if not r: return
            socketio.emit('match_end', {
                'winner': match_winner,
                'winner_role': match_winner_role,
                'p1_wins': p1_wins, 'p2_wins': p2_wins,
                'p1_name': r['players'].get('p1', {}).get('name', ''),
                'p2_name': r['players'].get('p2', {}).get('name', ''),
            }, room=room_id)
            room_manager.set_status(room_id, 'finished')

        threading.Thread(target=delayed_match_end, daemon=True).start()
    else:
        def delayed_next_round():
            time.sleep(3.5)
            r = room_manager.get_room(room_id)
            if not r: return
            next_round = r['current_round'] + 1
            room_manager.start_next_round(room_id, next_round)
            m = get_mode(r)
            socketio.emit('round_start', {
                'round': next_round,
                'p1_round_wins': r['round_wins']['p1'],
                'p2_round_wins': r['round_wins']['p2'],
                'round_time': m['round_time'],
            }, room=room_id)
            threading.Thread(target=run_round_timer, args=(room_id, 4), daemon=True).start()
            if r.get('is_ai_room'):
                threading.Thread(target=_fire_ai_opening, args=(room_id,), daemon=True).start()

        threading.Thread(target=delayed_next_round, daemon=True).start()

# ─── SOCKET EVENTS ────────────────────────────────────────────────────────────

@socketio.on('connect')
def on_connect():
    with online_lock:
        online_sids.add(request.sid)
    broadcast_online_count()
    with online_lock:
        count = len(online_sids)
    emit('online_count', {'count': count})
    # Send available modes to client
    emit('modes_info', {'modes': {k: {'label': v['label'], 'round_time': v['round_time'], 'rounds_to_win': v['rounds_to_win'], 'max_rounds': v['max_rounds']} for k, v in MATCH_MODES.items()}})
    print(f'[+] {request.sid} ({count} online)')

@socketio.on('disconnect')
def on_disconnect():
    sid = request.sid
    with online_lock:
        online_sids.discard(sid)
    broadcast_online_count()

    result = room_manager.mark_disconnected(sid)
    if result:
        room_id, role, name = result
        # AI rooms: no reconnect flow — just clean up quietly
        room = room_manager.get_room(room_id)
        if room and room.get('is_ai_room'):
            room_manager.finalize_disconnect(room_id, role)
            return

        socketio.emit('opp_reconnecting', {
            'player': name,
            'message': f'{name} lost connection — waiting for reconnect...',
            'seconds': 15
        }, room=room_id)

        def delayed_disconnect():
            time.sleep(15)
            room = room_manager.get_room(room_id)
            if not room: return
            player = room['players'].get(role, {})
            if player.get('sid') == sid:
                room_manager.finalize_disconnect(room_id, role)
                socketio.emit('player_disconnected', {
                    'player': name, 'message': f'{name} disconnected'
                }, room=room_id)

        threading.Thread(target=delayed_disconnect, daemon=True).start()

    with online_lock:
        count = len(online_sids)
    print(f'[-] {sid} ({count} online)')

@socketio.on('rejoin_room')
def on_rejoin_room(data):
    room_id = data.get('room_id', '').strip().upper()
    role = data.get('role', '')
    sid = request.sid
    state = room_manager.try_rejoin(sid, room_id, role)
    if state:
        join_room(room_id)
        with online_lock:
            online_sids.add(sid)
        # Include mode info in rejoin
        room = room_manager.get_room(room_id)
        if room:
            m = get_mode(room)
            state['mode'] = room.get('mode', DEFAULT_MODE)
            state['round_time'] = m['round_time']
        emit('rejoin_success', state)
        socketio.emit('opp_reconnected', {'message': f'{state["name"]} reconnected!'}, room=room_id, include_self=False)
        print(f'[REJOIN] {state["name"]} rejoined {room_id}')
    else:
        emit('rejoin_failed', {'message': 'Could not rejoin — room may have ended.'})

@socketio.on('leave_room')
def on_leave_room():
    sid = request.sid
    room_id = room_manager.find_room_by_sid(sid)
    if room_id:
        room = room_manager.get_room(room_id)
        if room:
            role = room_manager.get_role_by_sid(room_id, sid)
            name = room['players'].get(role, {}).get('name', 'A player') if role else 'A player'
            room_manager.cancel_rejoin(room_id, role)
            room_manager.remove_player(room_id, sid)
            socketio.emit('player_disconnected', {
                'player': name, 'message': f'{name} left the battle'
            }, room=room_id)
    print(f'[LEAVE] {sid}')

@socketio.on('create_room')
def on_create_room(data):
    name = data.get('name', 'Fighter').strip()[:20]
    avatar = data.get('avatar', 'rage')
    mode = data.get('mode', DEFAULT_MODE)
    if mode not in MATCH_MODES:
        mode = DEFAULT_MODE
    room_id = room_manager.create_room(request.sid, name, avatar, mode)
    join_room(room_id)
    m = MATCH_MODES[mode]
    emit('room_created', {
        'room_id': room_id, 'role': 'p1', 'name': name,
        'mode': mode, 'mode_label': m['label'],
        'round_time': m['round_time'],
        'rounds_to_win': m['rounds_to_win'],
        'max_rounds': m['max_rounds'],
    })

@socketio.on('join_room_req')
def on_join_room(data):
    room_id = data.get('room_id', '').strip().upper()
    name = data.get('name', 'Fighter').strip()[:20]
    avatar = data.get('avatar', 'skull')
    room = room_manager.get_room(room_id)
    if not room: emit('join_error', {'message': 'ROOM NOT FOUND. CHECK CODE.'}); return
    if room['status'] != 'waiting': emit('join_error', {'message': 'ROOM ALREADY IN BATTLE.'}); return
    if len(room['players']) >= 2: emit('join_error', {'message': 'ROOM IS FULL.'}); return

    room_manager.add_player(room_id, request.sid, name, 'p2', avatar)
    join_room(room_id)
    p1 = room['players']['p1']
    m = get_mode(room)

    emit('room_joined', {
        'room_id': room_id, 'role': 'p2', 'name': name,
        'opponent_name': p1['name'], 'opponent_avatar': p1.get('avatar', 'rage'),
        'mode': room.get('mode', DEFAULT_MODE), 'mode_label': m['label'],
        'round_time': m['round_time'], 'rounds_to_win': m['rounds_to_win'], 'max_rounds': m['max_rounds'],
    })
    emit('opponent_joined', {
        'opponent_name': name, 'opponent_avatar': avatar, 'room_id': room_id
    }, room=room_id, include_self=False)

    room_manager.set_status(room_id, 'battle')
    room_manager.set_round_active(room_id, True)
    socketio.emit('battle_start', {
        'p1_name': p1['name'], 'p2_name': name, 'round': 1,
        'mode': room.get('mode', DEFAULT_MODE), 'mode_label': m['label'],
        'round_time': m['round_time'], 'rounds_to_win': m['rounds_to_win'], 'max_rounds': m['max_rounds'],
    }, room=room_id)
    threading.Thread(target=run_round_timer, args=(room_id,), daemon=True).start()

@socketio.on('join_matchmaking')
def on_join_matchmaking(data):
    name = data.get('name', 'Fighter').strip()[:20]
    avatar = data.get('avatar', 'rage')
    # Matchmaking always uses standard mode
    matched = room_manager.matchmake(request.sid, name, avatar, mode=DEFAULT_MODE)
    if matched:
        room_id, p1_sid, p1_name, p1_av, p2_sid, p2_name, p2_av = matched
        join_room(room_id, sid=p1_sid)
        join_room(room_id, sid=p2_sid)
        m = MATCH_MODES[DEFAULT_MODE]
        socketio.emit('matched', {'room_id': room_id, 'role': 'p1', 'opponent_name': p2_name, 'opponent_avatar': p2_av,
            'mode': DEFAULT_MODE, 'mode_label': m['label'], 'round_time': m['round_time'],
            'rounds_to_win': m['rounds_to_win'], 'max_rounds': m['max_rounds']}, room=p1_sid)
        socketio.emit('matched', {'room_id': room_id, 'role': 'p2', 'opponent_name': p1_name, 'opponent_avatar': p1_av,
            'mode': DEFAULT_MODE, 'mode_label': m['label'], 'round_time': m['round_time'],
            'rounds_to_win': m['rounds_to_win'], 'max_rounds': m['max_rounds']}, room=p2_sid)
        socketio.emit('battle_start', {
            'p1_name': p1_name, 'p2_name': p2_name, 'round': 1,
            'mode': DEFAULT_MODE, 'mode_label': m['label'],
            'round_time': m['round_time'], 'rounds_to_win': m['rounds_to_win'], 'max_rounds': m['max_rounds'],
        }, room=room_id)
        room_manager.set_status(room_id, 'battle')
        room_manager.set_round_active(room_id, True)
        threading.Thread(target=run_round_timer, args=(room_id,), daemon=True).start()
    else:
        emit('matchmaking_waiting', {'message': 'SEARCHING FOR OPPONENT...'})

@socketio.on('leave_matchmaking')
def on_leave_matchmaking():
    room_manager.remove_from_queue(request.sid)
    emit('matchmaking_cancelled')

# ─── AI BATTLE ────────────────────────────────────────────────────────────────

def _fire_ai_opening(room_id):
    """AI fires an unprompted opening line at the start of the round."""
    import time as _time
    # Wait for countdown to finish + tiny offset so it feels like AI is "watching"
    _time.sleep(5.5 + random.random() * 2)
    room = room_manager.get_room(room_id)
    if not room or not room.get('round_active'): return
    # Only fire if nobody has sent a message yet
    if room_manager.get_history(room_id): return

    agent_id  = room.get('ai_agent_id', 'kairos')
    ai_role   = room.get('ai_role', 'p2')
    ai_player = room['players'].get(ai_role, {})
    ai_name   = ai_player.get('name', 'AI')
    ai_avatar = ai_player.get('avatar', agent_id)

    from judge import groq_client
    opening = get_opening_move(agent_id, groq_client=groq_client)
    if not opening: return

    import uuid as _uuid
    msg_id = 'ai-open-' + str(_uuid.uuid4())[:8]

    socketio.emit('opponent_typing', {'role': ai_role}, room=room_id)
    _time.sleep(0.8)

    room = room_manager.get_room(room_id)
    if not room or not room.get('round_active'): return

    socketio.emit('new_message', {
        'msg_id': msg_id, 'role': ai_role,
        'name': ai_name, 'avatar': ai_avatar, 'text': opening
    }, room=room_id)
    room_manager.add_to_history(room_id, ai_role, ai_name, opening)

    from judge import judge_message
    scores = judge_message(opening, history=[], role=ai_role)
    room_manager.add_score(room_id, ai_role, scores['total'])
    socketio.emit('score_result', {
        'msg_id': msg_id, 'role': ai_role, 'scores': scores
    }, room=room_id)


def _fire_ai_response(room_id, player_text):
    """Generate and emit an AI agent response. Called in a background thread."""
    import time as _time
    room = room_manager.get_room(room_id)
    if not room or not room.get('round_active'): return

    agent_id  = room.get('ai_agent_id', 'kairos')
    ai_role   = room.get('ai_role', 'p2')
    ai_player = room['players'].get(ai_role, {})
    ai_name   = ai_player.get('name', 'AI')
    ai_avatar = ai_player.get('avatar', agent_id)

    # Realistic typing delay: 1.2–2.8s
    _time.sleep(1.2 + (hash(player_text) % 1000) / 600)

    # Re-check round is still active after delay
    room = room_manager.get_room(room_id)
    if not room or not room.get('round_active'): return

    # Get history for context
    history = room_manager.get_history(room_id)

    # Generate response via Groq
    from judge import groq_client
    ai_text = generate_ai_response(agent_id, player_text, history=history, groq_client=groq_client)
    if not ai_text: return

    import uuid as _uuid
    msg_id = 'ai-' + str(_uuid.uuid4())[:8]

    # Emit typing indicator first
    socketio.emit('opponent_typing', {'role': ai_role}, room=room_id)
    _time.sleep(0.7)

    # Re-check once more before emitting message
    room = room_manager.get_room(room_id)
    if not room or not room.get('round_active'): return

    # Emit the AI message
    socketio.emit('new_message', {
        'msg_id': msg_id, 'role': ai_role,
        'name': ai_name, 'avatar': ai_avatar, 'text': ai_text
    }, room=room_id)

    # Add to history
    room_manager.add_to_history(room_id, ai_role, ai_name, ai_text)

    # Judge the AI message
    ai_scores = judge_message(ai_text, history=history, role=ai_role)
    room_manager.add_score(room_id, ai_role, ai_scores['total'])
    socketio.emit('score_result', {
        'msg_id': msg_id, 'role': ai_role, 'scores': ai_scores
    }, room=room_id)


@socketio.on('join_ai_battle')
def on_join_ai_battle(data):
    name     = data.get('name', 'Fighter').strip()[:20]
    avatar   = data.get('avatar', 'rage')
    agent_id = data.get('agent_id', 'kairos')
    mode     = data.get('mode', DEFAULT_MODE)
    if mode not in MATCH_MODES: mode = DEFAULT_MODE

    room_id = room_manager.create_ai_room(request.sid, name, avatar, agent_id, mode)
    join_room(room_id)

    m         = MATCH_MODES[mode]
    room      = room_manager.get_room(room_id)
    ai_name   = room['players']['p2']['name']
    ai_avatar = room['players']['p2']['avatar']

    # Tell the client they joined — reuse existing room_joined event shape
    emit('room_joined', {
        'room_id': room_id, 'role': 'p1', 'name': name,
        'opponent_name': ai_name, 'opponent_avatar': ai_avatar,
        'mode': mode, 'mode_label': m['label'],
        'round_time': m['round_time'],
        'rounds_to_win': m['rounds_to_win'],
        'max_rounds': m['max_rounds'],
    })

    # Small delay so client processes room_joined before battle_start
    def start_ai_battle():
        time.sleep(0.1)
        room_manager.set_round_active(room_id, True)
        socketio.emit('battle_start', {
            'p1_name': name, 'p2_name': ai_name, 'round': 1,
            'mode': mode, 'mode_label': m['label'],
            'round_time': m['round_time'],
            'rounds_to_win': m['rounds_to_win'],
            'max_rounds': m['max_rounds'],
        }, room=room_id)
        threading.Thread(target=run_round_timer, args=(room_id,), daemon=True).start()
        # AI fires an opening move after countdown finishes (~5s)
        threading.Thread(target=_fire_ai_opening, args=(room_id,), daemon=True).start()

    threading.Thread(target=start_ai_battle, daemon=True).start()


@socketio.on('send_message')
def on_send_message(data):
    text = data.get('text', '').strip()[:200]
    if not text: return
    room_id = room_manager.find_room_by_sid(request.sid)
    if not room_id: return
    room = room_manager.get_room(room_id)
    if not room or not room.get('round_active'): return
    role = room_manager.get_role_by_sid(room_id, request.sid)
    if not role: return
    player = room['players'][role]
    msg_id = str(uuid.uuid4())[:8]
    socketio.emit('new_message', {
        'msg_id': msg_id, 'role': role,
        'name': player['name'], 'avatar': player.get('avatar', 'rage'), 'text': text
    }, room=room_id)
    # Grab history BEFORE adding current message (so context = what came before)
    history = room_manager.get_history(room_id)
    # Now add this message to history for future messages
    room_manager.add_to_history(room_id, role, player['name'], text)

    def judge_async():
        scores = judge_message(text, history=history, role=role)
        room_manager.add_score(room_id, role, scores['total'])
        socketio.emit('score_result', {'msg_id': msg_id, 'role': role, 'scores': scores}, room=room_id)
    threading.Thread(target=judge_async, daemon=True).start()

    # If AI room and the human just sent — trigger AI response
    if room.get('is_ai_room') and room.get('ai_role') != role:
        def ai_respond():
            _fire_ai_response(room_id, text)
        threading.Thread(target=ai_respond, daemon=True).start()

@socketio.on('typing')
def on_typing():
    room_id = room_manager.find_room_by_sid(request.sid)
    if not room_id: return
    role = room_manager.get_role_by_sid(room_id, request.sid)
    if not role: return
    # include_self=False means only the OTHER player gets this
    emit('opponent_typing', {'role': role}, room=room_id, include_self=False)

@socketio.on('rematch_request')
def on_rematch_request():
    room_id = room_manager.find_room_by_sid(request.sid)
    if not room_id: return
    room = room_manager.get_room(room_id)
    if not room: return

    # AI rooms: instant rematch, no need for both players to agree
    if room.get('is_ai_room'):
        room_manager.reset_room(room_id)
        r = room_manager.get_room(room_id)
        m = get_mode(r)
        socketio.emit('battle_start', {
            'p1_name': r['players']['p1']['name'],
            'p2_name': r['players']['p2']['name'], 'round': 1,
            'mode': r.get('mode', DEFAULT_MODE), 'mode_label': m['label'],
            'round_time': m['round_time'], 'rounds_to_win': m['rounds_to_win'], 'max_rounds': m['max_rounds'],
        }, room=room_id)
        threading.Thread(target=run_round_timer, args=(room_id,), daemon=True).start()
        threading.Thread(target=_fire_ai_opening, args=(room_id,), daemon=True).start()
        return

    ready = room_manager.request_rematch(room_id, request.sid)
    emit('rematch_requested', {}, room=room_id)
    if ready:
        room_manager.reset_room(room_id)
        r = room_manager.get_room(room_id)
        m = get_mode(r)
        socketio.emit('battle_start', {
            'p1_name': r['players']['p1']['name'],
            'p2_name': r['players']['p2']['name'], 'round': 1,
            'mode': r.get('mode', DEFAULT_MODE), 'mode_label': m['label'],
            'round_time': m['round_time'], 'rounds_to_win': m['rounds_to_win'], 'max_rounds': m['max_rounds'],
        }, room=room_id)
        threading.Thread(target=run_round_timer, args=(room_id,), daemon=True).start()

@app.route('/health')
def health():
    with online_lock:
        count = len(online_sids)
    return {'status': 'ok', 'rooms': room_manager.room_count(), 'online': count}

@app.route('/debug/judge')
def debug_judge():
    from judge import GROQ_AVAILABLE, judge_message, groq_client
    key = os.environ.get('GROQ_API_KEY', '')
    # Try a live groq call and capture any error
    groq_error = None
    if not GROQ_AVAILABLE and key:
        try:
            from groq import Groq
            c = Groq(api_key=key.strip())
            c.chat.completions.create(model='llama3-8b-8192', messages=[{'role':'user','content':'say ok'}], max_tokens=5)
        except Exception as e:
            groq_error = f'{type(e).__name__}: {e}'
    tests = [
        "I'm gay", "I give up", "you won bro",
        "main haar gaya", "tu jeet gaya bhai", "bhai tu better hai",
        "teri aukat nahi hai yahan aane ki",
        "tere baap ne bhi chhod diya tha tujhe",
        "you look like you eat cereal with water",
        "no wonder your dad left",
        "L", "ratio", "gg",
    ]
    results = [{'msg': t, **judge_message(t)} for t in tests]
    return {'groq_available': GROQ_AVAILABLE, 'key_present': bool(key), 'key_length': len(key), 'groq_error': groq_error, 'results': results}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
