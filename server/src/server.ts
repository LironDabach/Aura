import { loadEnv } from "./config/env";
import initApp from "./index";

loadEnv();

const port = process.env.PORT;

initApp()
  .then((app) => {
    app.listen(port, () => {
      console.log(`Listening at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize app:", error);
    process.exit(1);
  });
