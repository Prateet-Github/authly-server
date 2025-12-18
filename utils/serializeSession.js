import { parseAgent } from "./parseAgent.js";

 export const serializeSession = (session, currentTokenHash) => {
  const agent = parseAgent(session.userAgent);

  return {
    id: session._id,
    ipAddress: session.ipAddress,
    browser: agent.browser,
    os: agent.os,
    device: agent.device,
    current: session.tokenHash === currentTokenHash,
    lastUsedAt: session.lastUsedAt,
    createdAt: session.createdAt,
  };
};
