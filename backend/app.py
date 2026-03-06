import os
import uuid
import time
import threading
from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from rooms import RoomManager
from judge import judge_message

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'kw-dev-secret')
CORS(app, origins="*")
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading', logger=False, engineio_logger=False)
room_manager = RoomManager()

ROUND_TIME = 30
ROUNDS_TO_WIN = 3
MAX_ROUNDS = 5

def run_round_timer(room_id):
    room = room_manager.get_room(room_id)
    if not room: return
    for remaining in range(ROUND_TIME, -1, -1):
        room = room_manager.get_room(room_id)
        if not room or room.get('status') != 'battle' or room.get('round_active') is False: return
        socketio.emit('timer_tick', {'seconds': remaining}, room=room_id)
        if remaining == 0:
            end_round(room_id)
            return
        time.sleep(1)

def end_round(room_id):
    room = room_manager.get_room(room_id)
    if not room or not room.get('round_active'): return
    room_manager.set_round_active(room_id, False)
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
    match_over = (p1_wins >= ROUNDS_TO_WIN or p2_wins >= ROUNDS_TO_WIN or current_round >= MAX_ROUNDS)
    winner_name = ''
    if winner_role == 'p1': winner_name = room['players']['p1']['name']
    elif winner_role == 'p2': winner_name = room['players']['p2']['name']
    socketio.emit('round_end', {'winner_role': winner_role, 'winner_name': winner_name, 'p1_score': p1_score, 'p2_score': p2_score, 'p1_round_wins': p1_wins, 'p2_round_wins': p2_wins, 'match_over': match_over}, room=room_id)
    if match_over:
        match_winner = room['players']['p1']['name'] if p1_wins > p2_wins else (room['players']['p2']['name'] if p2_wins > p1_wins else 'TIE')
        def delayed_match_end():
            time.sleep(3.5)
            socketio.emit('match_end', {'winner': match_winner, 'p1_wins': p1_wins, 'p2_wins': p2_wins, 'p1_name': room['players']['p1']['name'], 'p2_name': room['players']['p2']['name']}, room=room_id)
            room_manager.set_status(room_id, 'finished')
        threading.Thread(target=delayed_match_end, daemon=True).start()
    else:
        def delayed_next_round():
            time.sleep(3.5)
            r = room_manager.get_room(room_id)
            if not r: return
            next_round = r['current_round'] + 1
            room_manager.start_next_round(room_id, next_round)
            socketio.emit('round_start', {'round': next_round, 'p1_round_wins': r['round_wins']['p1'], 'p2_round_wins': r['round_wins']['p2']}, room=room_id)
            threading.Thread(target=run_round_timer, args=(room_id,), daemon=True).start()
        threading.Thread(target=delayed_next_round, daemon=True).start()

@socketio.on('connect')
def on_connect(): print(f'[+] {request.sid}')

@socketio.on('disconnect')
def on_disconnect():
    sid = request.sid
    room_id = room_manager.find_room_by_sid(sid)
    if room_id:
        room = room_manager.get_room(room_id)
        if room:
            role = room_manager.get_role_by_sid(room_id, sid)
            name = room['players'].get(role, {}).get('name', 'A player') if role else 'A player'
            emit('player_disconnected', {'player': name, 'message': f'{name} disconnected'}, room=room_id)
        room_manager.remove_player(room_id, sid)

@socketio.on('create_room')
def on_create_room(data):
    name = data.get('name', 'Fighter').strip()[:20]
    room_id = room_manager.create_room(request.sid, name)
    join_room(room_id)
    emit('room_created', {'room_id': room_id, 'role': 'p1', 'name': name})

@socketio.on('join_room_req')
def on_join_room(data):
    room_id = data.get('room_id', '').strip().upper()
    name = data.get('name', 'Fighter').strip()[:20]
    room = room_manager.get_room(room_id)
    if not room: emit('join_error', {'message': 'ROOM NOT FOUND. CHECK CODE.'}); return
    if room['status'] != 'waiting': emit('join_error', {'message': 'ROOM ALREADY IN BATTLE.'}); return
    if len(room['players']) >= 2: emit('join_error', {'message': 'ROOM IS FULL.'}); return
    room_manager.add_player(room_id, request.sid, name, 'p2')
    join_room(room_id)
    p1_name = room['players']['p1']['name']
    emit('room_joined', {'room_id': room_id, 'role': 'p2', 'name': name, 'opponent_name': p1_name})
    emit('opponent_joined', {'opponent_name': name, 'room_id': room_id}, room=room_id, include_self=False)
    room_manager.set_status(room_id, 'battle')
    room_manager.set_round_active(room_id, True)
    socketio.emit('battle_start', {'p1_name': p1_name, 'p2_name': name, 'round': 1}, room=room_id)
    threading.Thread(target=run_round_timer, args=(room_id,), daemon=True).start()

@socketio.on('join_matchmaking')
def on_join_matchmaking(data):
    name = data.get('name', 'Fighter').strip()[:20]
    matched = room_manager.matchmake(request.sid, name)
    if matched:
        room_id, p1_sid, p1_name, p2_sid, p2_name = matched
        join_room(room_id, sid=p1_sid); join_room(room_id, sid=p2_sid)
        socketio.emit('matched', {'room_id': room_id, 'role': 'p1', 'opponent_name': p2_name}, room=p1_sid)
        socketio.emit('matched', {'room_id': room_id, 'role': 'p2', 'opponent_name': p1_name}, room=p2_sid)
        socketio.emit('battle_start', {'p1_name': p1_name, 'p2_name': p2_name, 'round': 1}, room=room_id)
        room_manager.set_status(room_id, 'battle'); room_manager.set_round_active(room_id, True)
        threading.Thread(target=run_round_timer, args=(room_id,), daemon=True).start()
    else:
        emit('matchmaking_waiting', {'message': 'SEARCHING FOR OPPONENT...'})

@socketio.on('leave_matchmaking')
def on_leave_matchmaking():
    room_manager.remove_from_queue(request.sid)
    emit('matchmaking_cancelled')

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
    player_name = room['players'][role]['name']
    msg_id = str(uuid.uuid4())[:8]
    socketio.emit('new_message', {'msg_id': msg_id, 'role': role, 'name': player_name, 'text': text}, room=room_id)
    def judge_async():
        scores = judge_message(text)
        room_manager.add_score(room_id, role, scores['total'])
        socketio.emit('score_result', {'msg_id': msg_id, 'role': role, 'scores': scores}, room=room_id)
    threading.Thread(target=judge_async, daemon=True).start()

@socketio.on('rematch_request')
def on_rematch_request():
    room_id = room_manager.find_room_by_sid(request.sid)
    if not room_id: return
    ready = room_manager.request_rematch(room_id, request.sid)
    emit('rematch_requested', {}, room=room_id)
    if ready:
        room_manager.reset_room(room_id)
        r = room_manager.get_room(room_id)
        socketio.emit('battle_start', {'p1_name': r['players']['p1']['name'], 'p2_name': r['players']['p2']['name'], 'round': 1}, room=room_id)
        threading.Thread(target=run_round_timer, args=(room_id,), daemon=True).start()

@app.route('/health')
def health(): return {'status': 'ok', 'rooms': room_manager.room_count()}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
