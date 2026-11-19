import "dotenv/config";
import { app } from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { startMediaSyncRetries } from "./src/services/mediaSync.service.js";

const PORT = process.env.PORT || 3000;

await connectDB();
startMediaSyncRetries();

app.listen(PORT, () => {
  console.log(`Server is running on port number: ${PORT}`);
});
