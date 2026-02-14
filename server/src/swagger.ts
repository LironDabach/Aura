import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

const buildSwaggerSpec = () => {
  const port = process.env.PORT || "3000";
  const serverUrl =
    process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

  const apis = [
    path.join(process.cwd(), "src", "routes", "*.ts"),
    path.join(__dirname, "routes", "*.js"),
  ];

  return swaggerJSDoc({
    definition: {
      openapi: "3.0.3",
      info: {
        title: "Advanced Web Applications REST API",
        version: "1.0.0",
        description:
          "REST API documentation for posts, comments, and authentication.",
      },
      servers: [
        {
          url: serverUrl,
          description: "Local server",
        },
      ],
      tags: [
        { name: "Auth", description: "Authentication and token management" },
        { name: "Posts", description: "Post CRUD operations" },
        { name: "Comments", description: "Comment CRUD operations" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Use a valid access token in the Authorization header.",
          },
        },
        schemas: {
          ErrorResponse: {
            type: "object",
            properties: {
              message: { type: "string", example: "Error message" },
            },
          },
          AuthTokens: {
            type: "object",
            properties: {
              token: { type: "string", example: "jwt-access-token-shiran-levi" },
              refreshToken: {
                type: "string",
                example: "jwt-refresh-token-liron-dabach",
              },
            },
            required: ["token", "refreshToken"],
          },
          RegisterRequest: {
            type: "object",
            properties: {
              username: { type: "string", example: "shiran_levi" },
              email: { type: "string", example: "shiran.levi@example.com" },
              password: { type: "string", example: "ShiranLevi123!" },
            },
            required: ["username", "email", "password"],
          },
          LoginRequest: {
            type: "object",
            properties: {
              username: { type: "string", example: "liron_dabach" },
              email: { type: "string", example: "liron.dabach@example.com" },
              password: { type: "string", example: "LironDabach123!" },
            },
            required: ["username", "email", "password"],
          },
          RefreshTokenRequest: {
            type: "object",
            properties: {
              refreshToken: {
                type: "string",
                example: "jwt-refresh-token-shiran-levi",
              },
            },
            required: ["refreshToken"],
          },
          Post: {
            type: "object",
            properties: {
              _id: { type: "string", example: "64f1c2a1b0c1c2d3e4f5a6b7" },
              title: { type: "string", example: "Shiran & Liron Project Update" },
              body: {
                type: "string",
                example: "Shiran Levi and Liron Dabach shipped Swagger docs.",
              },
              senderID: { type: "string", example: "64f1c2a1b0c1c2d3e4f5a6b8" },
            },
          },
          PostCreate: {
            type: "object",
            properties: {
              title: { type: "string", example: "Liron Dabach: API Notes" },
              body: {
                type: "string",
                example: "Shiran Levi reviewed the post routes.",
              },
            },
            required: ["title", "body"],
          },
          PostUpdate: {
            type: "object",
            properties: {
              title: { type: "string", example: "Shiran Levi: Updated Title" },
              body: { type: "string", example: "Liron Dabach updated body." },
            },
          },
          Comment: {
            type: "object",
            properties: {
              _id: { type: "string", example: "64f1c2a1b0c1c2d3e4f5a6b9" },
              postID: { type: "string", example: "64f1c2a1b0c1c2d3e4f5a6b7" },
              userID: { type: "string", example: "64f1c2a1b0c1c2d3e4f5a6b8" },
              content: { type: "string", example: "Nice work, Shiran and Liron!" },
            },
          },
          CommentCreate: {
            type: "object",
            properties: {
              postID: { type: "string", example: "64f1c2a1b0c1c2d3e4f5a6b7" },
              content: { type: "string", example: "Great job, Shiran Levi!" },
            },
            required: ["postID", "content"],
          },
          CommentUpdate: {
            type: "object",
            properties: {
              content: { type: "string", example: "Thanks, Liron Dabach!" },
            },
          },
        },
      },
    },
    apis,
  });
};

const customCss = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap');
  :root {
    --accent: #0ea5e9;
    --accent-strong: #0284c7;
    --bg: #0f172a;
    --surface: #111827;
    --text: #e2e8f0;
    --muted: #94a3b8;
  }
  body {
    margin: 0;
    font-family: 'Manrope', system-ui, sans-serif;
    background: radial-gradient(1200px 600px at 10% 0%, #0b1224 0%, #0f172a 55%, #0b1120 100%);
  }
  .swagger-ui .topbar {
    background: linear-gradient(90deg, #0b1224 0%, #0f172a 60%, #111827 100%);
    box-shadow: 0 6px 24px rgba(2, 8, 23, 0.6);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }
  .swagger-ui .topbar .download-url-wrapper input[type="text"] {
    background: #0b1224;
    color: var(--text);
    border: 1px solid rgba(148, 163, 184, 0.3);
  }
  .swagger-ui .topbar .download-url-wrapper .download-url-button {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  .swagger-ui .info .title {
    font-weight: 700;
    color: var(--text);
  }
  .swagger-ui .info .description {
    color: var(--muted);
  }
  .swagger-ui .scheme-container {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 14px;
    box-shadow: 0 8px 28px rgba(2, 8, 23, 0.35);
  }
  .swagger-ui .opblock {
    background: rgba(2, 6, 23, 0.7);
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 10px 30px rgba(2, 8, 23, 0.35);
  }
  .swagger-ui .opblock .opblock-summary-description {
    color: var(--muted);
  }
  .swagger-ui .opblock .opblock-summary-method {
    border-radius: 8px;
  }
  .swagger-ui .btn {
    background: var(--accent);
    border-color: var(--accent);
    border-radius: 8px;
  }
  .swagger-ui .btn.authorize {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
  }
  .swagger-ui .model-box {
    border-radius: 12px;
  }
  .swagger-ui select, .swagger-ui input, .swagger-ui textarea {
    background: #0b1224;
    color: var(--text);
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }
`;

const uiOptions = {
  customSiteTitle: "Advanced Web API Docs",
  customCss,
  swaggerOptions: {
    docExpansion: "none",
    defaultModelsExpandDepth: -1,
    persistAuthorization: true,
    displayRequestDuration: true,
  },
};

export const setupSwagger = (app: Express) => {
  const spec = buildSwaggerSpec();

  app.get("/api-docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(spec);
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec, uiOptions));
};
