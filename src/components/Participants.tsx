import {
  ParticipantView,
  StreamVideoParticipant,
} from "@stream-io/video-react-sdk";

export const MyParticipantList = (props: {
  participants: StreamVideoParticipant[];
}) => {
  const {participants} = props;

  return (
    <div style={{display: "flex", flexDirection: "row", gap: "8px"}}>
      {participants.map((participant) => (
        <ParticipantView
          participant={participant}
          key={participant.sessionId}
        />
      ))}
    </div>
  );
};

export const MyFloatingLocalParticipant = (props: {
  participant?: StreamVideoParticipant;
}) => {
  const {participant} = props;

  if (!participant) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: "15px",
        left: "15px",
        width: "240px",
        height: "135px",
        boxShadow: "rgba(0, 0, 0, 0.1) 0px 0px 10px 3px",
        borderRadius: "12px",
      }}>
      <ParticipantView participant={participant} key={participant.sessionId} />
    </div>
  );
};
