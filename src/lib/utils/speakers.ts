export interface Speaker {
  id: string;
  nom: string;
  prenom: string;
  affiliation: string | null;
  avatarUrl: string | null;
  role: string;
  sessionCount: number;
}

export interface SessionLight {
  type: string;
  intervenants: string[];
}

const PRIORITY_BY_TYPE: Record<string, { score: number; role: string }> = {
  KEYNOTE: { score: 5, role: "Keynote Speaker" },
  PANEL: { score: 4, role: "Panéliste" },
  WORKSHOP: { score: 3, role: "Animateur d'atelier" },
  TALK: { score: 2, role: "Conférencier" },
  POSTER: { score: 1, role: "Présentation poster" },
  BREAK: { score: 0, role: "" },
};

export function extractSpeakers(sessions: SessionLight[]): Speaker[] {
  const map = new Map<string, { speaker: Speaker; topScore: number }>();

  for (const s of sessions) {
    if (!s.intervenants || s.intervenants.length === 0) continue;

    const priority = PRIORITY_BY_TYPE[s.type] ?? PRIORITY_BY_TYPE.TALK;
    if (priority.score === 0) continue;

    for (const intervenant of s.intervenants) {
      const fullName = intervenant.trim();
      if (!fullName) continue;

      const uniqueId = fullName.toLowerCase();
      const nameParts = fullName.split(" ");
      const prenom = nameParts[0] || "";
      const nom = nameParts.slice(1).join(" ") || "";

      const existing = map.get(uniqueId);
      
      if (!existing) {
        map.set(uniqueId, {
          speaker: {
            id: uniqueId,
            nom: nom,
            prenom: prenom,
            affiliation: null,
            avatarUrl: null,
            role: priority.role,
            sessionCount: 1,
          },
          topScore: priority.score,
        });
      } else {
        existing.speaker.sessionCount += 1;
        if (priority.score > existing.topScore) {
          existing.speaker.role = priority.role;
          existing.topScore = priority.score;
        }
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.topScore - a.topScore)
    .map((e) => e.speaker);
}