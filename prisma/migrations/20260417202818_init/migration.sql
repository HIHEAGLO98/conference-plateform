-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARTICIPANT', 'CONFERENCIER', 'ORGANISATEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ConferenceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConferenceVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('KEYNOTE', 'WORKSHOP', 'PANEL', 'TALK', 'POSTER', 'BREAK');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('ORAL', 'POSTER', 'SHORT_PAPER', 'FULL_PAPER');

-- CreateEnum
CREATE TYPE "InscriptionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'ATTENDED');

-- CreateEnum
CREATE TYPE "InscriptionType" AS ENUM ('STANDARD', 'STUDENT', 'VIP', 'SPEAKER', 'ORGANIZER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INSCRIPTION_CONFIRMED', 'ARTICLE_STATUS_CHANGED', 'ATTESTATION_AVAILABLE', 'PROGRAM_UPDATED', 'CONFERENCE_REMINDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'OTP');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'REGISTER', 'UPDATE_PROFILE', 'CREATE_CONFERENCE', 'UPDATE_CONFERENCE', 'DELETE_CONFERENCE', 'PUBLISH_CONFERENCE', 'CREATE_SESSION', 'UPDATE_SESSION', 'DELETE_SESSION', 'SUBMIT_ARTICLE', 'UPDATE_ARTICLE_STATUS', 'INSCRIPTION_CREATED', 'INSCRIPTION_CANCELLED', 'CHECK_IN', 'USER_BLOCKED', 'USER_UNBLOCKED', 'ROLE_CHANGED', 'OTHER');

-- CreateEnum
CREATE TYPE "FormaType" AS ENUM ('PRESENTIAL', 'VIRTUAL', 'HYBRID');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mot_de_passe" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARTICIPANT',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "pays" VARCHAR(100),
    "affiliation" VARCHAR(255),
    "telephone" VARCHAR(30),
    "avatar_url" VARCHAR(500),
    "bio" TEXT,
    "email_verified" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conferences" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "short_name" VARCHAR(50),
    "titre" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "theme" VARCHAR(255) NOT NULL,
    "format" "FormaType" NOT NULL DEFAULT 'HYBRID',
    "lieu" VARCHAR(255) NOT NULL,
    "ville" VARCHAR(255) NOT NULL,
    "pays" VARCHAR(255) NOT NULL,
    "organisation" VARCHAR(255),
    "banner_url" VARCHAR(500),
    "website_url" VARCHAR(500),
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "capacite_max" INTEGER,
    "seul_alerte" INTEGER,
    "statut" "ConferenceStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ConferenceVisibility" NOT NULL DEFAULT 'PUBLIC',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organisateur_id" UUID NOT NULL,

    CONSTRAINT "conferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "SessionType" NOT NULL DEFAULT 'TALK',
    "salle" VARCHAR(100),
    "intervenants" TEXT[],
    "horaire_debut" TIMESTAMP(3) NOT NULL,
    "horaire_fin" TIMESTAMP(3) NOT NULL,
    "capacite" INTEGER NOT NULL,
    "seul_alerte" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "conference_id" UUID NOT NULL,
    "presenter_id" UUID,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "resume" TEXT NOT NULL,
    "mots_cles" TEXT[],
    "co_authors" TEXT[],
    "file_url" VARCHAR(500),
    "type" "ArticleType" NOT NULL DEFAULT 'FULL_PAPER',
    "statut" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "commentaire" TEXT,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_sessions" (
    "article_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "ordre_passage" INTEGER,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_sessions_pkey" PRIMARY KEY ("article_id","session_id")
);

-- CreateTable
CREATE TABLE "inscriptions" (
    "id" UUID NOT NULL,
    "date_inscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "InscriptionType" NOT NULL DEFAULT 'STANDARD',
    "statut" "InscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "qr_code_url" VARCHAR(500),
    "attestation_pdf_url" VARCHAR(500),
    "checked_in_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,
    "conference_id" UUID NOT NULL,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "conference_id" UUID NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" UUID NOT NULL,
    "question" VARCHAR(500) NOT NULL,
    "answer" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "conference_id" UUID NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "link" VARCHAR(500),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" VARCHAR(100),
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_user_id_idx" ON "verification_tokens"("user_id");

-- CreateIndex
CREATE INDEX "verification_tokens_token_idx" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "conferences_slug_key" ON "conferences"("slug");

-- CreateIndex
CREATE INDEX "conferences_statut_idx" ON "conferences"("statut");

-- CreateIndex
CREATE INDEX "conferences_organisateur_id_idx" ON "conferences"("organisateur_id");

-- CreateIndex
CREATE INDEX "conferences_date_debut_idx" ON "conferences"("date_debut");

-- CreateIndex
CREATE INDEX "sessions_conference_id_idx" ON "sessions"("conference_id");

-- CreateIndex
CREATE INDEX "sessions_horaire_debut_idx" ON "sessions"("horaire_debut");

-- CreateIndex
CREATE INDEX "articles_user_id_idx" ON "articles"("user_id");

-- CreateIndex
CREATE INDEX "articles_statut_idx" ON "articles"("statut");

-- CreateIndex
CREATE INDEX "article_sessions_session_id_idx" ON "article_sessions"("session_id");

-- CreateIndex
CREATE INDEX "inscriptions_statut_idx" ON "inscriptions"("statut");

-- CreateIndex
CREATE INDEX "inscriptions_conference_id_idx" ON "inscriptions"("conference_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_user_id_conference_id_key" ON "inscriptions"("user_id", "conference_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_conference_id_key" ON "favorites"("user_id", "conference_id");

-- CreateIndex
CREATE INDEX "faqs_conference_id_idx" ON "faqs"("conference_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_organisateur_id_fkey" FOREIGN KEY ("organisateur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_conference_id_fkey" FOREIGN KEY ("conference_id") REFERENCES "conferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_presenter_id_fkey" FOREIGN KEY ("presenter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_sessions" ADD CONSTRAINT "article_sessions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_sessions" ADD CONSTRAINT "article_sessions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_conference_id_fkey" FOREIGN KEY ("conference_id") REFERENCES "conferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_conference_id_fkey" FOREIGN KEY ("conference_id") REFERENCES "conferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_conference_id_fkey" FOREIGN KEY ("conference_id") REFERENCES "conferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
