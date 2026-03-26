import { useEffect, useRef, useState, useMemo } from 'react';
import {
  useLocalParticipant,
  useVoiceAssistant,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

/**
 * LiveKit integration hook for the AI Mentor voice agent.
 * Manages agent state and audio levels. Chat + voice transcripts use `useSessionMessages` in ChatPanel.
 */
export const useMentorLiveKit = () => {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const {
    agent,
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack: agentVideoTrack,
  } = useVoiceAssistant();

  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [hasRemoteAudioTrack, setHasRemoteAudioTrack] = useState(false);

  const audioTrackRef = useRef(null);

  const tracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: false }
  );
  // Agent state transitions
  useEffect(() => {
    if (!agentState) return;

    switch (agentState) {
      case 'speaking':
        setIsAgentSpeaking(true);
        setIsUserSpeaking(false);
        break;
      case 'listening':
        setIsAgentSpeaking(false);
        break;
      case 'thinking':
      case 'idle':
        setIsAgentSpeaking(false);
        setIsUserSpeaking(false);
        break;
      default:
        break;
    }
  }, [agentState]);

  // User speaking detection
  useEffect(() => {
    if (agentState === 'listening' && tracks.length > 0) {
      setIsUserSpeaking(true);
    } else if (agentState !== 'listening') {
      setIsUserSpeaking(false);
    }
  }, [agentState, tracks]);

  // Track remote audio (agent) subscription
  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (track, _pub, participant) => {
      if (track.kind === Track.Kind.Audio && participant.identity !== localParticipant?.identity) {
        setHasRemoteAudioTrack(true);
        const mediaStreamTrack = track.mediaStreamTrack;
        if (mediaStreamTrack) {
          audioTrackRef.current = new MediaStream([mediaStreamTrack]);
        }
      }
    };

    const handleTrackUnsubscribed = (track) => {
      if (track.kind === Track.Kind.Audio) {
        setHasRemoteAudioTrack(false);
        audioTrackRef.current = null;
      }
    };

    room.on('trackSubscribed', handleTrackSubscribed);
    room.on('trackUnsubscribed', handleTrackUnsubscribed);

    return () => {
      room.off('trackSubscribed', handleTrackSubscribed);
      room.off('trackUnsubscribed', handleTrackUnsubscribed);
    };
  }, [room, localParticipant]);

  // Connection quality monitoring
  useEffect(() => {
    if (!room) return;

    const handleQualityChange = (quality, participant) => {
      if (participant === localParticipant) {
        setConnectionQuality(quality);
      }
    };

    room.on('connectionQualityChanged', handleQualityChange);
    return () => room.off('connectionQualityChanged', handleQualityChange);
  }, [room, localParticipant]);

  // Local mic track for visualizer
  const localMicTrack = useMemo(() => {
    return (
      localParticipant?.getTrackPublication?.(Track.Source.Microphone)?.track ?? null
    );
  }, [localParticipant, tracks]);

  return {
    agent,
    agentState,
    agentAudioTrack,
    agentVideoTrack,
    isAgentSpeaking,
    isUserSpeaking,
    connectionQuality,
    hasRemoteAudioTrack,
    localParticipant,
    localMicTrack,
    room,
  };
};
