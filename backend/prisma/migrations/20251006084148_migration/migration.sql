-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('passed', 'failed', 'absent');

-- CreateTable
CREATE TABLE "exam_record" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "exam_id" BIGINT NOT NULL,
    "subject" VARCHAR(100) NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "status" "ExamStatus" NOT NULL,

    CONSTRAINT "exam_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_record_student_id_exam_id_key" ON "exam_record"("student_id", "exam_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_tokens_access_token_key" ON "sys_tokens"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "sys_tokens_refresh_token_key" ON "sys_tokens"("refresh_token");

