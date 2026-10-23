import { app } from "./app.js";
app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
  console.log("API prête sur le port " + (process.env.PORT || 3000)),
);
