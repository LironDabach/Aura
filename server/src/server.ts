import initApp from "./index";

const port = process.env.PORT;

initApp().then((app) => {
  app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
  });
});
