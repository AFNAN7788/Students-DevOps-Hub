import { jest } from "@jest/globals";
import {
  AppError,
  sendSuccess,
  sendError,
  notFound,
  globalErrorHandler,
} from "../src/utils/errors.js";
import { schemas } from "../src/middleware/validate.js";

// Pure unit tests: no database, no Supabase, no network. These always run.

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

describe("error helpers", () => {
  it("AppError carries status, code and details", () => {
    const err = new AppError("Nope", 418, "TEAPOT", { a: 1 });
    expect(err).toBeInstanceOf(Error);
    expect(err.isAppError).toBe(true);
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe("TEAPOT");
    expect(err.details).toEqual({ a: 1 });
  });

  it("AppError defaults to a 500 INTERNAL_ERROR", () => {
    const err = new AppError("Boom");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.details).toBeNull();
  });

  it("sendSuccess wraps payload in the success envelope", () => {
    const res = mockRes();
    sendSuccess(res, { id: "x" }, 201);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ success: true, data: { id: "x" } });
  });

  it("sendError wraps errors in the failure envelope", () => {
    const res = mockRes();
    sendError(res, 400, "VALIDATION_ERROR", "Bad input", ["name is required"]);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Bad input",
        details: ["name is required"],
      },
    });
  });

  it("globalErrorHandler maps a Joi error to 400 VALIDATION_ERROR", () => {
    const res = mockRes();
    const joi = { isJoi: true, details: ["email must be valid"] };
    globalErrorHandler(joi, {}, res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("globalErrorHandler maps Prisma P2002 to 409 and P2025 to 404", () => {
    const resA = mockRes();
    globalErrorHandler({ code: "P2002" }, {}, resA, () => {});
    expect(resA.statusCode).toBe(409);
    expect(resA.body.error.code).toBe("DUPLICATE_RECORD");

    const resB = mockRes();
    globalErrorHandler({ code: "P2025" }, {}, resB, () => {});
    expect(resB.statusCode).toBe(404);
    expect(resB.body.error.code).toBe("RECORD_NOT_FOUND");
  });

  it("globalErrorHandler returns a 400 DATABASE_ERROR for other Prisma errors", () => {
    const res = mockRes();
    globalErrorHandler({ code: "P1001" }, {}, res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe("DATABASE_ERROR");
  });

  it("notFound forwards a ROUTE_NOT_FOUND AppError", () => {
    const next = jest.fn();
    notFound({ method: "GET", originalUrl: "/api/nope" }, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("ROUTE_NOT_FOUND");
  });
});

describe("Joi validation schemas", () => {
  const validate = (schema, value) =>
    schema.validate(value, { abortEarly: false, stripUnknown: true, convert: true });

  it("signup rejects invalid emails and short passwords", () => {
    expect(validate(schemas.signup, { email: "nope", password: "longenough" }).error).toBeTruthy();
    expect(validate(schemas.signup, { email: "a@b.com", password: "short" }).error).toBeTruthy();
    expect(validate(schemas.signup, { email: "a@b.com", password: "longenough" }).error).toBeFalsy();
  });

  it("signup lowercases the email and strips unknown fields", () => {
    const { error, value } = validate(schemas.signup, {
      email: "Student@Example.COM",
      password: "longenough",
      role: "admin",
    });
    expect(error).toBeFalsy();
    expect(value.email).toBe("student@example.com");
    expect(value.role).toBeUndefined();
  });

  it("createProject applies defaults", () => {
    const { error, value } = validate(schemas.createProject, { name: "Demo" });
    expect(error).toBeFalsy();
    expect(value.visibility).toBe("private");
    expect(value.default_branch).toBe("main");
  });

  it("createProject rejects an invalid visibility and non-URI repo_url", () => {
    expect(validate(schemas.createProject, { name: "X", visibility: "secret" }).error).toBeTruthy();
    expect(validate(schemas.createProject, { name: "X", repo_url: "not a url" }).error).toBeTruthy();
  });

  it("updateProject rejects an unknown status", () => {
    expect(validate(schemas.updateProject, { status: "deleted" }).error).toBeTruthy();
    expect(validate(schemas.updateProject, { status: "archived" }).error).toBeFalsy();
  });

  it("uuidParam accepts v4 and rejects non-UUIDs", () => {
    expect(validate(schemas.uuidParam, { id: "00000000-0000-4000-8000-000000000001" }).error).toBeFalsy();
    expect(validate(schemas.uuidParam, { id: "not-a-uuid" }).error).toBeTruthy();
  });

  it("projectQuery coerces page/limit and rejects unsafe sort values", () => {
    const ok = validate(schemas.projectQuery, { page: "2", limit: "10" });
    expect(ok.error).toBeFalsy();
    expect(ok.value.page).toBe(2);
    expect(ok.value.limit).toBe(10);

    expect(validate(schemas.projectQuery, { limit: "500" }).error).toBeTruthy();
    expect(validate(schemas.projectQuery, { sort: "owner_id" }).error).toBeTruthy();
    expect(validate(schemas.projectQuery, { order: "sideways" }).error).toBeTruthy();
  });

  it("changePassword requires a current password", () => {
    expect(validate(schemas.changePassword, { new_password: "longenough" }).error).toBeTruthy();
  });
});
