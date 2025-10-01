-- Create tables only if they do not already exist, safe for production

CREATE TABLE IF NOT EXISTS "exam_question" (
  "id" SERIAL PRIMARY KEY,
  "question" VARCHAR(500) NOT NULL,
  "options" JSONB NOT NULL,
  "answer" VARCHAR(10) NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "exam_question_question_key" ON "exam_question"("question");
CREATE INDEX IF NOT EXISTS "exam_question_answer_idx" ON "exam_question"("answer");
CREATE INDEX IF NOT EXISTS "exam_question_created_at_idx" ON "exam_question"("created_at");

CREATE TABLE IF NOT EXISTS "Test" (
  "id" SERIAL PRIMARY KEY,
  "description" VARCHAR(100) NOT NULL
);


