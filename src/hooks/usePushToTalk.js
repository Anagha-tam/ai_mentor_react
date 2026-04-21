import { useEffect, useRef, useState } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { ConnectionState, RoomEvent } from 'livekit-client';

/**
 * Push-to-talk: the microphone stays muted by default once the LiveKit
 * session is connected. Holding Space (or calling the returned handlers
 * on a UI button) unmutes it; releasing re-mutes.
 *
 * Typing into an input/textarea/contenteditable swallows the Space key so
 * the user can still type normally.
 */
export function usePushToTalk({ enabled = true } = {}) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const [isTalking, setIsTalking] = useState(false);
  const spacePressedRef = useRef(false);
  const initializedRef = useRef(false);

  // Mute the mic once per session so the user has to explicitly hold to talk.
  // Wait until the Room is truly Connected (peer connection established) —
  // setMicrophoneEnabled before that races with the PC setup and produces
  // "publishing track {room: undefined}" / "createOffer with closed peer
  // connection" errors.
  useEffect(() => {
    if (!enabled || !room || !localParticipant || initializedRef.current) return;

    const tryMute = () => {
      if (initializedRef.current) return;
      if (room.state !== ConnectionState.Connected) return;
      initializedRef.current = true;
      // Small defer: even after the Connected event fires, the PC may still
      // be wiring its first negotiation. One microtask is enough to avoid
      // the race in practice.
      setTimeout(() => {
        void localParticipant.setMicrophoneEnabled(false).catch(() => {});
      }, 0);
    };

    tryMute();
    if (initializedRef.current) return () => {};

    const onConnected = () => tryMute();
    room.on(RoomEvent.Connected, onConnected);
    return () => {
      room.off(RoomEvent.Connected, onConnected);
    };
  }, [enabled, room, localParticipant]);

  useEffect(() => {
    if (!enabled) return () => {};

    const isReady = () =>
      !!localParticipant && !!room && room.state === ConnectionState.Connected;

    const begin = async () => {
      if (!isReady()) return;
      setIsTalking(true);
      try {
        await localParticipant.setMicrophoneEnabled(true);
      } catch {
        setIsTalking(false);
      }
    };

    const end = async () => {
      setIsTalking(false);
      if (!isReady()) return;
      try {
        await localParticipant.setMicrophoneEnabled(false);
      } catch {
        // best effort
      }
    };

    const isEditableTarget = (target) => {
      if (!target) return false;
      const tag = target.tagName?.toLowerCase?.() || '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if (target.isContentEditable) return true;
      return false;
    };

    const onKeyDown = (event) => {
      if (event.code !== 'Space' || event.repeat || spacePressedRef.current) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      spacePressedRef.current = true;
      void begin();
    };

    const onKeyUp = (event) => {
      if (event.code !== 'Space') return;
      if (!spacePressedRef.current) return;
      event.preventDefault();
      spacePressedRef.current = false;
      void end();
    };

    const onBlur = () => {
      if (!spacePressedRef.current) return;
      spacePressedRef.current = false;
      void end();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [enabled, localParticipant, room]);

  // Expose manual controls so a UI button can drive the same behavior.
  const beginHold = async () => {
    if (!localParticipant || !room || room.state !== ConnectionState.Connected) return;
    setIsTalking(true);
    try { await localParticipant.setMicrophoneEnabled(true); }
    catch { setIsTalking(false); }
  };

  const endHold = async () => {
    setIsTalking(false);
    if (!localParticipant || !room || room.state !== ConnectionState.Connected) return;
    try { await localParticipant.setMicrophoneEnabled(false); } catch {}
  };

  return { isTalking, beginHold, endHold };
}
