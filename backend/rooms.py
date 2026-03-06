import threading
import random
from datetime import datetime, timedelta


class RoomManager:
    def __init__(self):
        self._rooms = {}
        self._sid_to_room = {}
        self._matchmaking_queue = []
        self._lock = threading.Lock()

    def create_room(self, sid, name, avatar='rage'):
        room_id = self._generate_room_id()
        with self._lock:
            self._rooms[room_id] = {
                'id': room_id, 'status': 'waiting',
                'created_at': datetime.utcnow(),
                'players': {'p1': {'sid': sid, 'name': name, 'avatar': avatar}},
                'scores': {'p1': 0, 'p2': 0},
                'round_wins': {'p1': 0, 'p2': 0},
                'current_round': 1, 'round_active': False,
                'rematch_requests': set()
            }
            self._sid_to_room[sid] = room_id
        return room_id

    def add_player(self, room_id, sid, name, role, avatar='skull'):
        with self._lock:
            if room_id in self._rooms:
                self._rooms[room_id]['players'][role] = {'sid': sid, 'name': name, 'avatar': avatar}
                self._sid_to_room[sid] = room_id

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

    def matchmake(self, sid, name, avatar='rage'):
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
                    'id': room_id, 'status': 'waiting',
                    'created_at': datetime.utcnow(),
                    'players': {
                        'p1': {'sid': p1_sid, 'name': p1_name, 'avatar': p1_av},
                        'p2': {'sid': p2_sid, 'name': p2_name, 'avatar': p2_av}
                    },
                    'scores': {'p1': 0, 'p2': 0},
                    'round_wins': {'p1': 0, 'p2': 0},
                    'current_round': 1, 'round_active': False,
                    'rematch_requests': set()
                }
                self._sid_to_room[p1_sid] = room_id
                self._sid_to_room[p2_sid] = room_id
                return (room_id, p1_sid, p1_name, p1_av, p2_sid, p2_name, p2_av)
            else:
                self._matchmaking_queue.append({
                    'sid': sid, 'name': name, 'avatar': avatar,
                    'joined_at': datetime.utcnow()
                })
                return None

    def remove_from_queue(self, sid):
        with self._lock:
            self._matchmaking_queue = [e for e in self._matchmaking_queue if e['sid'] != sid]

    def get_room(self, room_id):
        return self._rooms.get(room_id)

    def find_room_by_sid(self, sid):
        return self._sid_to_room.get(sid)

    def get_role_by_sid(self, room_id, sid):
        room = self._rooms.get(room_id)
        if not room: return None
        for role, player in room['players'].items():
            if player['sid'] == sid: return role
        return None

    def set_status(self, room_id, status):
        with self._lock:
            if room_id in self._rooms:
                self._rooms[room_id]['status'] = status

    def set_round_active(self, room_id, active):
        with self._lock:
            if room_id in self._rooms:
                self._rooms[room_id]['round_active'] = active

    def add_score(self, room_id, role, points):
        with self._lock:
            if room_id in self._rooms:
                self._rooms[room_id]['scores'][role] = self._rooms[room_id]['scores'].get(role, 0) + points

    def add_round_win(self, room_id, role):
        with self._lock:
            if room_id in self._rooms:
                self._rooms[room_id]['round_wins'][role] = self._rooms[room_id]['round_wins'].get(role, 0) + 1

    def start_next_round(self, room_id, round_num):
        with self._lock:
            if room_id in self._rooms:
                self._rooms[room_id]['current_round'] = round_num
                self._rooms[room_id]['scores'] = {'p1': 0, 'p2': 0}
                self._rooms[room_id]['round_active'] = True

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

    def room_count(self):
        return len(self._rooms)

    def _generate_room_id(self):
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        while True:
            code = ''.join(random.choices(chars, k=4))
            if code not in self._rooms:
                return code
