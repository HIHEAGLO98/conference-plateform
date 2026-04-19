import {
  Button,
  Column,
  Heading,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

export interface ConferenceRegistrationEmailProps {
  /** Nom du participant. */
  participantName: string;
  /** Titre complet de la conférence. */
  conferenceTitle: string;
  /** Lieu de la conférence (ex: "Belfort, France"). */
  conferenceLocation: string;
  /** Date(s) de la conférence . */
  conferenceDate: string;
  /** URL absolue vers le tableau de bord / QR code. */
  dashboardUrl: string;
  /** Numéro / référence d'inscription (optionnel). */
  registrationReference?: string;
}

/**
 * E-mail de confirmation d'inscription à une conférence.
 * Inclut les infos pratiques + CTA vers le QR code du participant.
 */
export function ConferenceRegistrationEmail({
  participantName,
  conferenceTitle,
  conferenceLocation,
  conferenceDate,
  dashboardUrl,
  registrationReference,
}: ConferenceRegistrationEmailProps) {
  return (
    <EmailLayout
      preview={`Inscription confirmée : ${conferenceTitle}`}
    >
      <Heading className="m-0 text-[22px] font-bold text-slate-900">
        Inscription confirmée
      </Heading>

      <Text className="mt-4 text-[15px] leading-relaxed text-slate-700">
        Bonjour <strong>{participantName}</strong>,
      </Text>

      <Text className="mt-3 text-[15px] leading-relaxed text-slate-700">
        Nous confirmons votre inscription à la conférence suivante. Votre
        QR code d'accès est disponible dans votre tableau de bord.
      </Text>

      {/*  Carte récap conférence  */}
      <Section className="my-6 rounded-xl border-l-[4px] border-solid border-brand-600 bg-slate-50 px-6 py-5">
        <Text className="m-0 text-[12px] font-semibold uppercase tracking-wider text-brand-700">
          Votre conférence
        </Text>
        <Text className="m-0 mt-2 text-[17px] font-bold leading-tight text-slate-900">
          {conferenceTitle}
        </Text>

        <Row className="mt-4">
          <Column className="w-[90px] align-top">
            <Text className="m-0 text-[12px] font-semibold text-slate-500">
              Date
            </Text>
          </Column>
          <Column className="align-top">
            <Text className="m-0 text-[14px] text-slate-800">
              {conferenceDate}
            </Text>
          </Column>
        </Row>

        <Row className="mt-2">
          <Column className="w-[90px] align-top">
            <Text className="m-0 text-[12px] font-semibold text-slate-500">
              Lieu
            </Text>
          </Column>
          <Column className="align-top">
            <Text className="m-0 text-[14px] text-slate-800">
              {conferenceLocation}
            </Text>
          </Column>
        </Row>

        {registrationReference && (
          <Row className="mt-2">
            <Column className="w-[90px] align-top">
              <Text className="m-0 text-[12px] font-semibold text-slate-500">
                Référence
              </Text>
            </Column>
            <Column className="align-top">
              <Text className="m-0 font-mono text-[13px] text-slate-700">
                {registrationReference}
              </Text>
            </Column>
          </Row>
        )}
      </Section>

      {/* CTA  */}
      <Section className="my-6 text-center">
        <Button
          href={dashboardUrl}
          className="rounded-lg bg-brand-600 px-6 py-3 text-[14px] font-semibold text-white no-underline"
        >
          Accéder à mon QR code
        </Button>
        <Text className="m-0 mt-3 text-[12px] text-slate-500">
          Ou copiez ce lien :{" "}
          <span className="break-all text-slate-600">{dashboardUrl}</span>
        </Text>
      </Section>

      {/*  Infos pratiques */}
      <Text className="mt-6 text-[14px] font-semibold text-slate-800">
        À prévoir pour le jour J
      </Text>
      <Text className="mt-2 text-[14px] leading-relaxed text-slate-600">
        • Présentez le QR code (papier ou écran) à l'accueil
        <br />• Apportez une pièce d'identité
        <br />• Arrivez 15 min avant le début de la session d'ouverture
      </Text>

      <Text className="mt-8 text-[14px] text-slate-500">
        À très bientôt,
        <br />
        <strong className="text-slate-700">L'équipe ConferenceHub</strong>
      </Text>
    </EmailLayout>
  );
}

// Preview pour `npm run email`
// ConferenceRegistrationEmail.PreviewProps = {
//   participantName: "Augustin Hiheaglo",
//   conferenceTitle:
//     "International Conference on Artificial Intelligence Systems 2026",
//   conferenceLocation: "Belfort, France",
//   conferenceDate: "15 – 17 juin 2026",
//   dashboardUrl: "http://localhost:3000/dashboard/inscriptions",
//   registrationReference: "ICAIS-2026-A1B2C3",
// } satisfies ConferenceRegistrationEmailProps;

export default ConferenceRegistrationEmail;