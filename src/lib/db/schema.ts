import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  uuid,
  primaryKey,
  uniqueIndex,
  index,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

export const roleEnum = pgEnum("role", ["teacher", "student"]);

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  role: roleEnum("role"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  pinHash: text("pin_hash"),
  pinUpdatedAt: timestamp("pin_updated_at", { mode: "date" }),
  authKind: text("auth_kind").notNull().default("google"),
});

export const classCodes = pgTable("class_codes", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  label: text("label"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    ip: text("ip").notNull(),
    kind: text("kind").notNull(),
    attemptedAt: timestamp("attempted_at", { mode: "date" }).defaultNow().notNull(),
    succeeded: boolean("succeeded").notNull().default(false),
  },
  (t) => ({
    ipAttemptedIdx: index("login_attempts_ip_attempted_idx").on(
      t.ip,
      t.attemptedAt
    ),
  })
);

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({ compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }) })
);

export const stories = pgTable("stories", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: integer("difficulty").notNull().default(1),
  language: text("language").notNull().default("English"),
  imageStyle: text("image_style").notNull().default("watercolor"),
  voice: text("voice").notNull().default("female"),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  archivedAt: timestamp("archived_at", { mode: "date" }),
});

export const scenes = pgTable("scenes", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  storyId: uuid("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  subtitle: text("subtitle").notNull(),
  imagePrompt: text("image_prompt").notNull(),
  imageUrl: text("image_url"),
  audioUrl: text("audio_url"),
  order: integer("order").notNull(),
});

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: real("rating"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => ({
    uniqStudentStory: uniqueIndex("assignments_student_story_uniq").on(
      t.studentId,
      t.storyId
    ),
    assignedByIdx: index("assignments_assigned_by_idx").on(t.assignedBy),
  })
);

export const recordings = pgTable(
  "recordings",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    sceneId: uuid("scene_id")
      .notNull()
      .references(() => scenes.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    audioUrl: text("audio_url").notNull(),
    recordedAt: timestamp("recorded_at", { mode: "date" }).defaultNow().notNull(),
    aiScore: integer("ai_score"),
    aiFeedback: text("ai_feedback"),
    aiTranscript: text("ai_transcript"),
    aiEvaluatedAt: timestamp("ai_evaluated_at", { mode: "date" }),
  },
  (t) => ({
    uniqAssignmentScene: uniqueIndex("recordings_assignment_scene_uniq").on(
      t.assignmentId,
      t.sceneId
    ),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  stories: many(stories),
  assignmentsAsStudent: many(assignments, { relationName: "student" }),
  recordings: many(recordings),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  creator: one(users, {
    fields: [stories.creatorId],
    references: [users.id],
  }),
  scenes: many(scenes),
  assignments: many(assignments),
}));

export const scenesRelations = relations(scenes, ({ one, many }) => ({
  story: one(stories, {
    fields: [scenes.storyId],
    references: [stories.id],
  }),
  recordings: many(recordings),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  student: one(users, {
    fields: [assignments.studentId],
    references: [users.id],
    relationName: "student",
  }),
  story: one(stories, {
    fields: [assignments.storyId],
    references: [stories.id],
  }),
  recordings: many(recordings),
}));

export const recordingsRelations = relations(recordings, ({ one }) => ({
  assignment: one(assignments, {
    fields: [recordings.assignmentId],
    references: [assignments.id],
  }),
  scene: one(scenes, {
    fields: [recordings.sceneId],
    references: [scenes.id],
  }),
  student: one(users, {
    fields: [recordings.studentId],
    references: [users.id],
  }),
}));
