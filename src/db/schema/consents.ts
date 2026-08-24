import { pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "./auth";
import { consentTypeEnum } from "./enums";

// PRD 섹션 6: 민감정보(피부질환 이력·약물·알레르기), 생체정보(얼굴 사진)는
// 일반 이용약관과 별도로 명시적 동의를 받는다.
export const userConsents = pgTable(
  "user_consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    consentType: consentTypeEnum("consent_type").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.userId, table.consentType)],
);
