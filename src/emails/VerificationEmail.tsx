import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

export interface VerificationEmailProps {
  /** Prénom (ou nom complet) de l'utilisateur. */
  userName: string;
  /** Code à 6 chiffres. */
  otp: string;
  /** Durée de validité en minutes (default: 10). */
  expiresInMinutes?: number;
}

/**
 * E-mail de vérification d'adresse — OTP 6 chiffres.
 * Design sobre, code mis en évidence en gros caractères monospace espacés.
 */
export function VerificationEmail({
  userName,
  otp,
  expiresInMinutes = 10,
}: VerificationEmailProps) {
  // Découpe le code en 2 blocs de 3 chiffres pour la lisibilité
  const formatted = `${otp.slice(0, 3)} ${otp.slice(3)}`;

  return (
    <EmailLayout
      preview={`Votre code de vérification : ${otp}`}
    >
      <Heading className="m-0 text-[22px] font-bold text-slate-900">
        Vérification de votre adresse
      </Heading>

      <Text className="mt-4 text-[15px] leading-relaxed text-slate-700">
        Bonjour <strong>{userName}</strong>,
      </Text>

      <Text className="mt-3 text-[15px] leading-relaxed text-slate-700">
        Pour finaliser la création de votre compte ConferenceHub, merci de
        saisir le code de vérification ci-dessous sur la page de confirmation :
      </Text>

      {/* Bloc OTP */}
      <Section className="my-6 rounded-xl border border-solid border-brand-100 bg-brand-50 px-6 py-8 text-center">
        <Text className="m-0 text-[12px] font-semibold uppercase tracking-wider text-brand-700">
          Code de vérification
        </Text>
        <Text
          className="m-0 mt-3 font-mono text-[40px] font-bold leading-none tracking-[0.3em] text-brand-700"
          style={{ letterSpacing: "0.3em" }}
        >
          {formatted}
        </Text>
        <Text className="m-0 mt-4 text-[12px] text-slate-500">
          Valide pendant {expiresInMinutes} minutes
        </Text>
      </Section>

      <Text className="text-[14px] leading-relaxed text-slate-600">
        Pour des raisons de sécurité, ne partagez jamais ce code. L'équipe
        ConferenceHub ne vous le demandera jamais.
      </Text>

      <Text className="mt-6 text-[14px] leading-relaxed text-slate-600">
        Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet
        e-mail en toute sécurité.
      </Text>

      <Text className="mt-8 text-[14px] text-slate-500">
        Cordialement,
        <br />
        <strong className="text-slate-700">L'équipe ConferenceHub</strong>
      </Text>
    </EmailLayout>
  );
}


export default VerificationEmail;