-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PLANNER', 'KINESSO', 'FINANCE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PLANNING', 'IN_FLIGHT', 'REPORTING', 'RECONCILIATION', 'COMPLETE');

-- CreateEnum
CREATE TYPE "BlockingChartStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REVISION_REQUESTED');

-- CreateEnum
CREATE TYPE "RowStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REVISION_REQUESTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'RECONCILED', 'UNRECONCILED', 'OVERDUE', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('CAMPAIGN', 'BLOCKING_CHART', 'BLOCKING_CHART_ROW', 'DAB_SUBMISSION', 'COMMENT', 'INVOICE');

-- CreateEnum
CREATE TYPE "DabStatus" AS ENUM ('PENDING', 'RESPONDED', 'FEEDBACK', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BudgetOverrideStatus" AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "business_unit" TEXT NOT NULL DEFAULT 'Foods & Wellness',
    "status" "CampaignStatus" NOT NULL DEFAULT 'PLANNING',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_budget" DECIMAL(14,2) NOT NULL,
    "created_by_id" UUID NOT NULL,
    "asana_project_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocking_charts" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "BlockingChartStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocking_charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocking_chart_rows" (
    "id" UUID NOT NULL,
    "blocking_chart_id" UUID NOT NULL,
    "status" "RowStatus" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL,
    "created_by_id" UUID NOT NULL,
    "modified_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "buy_type" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "placements" TEXT NOT NULL,
    "accutics_campaign_name" TEXT NOT NULL,
    "tags_required" TEXT NOT NULL,
    "measurement" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "ad_format" TEXT NOT NULL,
    "estimated_viewability" DECIMAL(5,4),
    "kpi" TEXT NOT NULL,
    "kpi_value" DECIMAL(10,4),
    "target" TEXT NOT NULL,
    "is_secondary_target" BOOLEAN NOT NULL DEFAULT false,
    "parent_row_id" UUID,
    "est_cpm" DECIMAL(10,4),
    "gross_budget" DECIMAL(14,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "ad_serving" DECIMAL(14,2),
    "tech_fees" DECIMAL(14,2),
    "data_fees" DECIMAL(14,2),
    "dv_cost_prebid" DECIMAL(14,2),
    "dv_cost_postbid" DECIMAL(14,2),
    "buffer" DECIMAL(14,2),
    "net_budget" DECIMAL(14,2),
    "est_impressions" INTEGER,
    "taxonomy_code" TEXT,
    "taxonomy_version" TEXT,
    "line_item_id" TEXT,
    "io_number" TEXT,
    "io_signed_date" DATE,
    "actual_impressions" INTEGER,
    "actual_cpm" DECIMAL(10,4),
    "actual_vcr" DECIMAL(5,4),
    "actual_ctr" DECIMAL(5,4),
    "insights" TEXT,
    "prisma_line_ref" TEXT,
    "verification_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "blocking_chart_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dab_submissions" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "submitted_by_id" UUID NOT NULL,
    "status" "DabStatus" NOT NULL DEFAULT 'PENDING',
    "rfp_data" JSONB NOT NULL,
    "response_data" JSONB,
    "responded_by_id" UUID,
    "responded_at" TIMESTAMP(3),
    "approved_by_id" UUID,
    "approved_at" TIMESTAMP(3),
    "feedback_rounds" INTEGER NOT NULL DEFAULT 0,
    "asana_task_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dab_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "asana_comment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "blocking_chart_row_id" UUID NOT NULL,
    "vendor" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "verification_notes" TEXT,
    "payment_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asana_syncs" (
    "id" UUID NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "asana_task_id" TEXT NOT NULL,
    "last_synced_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asana_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "section" TEXT,
    "metadata" JSONB NOT NULL,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "blocking_charts_campaign_id_version_key" ON "blocking_charts"("campaign_id", "version");

-- CreateIndex
CREATE INDEX "comments_entity_type_entity_id_idx" ON "comments"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "asana_syncs_entity_type_entity_id_key" ON "asana_syncs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "analytics_events_user_id_idx" ON "analytics_events"("user_id");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "analytics_events_section_idx" ON "analytics_events"("section");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocking_charts" ADD CONSTRAINT "blocking_charts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocking_charts" ADD CONSTRAINT "blocking_charts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocking_chart_rows" ADD CONSTRAINT "blocking_chart_rows_blocking_chart_id_fkey" FOREIGN KEY ("blocking_chart_id") REFERENCES "blocking_charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocking_chart_rows" ADD CONSTRAINT "blocking_chart_rows_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocking_chart_rows" ADD CONSTRAINT "blocking_chart_rows_modified_by_id_fkey" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocking_chart_rows" ADD CONSTRAINT "blocking_chart_rows_parent_row_id_fkey" FOREIGN KEY ("parent_row_id") REFERENCES "blocking_chart_rows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dab_submissions" ADD CONSTRAINT "dab_submissions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dab_submissions" ADD CONSTRAINT "dab_submissions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dab_submissions" ADD CONSTRAINT "dab_submissions_responded_by_id_fkey" FOREIGN KEY ("responded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dab_submissions" ADD CONSTRAINT "dab_submissions_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_blocking_chart_row_id_fkey" FOREIGN KEY ("blocking_chart_row_id") REFERENCES "blocking_chart_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
