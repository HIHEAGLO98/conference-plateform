/**
 * 
 *  Seed — Données de test pour ConferenceHub

 *  Mot de passe commun pour TOUS les comptes de test : "Password123!"
 */

// Output custom du generator → on importe depuis le chemin généré
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "Password123!";

/* 
 *  Helpers
 *  */

const now = new Date();
const daysFromNow = (d: number) =>
  new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
const hoursFromDate = (base: Date, h: number) =>
  new Date(base.getTime() + h * 60 * 60 * 1000);

/** Calcule un seuil d'alerte à 80% de la capacité max. */
const alertThreshold = (capacity: number) => Math.floor(capacity * 0.8);

/* 
 *  1. RESET — supprime tout dans le bon ordre (respect des FK)
 *  */

async function reset() {
  console.log(" Reset de la base…");
  // Ordre inverse des dépendances
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.articleSession.deleteMany();
  await prisma.inscription.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.article.deleteMany();
  await prisma.session.deleteMany();
  await prisma.conference.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  console.log("    Tables vidées");
}

/* 
 *  2. USERS — 1 admin, 2 organisateurs, 3 conférenciers, 4 participants
 *  */

async function seedUsers() {
  console.log(" Création des utilisateurs…");
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // Helper pour marquer un utilisateur comme vérifié (Boolean + DateTime)
  const verified = { emailVerifie: true, emailVerified: now };

  const users = await Promise.all([
    //  ADMIN 
    prisma.user.create({
      data: {
        email: "hiheaaugusto@gmail.com",
        nom: "Leclerc",
        prenom: "Sophie",
        motDePasse: hash,
        role: "ADMIN",
        status: "ACTIVE",
        pays: "France",
        telephone: "+33 3 84 58 30 90",
        affiliation: "ConferenceHub",
        bio: "Administratrice de la plateforme ConferenceHub.",
        ...verified,
      },
    }),

    //  ORGANISATEURS 
    prisma.user.create({
      data: {
        email: "marie.organisateur@utbm.fr",
        nom: "Moreau",
        prenom: "Marie",
        motDePasse: hash,
        role: "ORGANISATEUR",
        status: "ACTIVE",
        pays: "France",
        affiliation: "Université de Technologie de Belfort-Montbéliard",
        telephone: "+33 3 84 58 30 00",
        bio: "Enseignante-chercheuse en IA, organise la conférence ICAIS chaque année.",
        ...verified,
      },
    }),
    prisma.user.create({
      data: {
        email: "pierre.organisateur@paris-saclay.fr",
        nom: "Durand",
        prenom: "Pierre",
        motDePasse: hash,
        role: "ORGANISATEUR",
        status: "ACTIVE",
        pays: "France",
        affiliation: "Université Paris-Saclay",
        ...verified,
      },
    }),

    //  CONFÉRENCIERS 
    prisma.user.create({
      data: {
        email: "augustin@utbm.fr",
        nom: "Hiheaglo",
        prenom: "Augustin",
        motDePasse: hash,
        role: "CONFERENCIER",
        status: "ACTIVE",
        pays: "Togo",
        affiliation: "UTBM · Laboratoire CIAD",
        bio: "Doctorant en intelligence artificielle et systèmes distribués.",
        ...verified,
      },
    }),
    prisma.user.create({
      data: {
        email: "sarah.chercheuse@cnrs.fr",
        nom: "Dupont",
        prenom: "Sarah",
        motDePasse: hash,
        role: "CONFERENCIER",
        status: "ACTIVE",
        pays: "France",
        affiliation: "CNRS · LIRIS",
        ...verified,
      },
    }),
    prisma.user.create({
      data: {
        email: "jean.martin@mit.edu",
        nom: "Martin",
        prenom: "Jean",
        motDePasse: hash,
        role: "CONFERENCIER",
        status: "ACTIVE",
        pays: "États-Unis",
        affiliation: "MIT · CSAIL",
        ...verified,
      },
    }),

    //  PARTICIPANTS 
    prisma.user.create({
      data: {
        email: "lucie.etudiante@student.fr",
        nom: "Bernard",
        prenom: "Lucie",
        motDePasse: hash,
        role: "PARTICIPANT",
        status: "ACTIVE",
        pays: "France",
        affiliation: "Sorbonne Université (M2)",
        ...verified,
      },
    }),
    prisma.user.create({
      data: {
        email: "karim.benali@enit.utm.tn",
        nom: "Benali",
        prenom: "Karim",
        motDePasse: hash,
        role: "PARTICIPANT",
        status: "ACTIVE",
        pays: "Tunisie",
        affiliation: "ENIT · Université de Tunis El Manar",
        ...verified,
      },
    }),
    prisma.user.create({
      data: {
        email: "emma.dubois@utbm.fr",
        nom: "Dubois",
        prenom: "Emma",
        motDePasse: hash,
        role: "PARTICIPANT",
        status: "ACTIVE",
        pays: "France",
        affiliation: "UTBM",
        ...verified,
      },
    }),
    // Compte non vérifié — pour tester le flux OTP /verify-email
    prisma.user.create({
      data: {
        email: "test.pending@example.com",
        nom: "Testeur",
        prenom: "Pending",
        motDePasse: hash,
        role: "PARTICIPANT",
        status: "PENDING_VERIFICATION",
        pays: "France",
        // emailVerifie reste false, emailVerified reste null
      },
    }),
  ]);

  console.log(`   ✔ ${users.length} utilisateurs créés`);
  return Object.fromEntries(users.map((u) => [u.email, u]));
}

/* 
 *  3. CONFERENCES — 1 DRAFT, 3 PUBLISHED, 1 ARCHIVED
 *     Couvre les 3 formats : PRESENTIAL, VIRTUAL, HYBRID
 *  */

async function seedConferences(users: Awaited<ReturnType<typeof seedUsers>>) {
  console.log("Création des conférences…");

  const marie = users["marie.organisateur@utbm.fr"]!;
  const pierre = users["pierre.organisateur@paris-saclay.fr"]!;

  const [icais2026, cifre2026, edtech, workshopIot, jnsi2025] =
    await Promise.all([
      // 1. ICAIS 2026 — HYBRIDE, publiée, conf phare
      prisma.conference.create({
        data: {
          slug: "icais-2026",
          shortName: "ICAIS 2026",
          titre:
            "International Conference on Artificial Intelligence Systems 2026",
          description:
            "ICAIS 2026 rassemble chercheurs et industriels autour des dernières avancées en IA, systèmes multi-agents, NLP et éthique algorithmique. 3 jours de keynotes, ateliers et sessions posters.",
          theme: "Intelligence Artificielle · Systèmes Distribués",
          format: "HYBRID",
          lieu: "Campus Numérica, Amphithéâtre Stendhal",
          ville: "Belfort",
          pays: "France",
          organisation: "UTBM · Laboratoire CIAD · IEEE France",
          bannerUrl:
            "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600",
          websiteUrl: "https://icais-2026.utbm.fr",
          dateDebut: daysFromNow(60),
          dateFin: daysFromNow(62),
          capaciteMax: 400,
          seulAlerte: alertThreshold(400),
          statut: "PUBLISHED",
          visibility: "PUBLIC",
          publishedAt: daysFromNow(-20),
          organisateurId: marie.id,
        },
      }),

      // 2. CIFRE 2026 — PRÉSENTIEL, publiée
      prisma.conference.create({
        data: {
          slug: "cifre-paris-2026",
          shortName: "CIFRE 2026",
          titre:
            "Congrès Interdisciplinaire Francophone de la Recherche Exploratoire",
          description:
            "Un rendez-vous annuel pour favoriser le dialogue entre disciplines scientifiques. Sessions plénières, tables rondes et posters doctoraux.",
          theme: "Interdisciplinarité · Sciences Humaines · Sciences Dures",
          format: "PRESENTIAL",
          lieu: "Centre de conférences Paris-Saclay, bâtiment 660",
          ville: "Orsay",
          pays: "France",
          organisation: "Université Paris-Saclay · CNRS",
          bannerUrl:
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600",
          websiteUrl: "https://cifre.paris-saclay.fr",
          dateDebut: daysFromNow(140),
          dateFin: daysFromNow(142),
          capaciteMax: 250,
          seulAlerte: alertThreshold(250),
          statut: "PUBLISHED",
          visibility: "PUBLIC",
          publishedAt: daysFromNow(-5),
          organisateurId: pierre.id,
        },
      }),

      // 3. EdTech Summit — 100% virtuel, publié
      prisma.conference.create({
        data: {
          slug: "edtech-summit-2026",
          shortName: "EdTech 2026",
          titre: "EdTech Summit 2026 — L'IA au service de l'apprentissage",
          description:
            "Retours d'expérience et démonstrations d'outils EdTech propulsés par l'IA. Destiné aux enseignants-chercheurs, entrepreneurs et décideurs.",
          theme: "Éducation · Technologies · Intelligence Artificielle",
          format: "VIRTUAL",
          lieu: "En ligne (Zoom Events)",
          ville: "—",
          pays: "International",
          organisation: "Université Lyon 1 · EdTech France",
          dateDebut: daysFromNow(200),
          dateFin: daysFromNow(201),
          capaciteMax: 500,
          seulAlerte: alertThreshold(500),
          statut: "PUBLISHED",
          visibility: "PUBLIC",
          publishedAt: daysFromNow(-2),
          organisateurId: marie.id,
        },
      }),

      // 4. Workshop IoT — DRAFT, privé
      prisma.conference.create({
        data: {
          slug: "workshop-iot-2026",
          shortName: "IoT Workshop",
          titre: "Workshop IoT & Edge Computing 2026",
          description:
            "Atelier technique d'une journée sur les architectures IoT modernes et l'edge computing. En cours de préparation.",
          theme: "IoT · Edge Computing · Embedded Systems",
          format: "PRESENTIAL",
          lieu: "INRIA Montbonnot, salle Minatec-4",
          ville: "Grenoble",
          pays: "France",
          dateDebut: daysFromNow(90),
          dateFin: daysFromNow(90),
          capaciteMax: 60,
          seulAlerte: alertThreshold(60),
          statut: "DRAFT",
          visibility: "PRIVATE",
          organisateurId: pierre.id,
        },
      }),

      // 5. JNSI 2025 — ARCHIVÉE (conf passée, sert aux attestations)
      prisma.conference.create({
        data: {
          slug: "jnsi-2025",
          shortName: "JNSI 2025",
          titre: "Journées Nationales des Systèmes Intelligents 2025",
          description:
            "Édition 2025 des JNSI — 2 jours d'échanges autour des systèmes intelligents et de leurs applications industrielles.",
          theme: "Systèmes Intelligents · Industrie 4.0",
          format: "HYBRID",
          lieu: "INSA Toulouse, amphi Fermat",
          ville: "Toulouse",
          pays: "France",
          organisation: "INSA Toulouse · IRIT",
          dateDebut: daysFromNow(-90),
          dateFin: daysFromNow(-89),
          capaciteMax: 200,
          seulAlerte: alertThreshold(200),
          statut: "ARCHIVED",
          visibility: "PUBLIC",
          publishedAt: daysFromNow(-180),
          organisateurId: marie.id,
        },
      }),
    ]);

  console.log(
    "   ✔ 5 conférences (3 PUBLISHED / 1 DRAFT / 1 ARCHIVED · HYBRID + PRESENTIAL + VIRTUAL)"
  );
  return { icais2026, cifre2026, edtech, workshopIot, jnsi2025 };
}

/* 
 *  4. SESSIONS — programme d'ICAIS 2026 (le plus étoffé)
 * */

async function seedSessions(
  confs: Awaited<ReturnType<typeof seedConferences>>,
  users: Awaited<ReturnType<typeof seedUsers>>
) {
  console.log("📅 Création des sessions…");

  const { icais2026, cifre2026 } = confs;
  const jean = users["jean.martin@mit.edu"]!;
  const sarah = users["sarah.chercheuse@cnrs.fr"]!;
  const augustin = users["augustin@utbm.fr"]!;

  // Jour 1 d'ICAIS — ancrage 09:00
  const day1 = new Date(icais2026.dateDebut);
  day1.setHours(9, 0, 0, 0);

  const icaisSessions = await Promise.all([
    prisma.session.create({
      data: {
        titre: "Keynote d'ouverture : L'IA à l'horizon 2030",
        description:
          "Vision long-terme sur l'évolution des grands modèles de langage et leur impact sociétal.",
        type: "KEYNOTE",
        salle: "Amphithéâtre A",
        intervenants: ["Prof. Jean Martin (MIT · CSAIL)"],
        horaireDebut: day1,
        horaireFin: hoursFromDate(day1, 1),
        capacite: 400,
        seulAlerte: alertThreshold(400),
        conferenceId: icais2026.id,
        presenterId: jean.id,
      },
    }),
    prisma.session.create({
      data: {
        titre: "Session : Applications NLP en production",
        description:
          "Retours d'expérience concrets sur le déploiement de LLMs en environnement industriel.",
        type: "TALK",
        salle: "Salle B-203",
        intervenants: [
          "Sarah Dupont (CNRS · LIRIS)",
          "Augustin Hiheaglo (UTBM · CIAD)",
        ],
        horaireDebut: hoursFromDate(day1, 1.5),
        horaireFin: hoursFromDate(day1, 3),
        capacite: 120,
        seulAlerte: alertThreshold(120),
        conferenceId: icais2026.id,
        presenterId: sarah.id,
      },
    }),
    prisma.session.create({
      data: {
        titre: "Pause-café & networking",
        type: "BREAK",
        salle: "Hall central",
        intervenants: [],
        horaireDebut: hoursFromDate(day1, 3),
        horaireFin: hoursFromDate(day1, 3.5),
        capacite: 400,
        conferenceId: icais2026.id,
      },
    }),
    prisma.session.create({
      data: {
        titre: "Atelier pratique : Fine-tuning de LLMs open-source",
        description: "Atelier hands-on (apportez votre laptop).",
        type: "WORKSHOP",
        salle: "Lab info C-105",
        intervenants: ["Augustin Hiheaglo (UTBM)"],
        horaireDebut: hoursFromDate(day1, 3.5),
        horaireFin: hoursFromDate(day1, 6),
        capacite: 30,
        seulAlerte: alertThreshold(30),
        conferenceId: icais2026.id,
        presenterId: augustin.id,
      },
    }),
    prisma.session.create({
      data: {
        titre: "Panel : Éthique & régulation de l'IA en Europe",
        description:
          "Table ronde avec chercheurs, juristes et représentants institutionnels.",
        type: "PANEL",
        salle: "Amphithéâtre A",
        intervenants: [
          "Sophie Leclerc (ConferenceHub)",
          "Pierre Durand (Paris-Saclay)",
          "Sarah Dupont (CNRS)",
        ],
        horaireDebut: hoursFromDate(day1, 7),
        horaireFin: hoursFromDate(day1, 8.5),
        capacite: 400,
        seulAlerte: alertThreshold(400),
        conferenceId: icais2026.id,
      },
    }),
    prisma.session.create({
      data: {
        titre: "Session Posters — Doctorants",
        type: "POSTER",
        salle: "Hall central",
        intervenants: [],
        horaireDebut: hoursFromDate(day1, 8.5),
        horaireFin: hoursFromDate(day1, 10),
        capacite: 200,
        conferenceId: icais2026.id,
      },
    }),
  ]);

  // CIFRE — une session plénière pour varier
  const cifreDay1 = new Date(cifre2026.dateDebut);
  cifreDay1.setHours(10, 0, 0, 0);

  await prisma.session.create({
    data: {
      titre: "Plénière d'ouverture CIFRE 2026",
      type: "KEYNOTE",
      salle: "Grand amphi",
      intervenants: ["Sarah Dupont (CNRS · LIRIS)"],
      horaireDebut: cifreDay1,
      horaireFin: hoursFromDate(cifreDay1, 1.5),
      capacite: 250,
      seulAlerte: alertThreshold(250),
      conferenceId: cifre2026.id,
      presenterId: sarah.id,
    },
  });

  console.log(`   ✔ ${icaisSessions.length + 1} sessions créées`);
  return { icaisSessions };
}

/* 
 *  5. ARTICLES — statuts variés pour tester le workflow éditorial
 * 
 *  */

async function seedArticles(
  users: Awaited<ReturnType<typeof seedUsers>>,
  sessions: Awaited<ReturnType<typeof seedSessions>>
) {
  console.log("Création des articles…");

  const augustin = users["augustin@utbm.fr"]!;
  const sarah = users["sarah.chercheuse@cnrs.fr"]!;
  const jean = users["jean.martin@mit.edu"]!;

  const articles = await Promise.all([
    // ACCEPTED — assigné à une session
    prisma.article.create({
      data: {
        titre: "Multi-agent reinforcement learning for smart grid optimization",
        resume:
          "Nous proposons un framework MARL pour l'optimisation en temps réel de réseaux électriques intelligents, démontrant une réduction de 18% des pertes de distribution sur un benchmark IEEE-14.",
        motsCles: ["MARL", "Smart Grid", "Reinforcement Learning", "IEEE"],
        coAuthors: ["coauteur1@utbm.fr", "prof.thesis@utbm.fr"],
        fileUrl: "https://storage.example.com/articles/marl-smartgrid.pdf",
        type: "FULL_PAPER",
        statut: "ACCEPTED",
        commentaire:
          "Article solide, méthodologie rigoureuse. Accepté pour présentation orale.",
        submittedAt: daysFromNow(-30),
        userId: augustin.id,
      },
    }),

    // REVIEWING
    prisma.article.create({
      data: {
        titre:
          "Benchmark de robustesse adversariale sur les modèles de vision transformer",
        resume:
          "Étude comparative de 12 architectures ViT face à 8 familles d'attaques adversariales, avec publication du benchmark sur HuggingFace.",
        motsCles: ["Vision Transformer", "Adversarial", "Robustness"],
        coAuthors: ["laborat.vision@cnrs.fr"],
        fileUrl: "https://storage.example.com/articles/vit-robust.pdf",
        type: "FULL_PAPER",
        statut: "REVIEWING",
        submittedAt: daysFromNow(-15),
        userId: sarah.id,
      },
    }),

    // PENDING (en attente d'assignation à des relecteurs)
    prisma.article.create({
      data: {
        titre: "A survey on federated learning in healthcare",
        resume:
          "Panorama des approches d'apprentissage fédéré appliquées au secteur médical, avec analyse des défis de privacy et des trade-offs accuracy/communication.",
        motsCles: ["Federated Learning", "Healthcare", "Privacy"],
        coAuthors: [],
        type: "FULL_PAPER",
        statut: "PENDING",
        submittedAt: daysFromNow(-3),
        userId: jean.id,
      },
    }),

    // REJECTED
    prisma.article.create({
      data: {
        titre: "Expérimentation préliminaire sur les réseaux de neurones",
        resume: "Étude exploratoire avec résultats limités à 100 échantillons.",
        motsCles: ["Neural Networks"],
        coAuthors: [],
        type: "SHORT_PAPER",
        statut: "REJECTED",
        commentaire:
          "Sujet intéressant mais méthodologie expérimentale insuffisante. Taille d'échantillon trop faible. Nous encourageons une soumission après refonte.",
        submittedAt: daysFromNow(-40),
        userId: augustin.id,
      },
    }),

    // DRAFT (pas encore soumis)
    prisma.article.create({
      data: {
        titre:
          "Edge-aware scheduling for IoT mesh networks (travail en cours)",
        resume:
          "Draft — proposition d'un ordonnanceur distribué pour réseaux mesh contraints.",
        motsCles: ["IoT", "Scheduling", "Edge"],
        coAuthors: [],
        type: "ORAL",
        statut: "DRAFT",
        userId: augustin.id,
      },
    }),
  ]);

  // Relie l'article accepté à la session "Applications NLP"
  await prisma.articleSession.create({
    data: {
      articleId: articles[0]!.id,
      sessionId: sessions.icaisSessions[1]!.id,
      ordrePassage: 1,
    },
  });

  console.log(`   ✔ ${articles.length} articles créés`);
  return articles;
}

/* 
 *  6. INSCRIPTIONS — participants aux conférences publiées
 *  */

async function seedInscriptions(
  users: Awaited<ReturnType<typeof seedUsers>>,
  confs: Awaited<ReturnType<typeof seedConferences>>
) {
  console.log(" Création des inscriptions…");

  const { icais2026, cifre2026, jnsi2025 } = confs;
  const lucie = users["lucie.etudiante@student.fr"]!;
  const karim = users["karim.benali@enit.utm.tn"]!;
  const emma = users["emma.dubois@utbm.fr"]!;
  const augustin = users["augustin@utbm.fr"]!;
  const sarah = users["sarah.chercheuse@cnrs.fr"]!;

  const inscriptions = await Promise.all([
    prisma.inscription.create({
      data: {
        userId: lucie.id,
        conferenceId: icais2026.id,
        type: "STUDENT",
        statut: "CONFIRMED",
        qrCodeUrl: "https://storage.example.com/qr/lucie-icais.png",
      },
    }),
    prisma.inscription.create({
      data: {
        userId: karim.id,
        conferenceId: icais2026.id,
        type: "STANDARD",
        statut: "PENDING",
      },
    }),
    prisma.inscription.create({
      data: {
        userId: emma.id,
        conferenceId: icais2026.id,
        type: "STANDARD",
        statut: "CONFIRMED",
        qrCodeUrl: "https://storage.example.com/qr/emma-icais.png",
      },
    }),
    prisma.inscription.create({
      data: {
        userId: augustin.id,
        conferenceId: icais2026.id,
        type: "SPEAKER",
        statut: "CONFIRMED",
        qrCodeUrl: "https://storage.example.com/qr/augustin-icais.png",
      },
    }),
    prisma.inscription.create({
      data: {
        userId: sarah.id,
        conferenceId: cifre2026.id,
        type: "SPEAKER",
        statut: "CONFIRMED",
      },
    }),
    prisma.inscription.create({
      data: {
        userId: lucie.id,
        conferenceId: jnsi2025.id,
        type: "STUDENT",
        statut: "ATTENDED",
        checkedInAt: daysFromNow(-90),
        attestationPdfUrl:
          "https://storage.example.com/attestations/lucie-jnsi-2025.pdf",
      },
    }),
    prisma.inscription.create({
      data: {
        userId: karim.id,
        conferenceId: jnsi2025.id,
        type: "STANDARD",
        statut: "CANCELLED",
        cancelledAt: daysFromNow(-100),
      },
    }),
  ]);

  console.log(`   ✔ ${inscriptions.length} inscriptions créées`);
}

/* 
 *  7. FAVORITES
 *  */

async function seedFavorites(
  users: Awaited<ReturnType<typeof seedUsers>>,
  confs: Awaited<ReturnType<typeof seedConferences>>
) {
  console.log("Création des favoris…");
  const lucie = users["lucie.etudiante@student.fr"]!;
  const emma = users["emma.dubois@utbm.fr"]!;

  await prisma.favorite.createMany({
    data: [
      { userId: lucie.id, conferenceId: confs.icais2026.id },
      { userId: lucie.id, conferenceId: confs.cifre2026.id },
      { userId: emma.id, conferenceId: confs.edtech.id },
    ],
  });
  console.log("   ✔ 3 favoris");
}

/* 
 *  8. FAQ
 *  */

async function seedFaqs(confs: Awaited<ReturnType<typeof seedConferences>>) {
  console.log("Création des FAQ…");

  await prisma.faq.createMany({
    data: [
      {
        conferenceId: confs.icais2026.id,
        ordre: 1,
        question: "Les sessions seront-elles enregistrées ?",
        answer:
          "Oui, toutes les keynotes et panels seront enregistrés et rendus disponibles aux participants inscrits pendant 6 mois après la conférence.",
      },
      {
        conferenceId: confs.icais2026.id,
        ordre: 2,
        question: "Y a-t-il un tarif étudiant ?",
        answer:
          "Oui, un tarif réduit de 50% est proposé aux étudiants sur présentation d'un justificatif de scolarité 2025-2026.",
      },
      {
        conferenceId: confs.icais2026.id,
        ordre: 3,
        question: "Puis-je participer à distance ?",
        answer:
          "ICAIS 2026 est une conférence hybride : vous pouvez suivre toutes les keynotes et panels à distance via notre plateforme vidéo. Les ateliers restent réservés aux participants sur site.",
      },
      {
        conferenceId: confs.cifre2026.id,
        ordre: 1,
        question: "Puis-je assister à distance ?",
        answer:
          "CIFRE 2026 est un événement 100% présentiel pour favoriser les échanges interdisciplinaires.",
      },
    ],
  });
  console.log("   ✔ 4 entrées FAQ");
}

/* 
 *  9. NOTIFICATIONS
 *  */

async function seedNotifications(
  users: Awaited<ReturnType<typeof seedUsers>>,
  confs: Awaited<ReturnType<typeof seedConferences>>
) {
  console.log("Création des notifications…");

  const lucie = users["lucie.etudiante@student.fr"]!;
  const augustin = users["augustin@utbm.fr"]!;
  const sarah = users["sarah.chercheuse@cnrs.fr"]!;

  await prisma.notification.createMany({
    data: [
      {
        userId: lucie.id,
        type: "INSCRIPTION_CONFIRMED",
        titre: "Inscription confirmée",
        message: `Votre inscription à ${confs.icais2026.shortName} est confirmée. Retrouvez votre QR code dans votre tableau de bord.`,
        link: "/dashboard/inscriptions",
        isRead: false,
      },
      {
        userId: lucie.id,
        type: "ATTESTATION_AVAILABLE",
        titre: "Attestation disponible",
        message:
          "Votre attestation de participation pour JNSI 2025 est disponible au téléchargement.",
        link: "/dashboard/inscriptions",
        isRead: true,
      },
      {
        userId: augustin.id,
        type: "ARTICLE_STATUS_CHANGED",
        titre: "Article accepté 🎉",
        message:
          'Votre article "Multi-agent reinforcement learning for smart grid optimization" a été accepté pour ICAIS 2026.',
        link: "/dashboard/articles",
        isRead: false,
      },
      {
        userId: sarah.id,
        type: "ARTICLE_STATUS_CHANGED",
        titre: "Relecture en cours",
        message:
          "Votre article sur la robustesse des ViT est entré en phase de relecture.",
        link: "/dashboard/articles",
        isRead: false,
      },
      {
        userId: augustin.id,
        type: "PROGRAM_UPDATED",
        titre: "Programme mis à jour",
        message: `Le programme de ${confs.icais2026.shortName} vient d'être mis à jour.`,
        link: `/conferences/${confs.icais2026.slug}`,
        isRead: false,
      },
    ],
  });
  console.log("   ✔ 5 notifications");
}

/* 
 *  10. AUDIT LOGS
 *  */

async function seedAuditLogs(
  users: Awaited<ReturnType<typeof seedUsers>>,
  confs: Awaited<ReturnType<typeof seedConferences>>
) {
  console.log("Création des audit logs…");

  const admin = users["hiheaaugusto@gmail.com"]!;
  const marie = users["marie.organisateur@utbm.fr"]!;
  const augustin = users["augustin@utbm.fr"]!;

  await prisma.auditLog.createMany({
    data: [
      {
        userId: marie.id,
        action: "CREATE_CONFERENCE",
        entityType: "Conference",
        entityId: confs.icais2026.id,
        metadata: { slug: confs.icais2026.slug },
      },
      {
        userId: marie.id,
        action: "PUBLISH_CONFERENCE",
        entityType: "Conference",
        entityId: confs.icais2026.id,
      },
      {
        userId: augustin.id,
        action: "SUBMIT_ARTICLE",
        entityType: "Article",
        entityId: "marl-smartgrid",
      },
      {
        userId: augustin.id,
        action: "EMAIL_VERIFIED",
        entityType: "User",
        entityId: augustin.id,
      },
      {
        userId: admin.id,
        action: "LOGIN",
        ipAddress: "192.168.1.42",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    ],
  });
  console.log("   ✔ 5 audit logs");
}

/* 
 *  MAIN
 *  */

async function main() {
  console.log("\n  Seed ConferenceHub\n");

  await reset();
  const users = await seedUsers();
  const confs = await seedConferences(users);
  const sessions = await seedSessions(confs, users);
  await seedArticles(users, sessions);
  await seedInscriptions(users, confs);
  await seedFavorites(users, confs);
  await seedFaqs(confs);
  await seedNotifications(users, confs);
  await seedAuditLogs(users, confs);

  console.log("\n  Seed terminé !\n");
  console.log("   Comptes de test (mot de passe commun) :");
  console.log(`   `);
  console.log(`    Password : ${DEFAULT_PASSWORD}`);
  console.log(`   `);
  console.log(`    admin@conferencehub.fr              (ADMIN)`);
  console.log(`    marie.organisateur@utbm.fr          (ORGANISATEUR)`);
  console.log(`    pierre.organisateur@paris-saclay.fr (ORGANISATEUR)`);
  console.log(`    augustin@utbm.fr                    (CONFERENCIER)`);
  console.log(`    sarah.chercheuse@cnrs.fr            (CONFERENCIER)`);
  console.log(`    jean.martin@mit.edu                 (CONFERENCIER)`);
  console.log(`    lucie.etudiante@student.fr          (PARTICIPANT)`);
  console.log(`     karim.benali@enit.utm.tn            (PARTICIPANT)`);
  console.log(`     emma.dubois@utbm.fr                 (PARTICIPANT)`);
  console.log(`    test.pending@example.com            (PENDING_VERIFICATION)`);
  console.log();
}

main()
  .catch((err) => {
    console.error("\n  Seed échoué :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });