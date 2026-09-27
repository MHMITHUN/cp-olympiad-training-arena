import type { Role } from "../types";

/**
 * Demo club member seeds. Passwords are scrypt-hashed at seed time
 * (see demo-store.ts ensureSeeded) — never store real hashes here.
 * Demo password for every account: Demo@12345
 *
 * Handles follow competitive-programming style (lowercase + underscore),
 * e.g. "code_ninja". createdAt values are fixed and spread across
 * January–July 2026 so the club history looks realistic in demo mode.
 */

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  handle: string;
  createdAt: string;
}

export const DEMO_PASSWORD = "Demo@12345";

export const seedUsers: SeedUser[] = [
  // ---- club admin ----
  {
    id: "usr-admin-01",
    name: "MD Mahamudul Hasan",
    email: "admin@demo.local",
    role: "ADMIN",
    handle: "club_admin",
    createdAt: "2026-01-02T09:00:00.000Z",
  },

  // ---- coaches (teachers) ----
  {
    id: "usr-teacher-01",
    name: "Nusrat Jahan",
    email: "teacher@demo.local",
    role: "TEACHER",
    handle: "coach_nusrat",
    createdAt: "2026-01-03T09:00:00.000Z",
  },
  {
    id: "usr-teacher-02",
    name: "Tanvir Ahmed",
    email: "tanvir.teacher@demo.local",
    role: "TEACHER",
    handle: "coach_tanvir",
    createdAt: "2026-01-03T10:00:00.000Z",
  },
  {
    id: "usr-teacher-03",
    name: "Shamima Akter",
    email: "shamima.teacher@demo.local",
    role: "TEACHER",
    handle: "coach_shamima",
    createdAt: "2026-01-04T09:00:00.000Z",
  },

  // ---- club members (students) ----
  {
    id: "usr-student-01",
    name: "Rakib Hasan",
    email: "student@demo.local",
    role: "STUDENT",
    handle: "code_ninja",
    createdAt: "2026-01-05T09:00:00.000Z",
  },
  {
    id: "usr-student-02",
    name: "Sumaiya Islam",
    email: "sumaiya@demo.local",
    role: "STUDENT",
    handle: "sumi_bits",
    createdAt: "2026-01-08T09:30:00.000Z",
  },
  {
    id: "usr-student-03",
    name: "Arif Chowdhury",
    email: "arif@demo.local",
    role: "STUDENT",
    handle: "arif_cf",
    createdAt: "2026-01-12T09:00:00.000Z",
  },
  {
    id: "usr-student-04",
    name: "Mehjabin Rahman",
    email: "mehjabin@demo.local",
    role: "STUDENT",
    handle: "midnight_coder",
    createdAt: "2026-01-16T09:00:00.000Z",
  },
  {
    id: "usr-student-05",
    name: "Sabbir Hossain",
    email: "sabbir@demo.local",
    role: "STUDENT",
    handle: "sabbir_ac",
    createdAt: "2026-01-20T09:00:00.000Z",
  },
  {
    id: "usr-student-06",
    name: "Farhana Yasmin",
    email: "farhana@demo.local",
    role: "STUDENT",
    handle: "farhana_dp",
    createdAt: "2026-01-24T09:00:00.000Z",
  },
  {
    id: "usr-student-07",
    name: "Imran Kabir",
    email: "imran@demo.local",
    role: "STUDENT",
    handle: "imran_stl",
    createdAt: "2026-01-28T09:00:00.000Z",
  },
  {
    id: "usr-student-08",
    name: "Tasnim Alam",
    email: "tasnim@demo.local",
    role: "STUDENT",
    handle: "tasnim_tle",
    createdAt: "2026-02-03T09:00:00.000Z",
  },
  {
    id: "usr-student-09",
    name: "Jubayer Siddique",
    email: "jubayer@demo.local",
    role: "STUDENT",
    handle: "jubayer_greedy",
    createdAt: "2026-02-08T09:00:00.000Z",
  },
  {
    id: "usr-student-10",
    name: "Nabila Sultana",
    email: "nabila@demo.local",
    role: "STUDENT",
    handle: "nabila_recursive",
    createdAt: "2026-02-14T09:00:00.000Z",
  },
  {
    id: "usr-student-11",
    name: "Tanjim Ahmed",
    email: "tanjim@demo.local",
    role: "STUDENT",
    handle: "tanjim_graph",
    createdAt: "2026-02-21T09:00:00.000Z",
  },
  {
    id: "usr-student-12",
    name: "Mitali Das",
    email: "mitali@demo.local",
    role: "STUDENT",
    handle: "mitali_math",
    createdAt: "2026-03-01T09:00:00.000Z",
  },
  {
    id: "usr-student-13",
    name: "Shahriar Karim",
    email: "shahriar@demo.local",
    role: "STUDENT",
    handle: "shahriar_brute",
    createdAt: "2026-03-10T09:00:00.000Z",
  },
  {
    id: "usr-student-14",
    name: "Anika Tabassum",
    email: "anika@demo.local",
    role: "STUDENT",
    handle: "anika_binary",
    createdAt: "2026-03-19T09:00:00.000Z",
  },
  {
    id: "usr-student-15",
    name: "Faisal Mahmud",
    email: "faisal@demo.local",
    role: "STUDENT",
    handle: "faisal_matrix",
    createdAt: "2026-03-28T09:00:00.000Z",
  },
  {
    id: "usr-student-16",
    name: "Sadia Afrin",
    email: "sadia@demo.local",
    role: "STUDENT",
    handle: "sadia_search",
    createdAt: "2026-04-06T09:00:00.000Z",
  },
  {
    id: "usr-student-17",
    name: "Nafis Iqbal",
    email: "nafis@demo.local",
    role: "STUDENT",
    handle: "nafis_bfs",
    createdAt: "2026-04-15T09:00:00.000Z",
  },
  {
    id: "usr-student-18",
    name: "Lamia Chowdhury",
    email: "lamia@demo.local",
    role: "STUDENT",
    handle: "lamia_sort",
    createdAt: "2026-04-24T09:00:00.000Z",
  },
  {
    id: "usr-student-19",
    name: "Zahid Hasan",
    email: "zahid@demo.local",
    role: "STUDENT",
    handle: "zahid_number_theory",
    createdAt: "2026-05-05T09:00:00.000Z",
  },
  {
    id: "usr-student-20",
    name: "Ishrat Jahan Ema",
    email: "ema@demo.local",
    role: "STUDENT",
    handle: "ema_backtrack",
    createdAt: "2026-05-18T09:00:00.000Z",
  },
];
