import { collections } from "./database";
// Run daily
setInterval(async () => {
    try {
      await collections.tokenBlacklist?.deleteMany({
        expiresAt: { $lt: new Date() }
      });
    } catch (error) {
      console.error('Token cleanup error:', error);
    }
  }, 24 * 60 * 60 * 1000); 