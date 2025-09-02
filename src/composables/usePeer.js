import { ref } from 'vue'
import { Peer } from 'peerjs'

// Simple PeerJS wrapper composable
// Usage:
// const { id, connectTo, sendTo, broadcast, on, off, destroy } = usePeer({ options })
export function usePeer(options = {}) {
  const peer = typeof window !== 'undefined' ? new Peer(options.peerId || undefined, options.peerOptions || {}) : null;
  const id = ref(null);
  const conns = new Map(); // peerId -> DataConnection

  // event listeners map: event -> Set(callback)
  const listeners = new Map();

  function emit(event, ...args) {
    const set = listeners.get(event);
    if (!set) return;
    for (const cb of set) cb(...args);
  }

  function on(event, cb) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(cb);
    return () => off(event, cb);
  }

  function off(event, cb) {
    const set = listeners.get(event);
    if (!set) return;
    set.delete(cb);
    if (set.size === 0) listeners.delete(event);
  }

  if (peer) {
    peer.on('open', (peerId) => {
      id.value = peerId;
      emit('open', peerId);
    });

    peer.on('connection', (conn) => {
      setupConn(conn);
      emit('connection', conn);
    });

    peer.on('disconnected', () => emit('disconnected'));
    peer.on('close', () => emit('close'));
    peer.on('error', (err) => emit('error', err));
  }

  function setupConn(conn) {
    if (!conn) return;
    conns.set(conn.peer, conn);

    conn.on('open', () => {
      emit('conn-open', conn);
    });

    conn.on('data', (data) => {
      // emit raw data and parsed JSON if possible
      emit('data', conn.peer, data);
    });

    conn.on('close', () => {
      conns.delete(conn.peer);
      emit('conn-close', conn.peer);
    });

    conn.on('error', (err) => emit('conn-error', conn.peer, err));
  }

  // connect to remote peerId and return the DataConnection
  function connectTo(peerId, opts = {}) {
    if (!peer) throw new Error('Peer not initialized');
    if (!peerId) throw new Error('peerId required');
    if (conns.has(peerId)) return conns.get(peerId);

    const conn = peer.connect(peerId, opts);
    setupConn(conn);
    return conn;
  }

  function sendTo(peerId, data) {
    const conn = conns.get(peerId);
    if (!conn || conn.open === false) return false;
    conn.send(data);
    return true;
  }

  function broadcast(data) {
    for (const [peerId, conn] of conns.entries()) {
      try {
        if (conn.open) conn.send(data);
      } catch (e) {
        // ignore per-conn errors
        emit('conn-error', peerId, e);
      }
    }
  }

  function destroy() {
    for (const conn of conns.values()) {
      try { conn.close(); } catch (e) {}
    }
    conns.clear();
    if (peer) {
      try { peer.destroy(); } catch (e) {}
    }
  }

  function listConnections() {
    return Array.from(conns.keys());
  }

  return {
    id,
    peer,
    conns,
    on,
    off,
    connectTo,
    sendTo,
    broadcast,
    destroy,
    listConnections,
  };
}

export default usePeer;
