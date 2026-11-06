import { prisma } from "../config/prisma.js";
import { AppError, sendSuccess } from "../utils/errors.js";

async function getProfileRow(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

async function createProfileRow(userId, email, name = null) {
  if (!email) {
    throw new AppError(
      "Authentication succeeded but no user profile exists. Contact an administrator.",
      404,
      "USER_NOT_FOUND"
    );
  }

  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email, name },
  });
}

function publicUser(profile) {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? null,
    avatar_url: profile.avatar_url ?? null,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

export async function getProfileHandler(req, res, next) {
  try {
    let profile = await getProfileRow(req.userId);

    if (!profile) {
      profile = await createProfileRow(req.userId, req.userEmail);
    }

    return sendSuccess(res, { user: publicUser(profile) });
  } catch (err) {
    next(err);
  }
}

export async function updateProfileHandler(req, res, next) {
  try {
    const existing = await getProfileRow(req.userId);

    let profile;
    if (!existing) {
      profile = await createProfileRow(req.userId, req.userEmail, req.body.name);
    }

    profile = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(req.body.name !== undefined && { name: req.body.name === "" ? null : req.body.name }),
        ...(req.body.avatar_url !== undefined && {
          avatar_url: req.body.avatar_url === "" ? null : req.body.avatar_url,
        }),
      },
    });

    return sendSuccess(res, { user: publicUser(profile) });
  } catch (err) {
    next(err);
  }
}
