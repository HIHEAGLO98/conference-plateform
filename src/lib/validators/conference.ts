import { z } from "zod";

//  Enums alignés sur le schéma Prisma 

export const FormaTypeEnum = z.enum(["PRESENTIAL", "VIRTUAL", "HYBRID"]);
export const ConferenceVisibilityEnum = z.enum(["PUBLIC", "PRIVATE"]);
export const ConferenceStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);

/**
 * SessionType : valeurs alignées sur l'enum Prisma.
 * ARTICLES / PLENARY / ROUND_TABLE n'existent PAS dans le schéma —
 * ils ont été retirés du modal en conséquence.
 */
export const SessionTypeEnum = z.enum([
  "KEYNOTE",
  "WORKSHOP",
  "PANEL",
  "TALK",
  "POSTER",
  "BREAK",
]);

// Schéma Conférence 

export const createConferenceSchema = z
  .object({
    titre: z
      .string()
      .min(3, "Le titre doit faire au moins 3 caractères")
      .max(255, "Titre trop long (max 255 car.)")
      .trim(),

    shortName: z
      .string()
      .max(50, "Sigle trop long (max 50 car.)")
      .trim()
      .optional()
      .or(z.literal("")),

    theme: z.string().min(1, "Choisissez une thématique").trim(),

    description: z
      .string()
      .min(20, "Description trop courte (min 20 car.)")
      .max(5000)
      .trim(),

    organisation: z.string().max(255).trim().optional().or(z.literal("")),

    // Champ brut "Paris, France" → splité en ville + pays dans l'action
    villePays: z
      .string()
      .min(2, "Ville et pays requis")
      .max(200)
      .trim(),

    lieu: z.string().max(255).trim().optional().or(z.literal("")),

    format: FormaTypeEnum,

    dateDebut: z.string().min(1, "Date de début requise"),
    dateFin: z.string().min(1, "Date de fin requise"),

    capaciteMax: z
      .number({ message: "La capacité doit être un nombre" })
      .int("Nombre entier requis")
      .min(1, "La capacité doit être ≥ 1"),

    seuilAlerte: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .default(80),

    visibility: ConferenceVisibilityEnum,
    publish: z.enum(["DRAFT", "NOW"]),

    // langues et submissionDeadline/notificationDate ne sont pas dans le schéma
    // Prisma → ignorés au persist, présents ici pour éviter les erreurs de type
    // côté client.
   // langues: z.array(z.string()).optional(),
    submissionDeadline: z.string().optional(),
    notificationDate: z.string().optional(),
  })
  .refine(
    (d) => {
      if (!d.dateDebut || !d.dateFin) return true;
      return new Date(d.dateFin) >= new Date(d.dateDebut);
    },
    {
      message: "La date de fin doit être après la date de début",
      path: ["dateFin"],
    }
  );

export type CreateConferenceInput = z.infer<typeof createConferenceSchema>;

// Schéma Session

export const createSessionSchema = z
  .object({
    conferenceId: z
      .uuid("ID de conférence invalide"),

    titre: z
      .string()
      .min(3, "Le titre doit faire au moins 3 caractères")
      .max(255)
      .trim(),

    type: SessionTypeEnum,

    salle: z.string().max(100).trim().optional().or(z.literal("")),

    horaireDebut: z.string().min(1, "Date de début requise"),
    horaireFin: z.string().min(1, "Date de fin requise"),

    /**
     * capacite est INT non-nullable en DB.
     * Le champ n'est PAS optionnel — si vide, l'action tente d'hériter de la
     * conférence parente, mais en dernier recours il faut une valeur.
     * On accepte "" uniquement pour permettre l'héritage (géré dans l'action).
     */
    capacite: z
      .union([
        z.string().length(0), // vide → hérite de la conf
        z
          .string()
          .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
            message: "La capacité doit être un entier positif",
          }),
      ])
      .optional(),

    seuilAlerte: z
      .union([
        z.string().length(0),
        z
          .string()
          .refine(
            (v) =>
              !Number.isNaN(Number(v)) &&
              Number(v) >= 0 &&
              Number(v) <= 100,
            { message: "Seuil entre 0 et 100" }
          ),
      ])
      .optional(),

    intervenants: z.string().max(1000).trim().optional().or(z.literal("")),

    description: z.string().max(5000).trim().optional().or(z.literal("")),
  })
  .refine(
    (d) => {
      if (!d.horaireDebut || !d.horaireFin) return true;
      return new Date(d.horaireFin) > new Date(d.horaireDebut);
    },
    {
      message: "La fin doit être postérieure au début",
      path: ["horaireFin"],
    }
  );

export type CreateSessionInput = z.infer<typeof createSessionSchema>;