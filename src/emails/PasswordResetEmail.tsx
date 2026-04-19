import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

export interface PasswordResetEmailProps {
  /** Prénom (ou nom complet) de l'utilisateur. */
  userName: string;
  /** Code à 6 chiffres. */
  otp: string;
  /** Durée de validité en minutes (default: 10). */
  expiresInMinutes?: number;
}

/**
 * E-mail de réinitialisation de mot de passe — OTP 6 chiffres.
 * Même layout que VerificationEmail, message adapté + encart de sécurité.
 */
export function PasswordResetEmail({
  userName,
  otp,
  expiresInMinutes = 10,
}: PasswordResetEmailProps) {
  // Découpe le code en 2 blocs de 3 chiffres pour la lisibilité
  const formatted = `${otp.slice(0, 3)} ${otp.slice(3)}`;

  return (
    <EmailLayout
      preview={`Code de réinitialisation ConferenceHub : ${otp}`}
    >
      <Heading className="m-0 text-[22px] font-bold text-slate-900">
        Réinitialisation de votre mot de passe
      </Heading>

      <Text className="mt-4 text-[15px] leading-relaxed text-slate-700">
        Bonjour <strong>{userName}</strong>,
      </Text>

      <Text className="mt-3 text-[15px] leading-relaxed text-slate-700">
        Vous avez demandé à réinitialiser le mot de passe de votre compte
        ConferenceHub. Utilisez le code ci-dessous pour choisir un nouveau mot
        de passe :
      </Text>

      {/*  Bloc OTP  */}
      <Section className="my-6 rounded-xl border border-solid border-brand-100 bg-brand-50 px-6 py-8 text-center">
        <Text className="m-0 text-[12px] font-semibold uppercase tracking-wider text-brand-700">
          Code de réinitialisation
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

      {/*  Encart sécurité  */}
      <Section className="mt-6 rounded-xl border border-solid border-red-100 bg-red-50 px-5 py-4">
        <Text className="m-0 text-[13px] font-semibold text-red-700">
          Vous n'êtes pas à l'origine de cette demande ?
        </Text>
        <Text className="m-0 mt-1 text-[13px] leading-relaxed text-red-700">
          Ignorez simplement ce message - votre mot de passe actuel reste
          inchangé. Si vous pensez que votre compte est en danger, contactez
          rapidement notre équipe support.
        </Text>
      </Section>

      <Text className="mt-8 text-[14px] text-slate-500">
        Cordialement,
        <br />
        <strong className="text-slate-700">L'équipe ConferenceHub</strong>
      </Text>
    </EmailLayout>
  );
}

// Preview pour `npm run email` — données de test
PasswordResetEmail.PreviewProps = {
  userName: "Augustin Hiheaglo",
  otp: "715302",
  expiresInMinutes: 10,
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;