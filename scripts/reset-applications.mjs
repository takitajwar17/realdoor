import { execFileSync } from "node:child_process";

const WRANGLER = "pnpm";
const WRANGLER_BASE_ARGS = ["exec", "wrangler"];
const DB_NAME = "visa-document-checker-db";
const R2_BUCKET = "visa-documents";
const VECTORIZE_INDEX = "visa-document-chunks";
const VECTOR_DELETE_BATCH_SIZE = 128;

const targetArg = process.argv[2] ?? "both";
const dryRun = process.argv.includes("--dry-run");

const TARGETS = targetArg === "both" ? ["local", "remote"] : [targetArg];

if (!TARGETS.every((target) => target === "local" || target === "remote")) {
  console.error("Usage: node scripts/reset-applications.mjs [local|remote|both] [--dry-run]");
  process.exit(1);
}

function runWrangler(args, { allowFailure = false } = {}) {
  try {
    return execFileSync(WRANGLER, [...WRANGLER_BASE_ARGS, ...args], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (allowFailure) {
      return null;
    }

    const stderr = error.stderr?.toString?.().trim?.() ?? "";
    const stdout = error.stdout?.toString?.().trim?.() ?? "";
    const detail = stderr || stdout || error.message;
    throw new Error(detail);
  }
}

function targetFlags(target) {
  return target === "local" ? ["--local"] : ["--remote", "-y"];
}

function runD1Json(target, sql) {
  const output = runWrangler([
    "d1",
    "execute",
    DB_NAME,
    ...targetFlags(target),
    "--json",
    "--command",
    sql,
  ]);

  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function runD1(target, sql) {
  runWrangler([
    "d1",
    "execute",
    DB_NAME,
    ...targetFlags(target),
    "--command",
    sql,
  ]);
}

function getCount(target, table) {
  const [result] = runD1Json(target, `SELECT COUNT(*) AS count FROM ${table};`);
  return Number(result?.results?.[0]?.count ?? 0);
}

function listDocuments(target) {
  const [result] = runD1Json(
    target,
    "SELECT id, fileKey, chunkCount FROM uploaded_document ORDER BY id;",
  );

  return Array.isArray(result?.results) ? result.results : [];
}

function chunk(array, size) {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

function deleteR2Object(target, fileKey) {
  const args = [
    "r2",
    "object",
    "delete",
    `${R2_BUCKET}/${fileKey}`,
    ...targetFlags(target).filter((flag) => flag !== "-y"),
  ];
  runWrangler(args, { allowFailure: false });
}

function deleteRemoteVectors(vectorIds) {
  for (const batch of chunk(vectorIds, VECTOR_DELETE_BATCH_SIZE)) {
    runWrangler([
      "vectorize",
      "delete-vectors",
      VECTORIZE_INDEX,
      "--ids",
      ...batch,
    ]);
  }
}

function summarize(target, label) {
  return {
    target,
    label,
    users: getCount(target, "`user`"),
    applications: getCount(target, "visa_application"),
    applicants: getCount(target, "applicant"),
    checklistItems: getCount(target, "checklist_item"),
    uploadedDocuments: getCount(target, "uploaded_document"),
    evaluations: getCount(target, "document_evaluation"),
    chatConversations: getCount(target, "chat_conversation"),
    chatMessages: getCount(target, "chat_message"),
    memberships: getCount(target, "application_membership"),
    invitations: getCount(target, "application_invitation"),
    marketingEvents: getCount(target, "marketing_event"),
    marketingEnrollments: getCount(target, "marketing_sequence_enrollment"),
  };
}

function logSummary(summary) {
  console.log(`\n${summary.label} (${summary.target})`);
  for (const [key, value] of Object.entries(summary)) {
    if (key === "target" || key === "label") continue;
    console.log(`  ${key}: ${value}`);
  }
}

for (const target of TARGETS) {
  const before = summarize(target, "Before reset");
  logSummary(before);

  const documents = listDocuments(target);
  const vectorIds =
    target === "remote"
      ? documents.flatMap((doc) =>
          Number(doc.chunkCount) > 0
            ? Array.from({ length: Number(doc.chunkCount) }, (_, index) => `${doc.id}-${index}`)
            : [],
        )
      : [];

  console.log(`\nPreparing ${target} cleanup`);
  console.log(`  documents: ${documents.length}`);
  console.log(`  remoteVectorIds: ${vectorIds.length}`);
  console.log(`  dryRun: ${dryRun}`);

  if (!dryRun) {
    for (const doc of documents) {
      if (typeof doc.fileKey === "string" && doc.fileKey.length > 0) {
        deleteR2Object(target, doc.fileKey);
      }
    }

    if (target === "remote" && vectorIds.length > 0) {
      deleteRemoteVectors(vectorIds);
    }

    runD1(target, "DELETE FROM visa_application;");
  }

  const after = summarize(target, dryRun ? "After dry run" : "After reset");
  logSummary(after);

  if (!dryRun) {
    if (after.users !== before.users) {
      throw new Error(`${target}: user count changed from ${before.users} to ${after.users}`);
    }

    if (after.applications !== 0) {
      throw new Error(`${target}: visa_application still has ${after.applications} rows`);
    }
  }
}
