import threading
import random
from datetime import datetime, timedelta

AGENT_NAMES = {'kairos': 'KAIROS', 'kira': 'KIRA', 'jinx': 'JINX'}


class RoomManager:
    def __init__(self):
        self._rooms = {}
        self._sid_to_room = {}
        self._matchmaking_queue = []
        self._pending_rejoin = {}
        self._lock = threading.Lock()

    def create_room(self, sid, name, avatar='rage', mode='standard'):
        room_id = self._generate_room_id()
        with self._lock:
            self._rooms[room_id] = {
                'id': room_id, 'status': 'waiting', 'mode': mode,
                'created_at': datetime.utcnow(),
                'players': {'p1': {'sid': sid, 'name': name, 'avatar': avatar}},
                'scores': {'p1': 0, 'p2': 0},
                'round_wins': {'p1': 0, 'p2': 0},
                'current_round': 1, 'round_active': False,
                'rematch_requests': set(),
                'round_history': [],  # stores last N messages for context
            }
            self._sid_to_room[sid] = room_id
        return room_id

    def add_player(self, room_id, sid, name, role, avatar='skull'):
        with self._lock:
            if room_id in self._rooms:
                self._rooms[room_id]['players'][role] = {'sid': sid, 'name': name, 'avatar': avatar}
                self._sid_to_room[sid] = room_id

    def create_ai_room(self, sid, name, avatar='rage', agent_id='kairos', mode='standard'):
        """Create a room where p2 is an AI agent, not a real player."""
        room_id = self._generate_room_id()
        with self._lock:
            self._rooms[room_id] = {
                'id': room_id, 'status': 'battle', 'mode': mode,
                'created_at': datetime.utcnow(),
                'players': {
                    'p1': {'sid': sid,     'name': name,       'avatar': avatar},
                    'p2': {'sid': 'AI',    'name': AGENT_NAMES.get(agent_id, 'AI'), 'avatar': agent_id, 'is_ai': True},
                },
                'scores': {'p1': 0, 'p2': 0},
                'round_wins': {'p1': 0, 'p2': 0},
                'current_round': 1, 'round_active': False,
                'rematch_requests': set(),
                'round_history': [],
                'full_round_history': [],
                'is_ai_room': True,
                'ai_role': 'p2',
                'ai_agent_id': agent_id,
            }
            self._sid_to_room[sid] = room_id
        return room_id
        with self._lock:
            cutoff = datetime.utcnow() - timedelta(seconds=60)
            self._matchmaking_queue = [
                e for e in self._matchmaking_queue
                if e['joined_at'] > cutoff and e['sid'] != sid
            ]
            if self._matchmaking_queue:
                opponent = self._matchmaking_queue.pop(0)
                room_id = self._generate_room_id()
                p1_sid, p1_name, p1_av = opponent['sid'], opponent['name'], opponent['avatar']
                p2_sid, p2_name, p2_av = sid, name, avatar
                self._rooms[room_id] = {
                    'id': room_id, 'status': 'waiting', 'mode': mode,
                    'created_at': datetime.utcnow(),
                    'players': {
                        'p1': {'sid': p1_sid, 'name': p1_name, 'avatar': p1_av},
                        'p2': {'sid': p2_sid, 'name': p2_name, 'avatar': p2_av}
                    },
                    'scores': {'p1': 0, 'p2': 0}, 'round_wins': {'p1': 0, 'p2': 0},
                    'current_round': 1, 'round_active': False, 'rematch_requests': set(),
                    'round_history': [],
                }
                self._sid_to_room[p1_sid] = room_id
                self._sid_to_room[p2_sid] = room_id
                return (room_id, p1_sid, p1_name, p1_av, p2_sid, p2_name, p2_av)
            else:
                self._matchmaking_queue.append({'sid': sid, 'name': name, 'avatar': avatar, 'joined_at': datetime.utcnow()})
                return None

    def remove_from_queue(self, sid):
        with self._lock:
            self._matchmaking_queue = [e for e in self._matchmaking_queue if e['sid'] != sid]

    def mark_disconnected(self, sid):
        with self._lock:
            room_id = self._sid_to_room.get(sid)
            if not room_id or room_id not in self._rooms:
                self._sid_to_room.pop(sid, None)
                return None
            room = self._rooms[room_id]
            role = next((r for r, p in room['players'].items() if p['sid'] == sid), None)
            if not role:
                self._sid_to_room.pop(sid, None)
                return None
            name = room['players'][role]['name']
            avatar = room['players'][role].get('avatar', 'rage')
            self._pending_rejoin[f'{room_id}:{role}'] = {
                'old_sid': sid, 'room_id': room_id, 'role': role,
                'name': name, 'avatar': avatar,
                'expires_at': datetime.utcnow() + timedelta(seconds=15)
            }
            self._sid_to_room.pop(sid, None)
            return (room_id, role, name)

    def try_rejoin(self, new_sid, room_id, role):
        with self._lock:
            key = f'{room_id}:{role}'
            entry = self._pending_rejoin.get(key)
            if not entry: return None
            if datetime.utcnow() > entry['expires_at']:
                del self._pending_rejoin[key]
                return None
            if room_id not in self._rooms: return None
            room = self._rooms[room_id]
            if role in room['players']:
                room['players'][role]['sid'] = new_sid
                self._sid_to_room[new_sid] = room_id
                del self._pending_rejoin[key]
                return {
                    'room_id': room_id, 'role': role,
                    'name': room['players'][role]['name'],
                    'avatar': room['players'][role].get('avatar', 'rage'),
                    'status': room['status'], 'round': room['current_round'],
                    'round_active': room['round_active'],
                    'mode': room.get('mode', 'standard'),
                    'p1_name': room['players'].get('p1', {}).get('name', ''),
                    'p2_name': room['players'].get('p2', {}).get('name', ''),
                    'p1_avatar': room['players'].get('p1', {}).get('avatar', 'rage'),
                    'p2_avatar': room['players'].get('p2', {}).get('avatar', 'skull'),
                    'p1_score': room['scores']['p1'], 'p2_score': room['scores']['p2'],
                    'p1_round_wins': room['round_wins']['p1'], 'p2_round_wins': room['round_wins']['p2'],
                }
            return None

    def finalize_disconnect(self, room_id, role):
        with self._lock:
            if room_id not in self._rooms: return
            key = f'{room_id}:{role}'
            if key not in self._pending_rejoin: return
            del self._pending_rejoin[key]
            self._rooms[room_id]['players'].pop(role, None)
            if not self._rooms[room_id]['players']:
                del self._rooms[room_id]

    def cancel_rejoin(self, room_id, role):
        with self._lock:
            self._pending_rejoin.pop(f'{room_id}:{role}', None)

    def remove_player(self, room_id, sid):
        with self._lock:
            self._sid_to_room.pop(sid, None)
            if room_id in self._rooms:
                room = self._rooms[room_id]
                for role in ['p1', 'p2']:
                    if room['players'].get(role, {}).get('sid') == sid:
                        room['players'].pop(role, None)
                        break
                if not room['players']:
                    del self._rooms[room_id]

    def set_status(self, room_id, status):
        with self._lock:
            if room_id in self._rooms: self._rooms[room_id]['status'] = status

    def add_to_history(self, room_id, role, name, text):
        with self._lock:
            if room_id in self._rooms:
                h = self._rooms[room_id].setdefault('round_history', [])
                h.append({'role': role, 'name': name, 'text': text})
                # Keep only last 6 for context window
                if len(h) > 6:
                    self._rooms[room_id]['round_history'] = h[-6:]
                # Full history for best burn — uncapped
                full = self._rooms[room_id].setdefault('full_round_history', [])
                full.append({'role': role, 'name': name, 'text': text})

    def get_history(self, room_id):
        room = self._rooms.get(room_id)
        if not room: return []
        return list(room.get('round_history', []))

    def get_full_history(self, room_id):
        room = self._rooms.get(room_id)
        if not room: return []
        return list(room.get('full_round_history', []))

    def set_round_active(self, room_id, active):
        with self._lock:
            if room_id in self._rooms: self._rooms[room_id]['round_active'] = active

    def add_score(self, room_id, role, points):
        with self._lock:
            if room_id in self._rooms: self._rooms[room_id]['scores'][role] += points

    def add_round_win(self, room_id, role):
        with self._lock:
            if room_id in self._rooms: self._rooms[room_id]['round_wins'][role] += 1

    def start_next_round(self, room_id, round_num):
        with self._lock:
            if room_id in self._rooms:
                self._rooms[room_id]['current_round'] = round_num
                self._rooms[room_id]['scores'] = {'p1': 0, 'p2': 0}
                self._rooms[room_id]['round_active'] = True
                self._rooms[room_id]['round_history'] = []
                self._rooms[room_id]['full_round_history'] = []

    def request_rematch(self, room_id, sid):
        with self._lock:
            if room_id in self._rooms:
                self._rooms[room_id]['rematch_requests'].add(sid)
                sids = {p['sid'] for p in self._rooms[room_id]['players'].values()}
                return self._rooms[room_id]['rematch_requests'] >= sids
        return False

    def reset_room(self, room_id):
        with self._lock:
            if room_id in self._rooms:
                r = self._rooms[room_id]
                r['scores'] = {'p1': 0, 'p2': 0}
                r['round_wins'] = {'p1': 0, 'p2': 0}
                r['current_round'] = 1
                r['round_active'] = True
                r['status'] = 'battle'
                r['rematch_requests'] = set()
                r['round_history'] = []
                r['full_round_history'] = []
                # mode intentionally preserved across rematch

    def get_room(self, room_id): return self._rooms.get(room_id)
    def find_room_by_sid(self, sid): return self._sid_to_room.get(sid)
    def room_count(self): return len(self._rooms)

    def get_role_by_sid(self, room_id, sid):
        room = self._rooms.get(room_id)
        if not room: return None
        for role, player in room['players'].items():
            if player['sid'] == sid: return role
        return None

    def _generate_room_id(self):
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        while True:
            code = ''.join(random.choices(chars, k=4))
            if code not in self._rooms: return code
