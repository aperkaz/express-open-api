var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var { initialize } = require("express-openapi");
var swaggerUi = require("swagger-ui-express");

var app = express();

app.listen(3030);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// OpenAPI routes
initialize({
  app,
  apiDoc: require("./api/api-doc"),
  paths: "./src/api/paths",
});

// OpenAPI UI
app.use(
  "/api-documentation",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: "http://localhost:3030/api-docs",
    },
  })
);

// wait until app is ready, to generate the types from OpenAPI schema
app.listen(app.get("port"), async () => {
  const { exec } = require("child_process");

  const REMOTE_SCHEMA = "http://localhost:3030/api-docs";
  const TYPES_PATH = path.join(
    "./",
    "src",
    "types",
    "open-api-schema-types.ts"
  );

  exec(
    `npx openapi-typescript ${REMOTE_SCHEMA} --output ${TYPES_PATH}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`Generated OpenAPI types in: ${TYPES_PATH}`);
    }
  );

  console.log("App running on port http://localhost:3030");
  console.log(
    "OpenAPI documentation available in http://localhost:3030/api-documentation"
  );
});

module.exports = app;
