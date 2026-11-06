import Joi from "joi";

export function validate(schema, property = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      error.isJoi = true;
      error.details = error.details.map((d) => d.message);
      return next(error);
    }

    req[property] = value;
    next();
  };
}

const uuidParamSchema = Joi.object({
  id: Joi.string().uuid({ version: ["uuidv4", "uuidv5"] }).required(),
});

// Validation schemas
export const schemas = {
  signup: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).max(128).required(),
    name: Joi.string().max(100).allow("", null).optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
  }),

  refresh: Joi.object({
    refresh_token: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().lowercase().required(),
  }),

  resetPassword: Joi.object({
    password: Joi.string().min(8).max(128).required(),
    access_token: Joi.string().required(),
    refresh_token: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().max(100).allow("", null).optional(),
    avatar_url: Joi.string().uri().allow("", null).optional(),
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(8).max(128).required(),
  }),

  resendVerification: Joi.object({
    email: Joi.string().email().lowercase().required(),
  }),

  createProject: Joi.object({
    name: Joi.string().min(1).max(120).required(),
    description: Joi.string().max(1000).allow("", null).optional(),
    repo_url: Joi.string().uri().allow("", null).optional(),
    repo_owner: Joi.string().max(100).allow("", null).optional(),
    repo_name: Joi.string().max(100).allow("", null).optional(),
    default_branch: Joi.string().max(50).default("main"),
    language: Joi.string().max(50).allow("", null).optional(),
    framework: Joi.string().max(50).allow("", null).optional(),
    visibility: Joi.string().valid("private", "public").default("private"),
  }),

  updateProject: Joi.object({
    name: Joi.string().min(1).max(120).optional(),
    description: Joi.string().max(1000).allow("", null).optional(),
    repo_url: Joi.string().uri().allow("", null).optional(),
    repo_owner: Joi.string().max(100).allow("", null).optional(),
    repo_name: Joi.string().max(100).allow("", null).optional(),
    default_branch: Joi.string().max(50).optional(),
    language: Joi.string().max(50).allow("", null).optional(),
    framework: Joi.string().max(50).allow("", null).optional(),
    visibility: Joi.string().valid("private", "public").optional(),
    status: Joi.string().valid("active", "archived", "paused").optional(),
  }),

  uuidParam: uuidParamSchema,

  projectQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(12),
    search: Joi.string().max(100).allow("", null).optional(),
    status: Joi.string().valid("active", "archived", "paused").optional(),
    visibility: Joi.string().valid("private", "public").optional(),
    sort: Joi.string().valid("created_at", "name", "updated_at").default("created_at"),
    order: Joi.string().valid("asc", "desc").default("desc"),
  }),

  pipelineQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    status: Joi.string().valid("pending", "running", "success", "failed", "cancelled").optional(),
  }),

  deploymentQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    environment: Joi.string().valid("development", "staging", "production").optional(),
    status: Joi.string().valid("pending", "in_progress", "success", "failed", "rolled_back").optional(),
  }),
};
