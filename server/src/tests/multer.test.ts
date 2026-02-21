import request from "supertest";
import express, { Express } from "express";
import multerRoute from "../routes/multerRoute";

let app: Express;

beforeAll(() => {
  app = express();
  app.use("/api/upload", express.static("public/uploads"));
  app.use("/api/upload", multerRoute);
});

describe("File Tests", () => {
  test("upload file", async () => {
    const filePath = `${__dirname}/aura_test_file.png`;

    const uploadResponse = await request(app)
      .post("/api/upload")
      .attach("file", filePath);

    expect(uploadResponse.statusCode).toBe(200);
    expect(uploadResponse.body).toHaveProperty("url");

    const fullUrl: string = uploadResponse.body.url;
    const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");

    const fetchResponse = await request(app).get(relativeUrl);
    expect(fetchResponse.statusCode).toBe(200);
  });

  // test if username is added to the file name
  test("upload file with username", async () => {
    const filePath = `${__dirname}/aura_test_file.png`;
    const username = "testuser";

    const uploadResponse = await request(app)
      .post("/api/upload")
      .field("username", username)
      .attach("file", filePath);

    expect(uploadResponse.statusCode).toBe(200);
    expect(uploadResponse.body).toHaveProperty("url");

    const fullUrl: string = uploadResponse.body.url;
    const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");

    // Check if the filename contains the username
    expect(relativeUrl).toContain(username);

    const fetchResponse = await request(app).get(relativeUrl);
    expect(fetchResponse.statusCode).toBe(200);
  });

  test("upload file with special characters in name", async () => {
    const filePath = `${__dirname}/aura_test_file...name...with...dots.txt`;
    const username = "testuser";

    const uploadResponse = await request(app)
      .post("/api/upload")
      .field("username", username)
      .attach("file", filePath);

    expect(uploadResponse.statusCode).toBe(200);
    expect(uploadResponse.body).toHaveProperty("url");

    const fullUrl: string = uploadResponse.body.url;
    const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");

    // Check if the filename is sanitized (dots replaced with underscores)
    expect(relativeUrl).toContain("testuser-aura_test_file_name_with_dots");

    const fetchResponse = await request(app).get(relativeUrl);
    expect(fetchResponse.statusCode).toBe(200);
  });

  test("upload file without username", async () => {
    const filePath = `${__dirname}/aura_test_file.png`;

    const uploadResponse = await request(app)
      .post("/api/upload")
      .attach("file", filePath);

    expect(uploadResponse.statusCode).toBe(200);
    expect(uploadResponse.body).toHaveProperty("url");

    const fullUrl: string = uploadResponse.body.url;
    const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");

    // Check if the filename does not contain "undefined"
    expect(relativeUrl).not.toContain("undefined");

    const fetchResponse = await request(app).get(relativeUrl);
    expect(fetchResponse.statusCode).toBe(200);
  });

  test("upload file with empty username", async () => {
    const filePath = `${__dirname}/aura_test_file.png`;
    
    const uploadResponse = await request(app)
      .post("/api/upload")
      .field("username", "")
      .attach("file", filePath);

    expect(uploadResponse.statusCode).toBe(200);
    expect(uploadResponse.body).toHaveProperty("url");

    const fullUrl: string = uploadResponse.body.url;
    const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");

    // Check if the filename does not contain "undefined"
    expect(relativeUrl).not.toContain("undefined");

    const fetchResponse = await request(app).get(relativeUrl);
    expect(fetchResponse.statusCode).toBe(200);
  });

  test("uplaod file with only special characters in name", async () => {
    const filePath = `${__dirname}/aura_test_file...name...with...dots.txt`;
    const username = "testuser";
    
    const uploadResponse = await request(app)
      .post("/api/upload")
      .field("username", username)
      .attach("file", filePath);

    expect(uploadResponse.statusCode).toBe(200);
    expect(uploadResponse.body).toHaveProperty("url");

    const fullUrl: string = uploadResponse.body.url;
    const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");

    // Check if the filename is sanitized (dots replaced with underscores)
    expect(relativeUrl).toContain("testuser-aura_test_file_name_with_dots");

    const fetchResponse = await request(app).get(relativeUrl);
    expect(fetchResponse.statusCode).toBe(200);
  });

  test("upload file with no extension", async () => {
    const filePath = `${__dirname}/aura_test_file_no_extension`;
    const username = "testuser";

    const uploadResponse = await request(app)
      .post("/api/upload")
      .field("username", username)
      .attach("file", filePath);

    expect(uploadResponse.statusCode).toBe(200);
    expect(uploadResponse.body).toHaveProperty("url");

    const fullUrl: string = uploadResponse.body.url;
    const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");

    // Check if the filename contains the username and original name without extension
    expect(relativeUrl).toContain("testuser-aura_test_file_no_extension");

    const fetchResponse = await request(app).get(relativeUrl);
    expect(fetchResponse.statusCode).toBe(200);
  });

  test("upload file with multiple dots in name", async () => {
    const filePath = `${__dirname}/aura_test_file...name...with...multiple...dots.txt`;
    const username = "testuser";

    const uploadResponse = await request(app)
      .post("/api/upload")
      .field("username", username)
      .attach("file", filePath);

    expect(uploadResponse.statusCode).toBe(200);
    expect(uploadResponse.body).toHaveProperty("url");

    const fullUrl: string = uploadResponse.body.url;
    const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");

    // Check if the filename is sanitized (dots replaced with underscores)
    expect(relativeUrl).toContain("testuser-aura_test_file_name_with_multiple_dots");

    const fetchResponse = await request(app).get(relativeUrl);
    expect(fetchResponse.statusCode).toBe(200); 
    });

    test("upload file with special username characters", async () => {
      const filePath = `${__dirname}/aura_test_file.png`;
      const username = "testuser!@#$%^&*()";

      const uploadResponse = await request(app)
        .post("/api/upload")
        .field("username", username)
        .attach("file", filePath);

      expect(uploadResponse.statusCode).toBe(200);
      expect(uploadResponse.body).toHaveProperty("url");

      const fullUrl: string = uploadResponse.body.url;
      const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");

      // Check if the filename is sanitized (special characters replaced with underscores)
      expect(relativeUrl).toContain("testuser____________________");

      const fetchResponse = await request(app).get(relativeUrl);
      expect(fetchResponse.statusCode).toBe(200);
    });
});
