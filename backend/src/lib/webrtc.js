import "dotenv/config";
import twilio from "twilio";

// Get TURN/STUN server configuration
export const getIceServers = async () => {
  const iceServers = [];

  // Add public STUN servers (always available)
  iceServers.push(
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  );

  // Add Twilio TURN servers if credentials are available
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const token = await client.tokens.create();

      if (token.iceServers) {
        iceServers.push(...token.iceServers);
      }
    } catch (error) {
      console.error("Error fetching Twilio TURN servers:", error.message);
      // Continue with STUN servers only
    }
  }

  return iceServers;
};

// Controller to send ICE servers to frontend
export const getIceServersController = async (req, res) => {
  try {
    const iceServers = await getIceServers();
    res.status(200).json({ success: true, iceServers });
  } catch (error) {
    console.error("Error getting ICE servers:", error);
    res.status(500).json({ message: "Failed to get ICE servers" });
  }
};
