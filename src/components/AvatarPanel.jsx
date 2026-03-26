import React from 'react';
import { VideoTrack } from '@livekit/components-react';
import { Bot } from 'lucide-react';
import VoiceActivityIndicator from './VoiceActivityIndicator';

/**
 * Right pane — renders the avatar video track published by the LiveKit
 * avatar worker participant (e.g. Hedra, Tavus, Simli, etc.).
 * `useVoiceAssistant().videoTrack` provides the track reference automatically.
 */
const AvatarPanel = ({
  agent,
  videoTrack,
  isAgentSpeaking,
  isUserSpeaking,
  agentState,
  isConnected,
}) => {
  const isAgentPresent = !!agent;
  const hasVideo = !!videoTrack;

  return (
    <div className="relative flex flex-col h-full bg-muted/30 overflow-hidden">
      {/* Avatar Video */}
      <div className="flex-1 flex items-center justify-center relative">
        {!isAgentPresent && isConnected && <AvatarWaiting />}
        {!isConnected && <AvatarConnecting />}
        
        {isAgentPresent && !hasVideo && (
           <div className="flex flex-col items-center gap-4 text-center px-6">
             <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
               <Bot className="w-10 h-10 text-primary animate-pulse" />
             </div>
             <p className="text-sm text-muted-foreground font-medium">Agent Joined (Audio Only)</p>
           </div>
        )}

        {hasVideo && (
          <>
            <VideoTrack
              trackRef={videoTrack}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </>
        )}
      </div>

      {/* Voice activity bar */}
      <div className="absolute bottom-0 inset-x-0 px-5 py-4 flex items-center justify-between z-10">
        <VoiceActivityIndicator
          isActive={isAgentSpeaking}
          variant="agent"
          label={
            agentState === 'speaking'
              ? 'AI Speaking'
              : agentState === 'thinking'
                ? 'Thinking...'
                : agentState === 'listening'
                  ? 'Listening'
                  : ''
          }
          className={hasVideo ? '[&_span]:text-white' : ''}
        />

        <VoiceActivityIndicator
          isActive={isUserSpeaking}
          variant="user"
          label="You"
          className={hasVideo ? '[&_span]:text-white' : ''}
        />
      </div>
    </div>
  );
};

const AvatarWaiting = () => (
  <div className="flex flex-col items-center gap-4 text-center px-6">
    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
    <p className="text-sm text-muted-foreground">Waiting for avatar to join...</p>
  </div>
);

const AvatarConnecting = () => (
  <div className="flex flex-col items-center gap-4 text-center px-6">
    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
    </div>
    <p className="text-sm text-muted-foreground">Connecting...</p>
  </div>
);

export default AvatarPanel;
