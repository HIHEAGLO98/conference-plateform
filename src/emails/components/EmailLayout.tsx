import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Tailwind,
    Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface EmailLayoutProps {
    /** Texte court affiché dans l'aperçu de la boîte de réception. */
    preview: string;
    /** Contenu principal de l'e-mail. */
    children: ReactNode;
}

/**
 * Layout commun à tous les e-mails ConferenceHub.
 * - Header sobre avec nom de la plateforme
 * - Conteneur centré (max 600 px) adapté aux clients e-mail
 * - Footer légal + liens essentiels
 *
 * Les couleurs reprennent la charte (brand blue #2563eb).
 */
export function EmailLayout({ preview, children }: EmailLayoutProps) {
    return (
        <Html lang="fr">
            <Head />
            <Preview>{preview}</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: {
                                    50: "#eff6ff",
                                    100: "#dbeafe",
                                    500: "#3b82f6",
                                    600: "#2563eb",
                                    700: "#1d4ed8",
                                    900: "#1e3a8a",
                                },
                            },
                        },
                    },
                }}
            >
                <Body className="bg-slate-50 font-sans">
                    <Container className="mx-auto my-10 max-w-[600px] rounded-2xl border border-solid border-slate-200 bg-white">
                        {/*  Header  */}
                        <Section className="rounded-t-2xl bg-brand-600 px-8 py-6">
                            <Text className="m-0 text-[20px] font-bold leading-tight text-white">
                                ConferenceHub
                            </Text>
                            <Text className="m-0 mt-1 text-[12px] leading-tight text-brand-100">
                                Plateforme de conférences académiques internationales
                            </Text>
                        </Section>

                        {/*  Contenu */}
                        <Section className="px-8 py-8">{children}</Section>

                        {/* Footer  */}
                        <Hr className="mx-8 my-0 border-slate-200" />
                        <Section className="px-8 py-6">
                            <Text className="m-0 text-[12px] leading-relaxed text-slate-500">
                                Cet e-mail vous a été envoyé par{" "}
                                <strong className="text-slate-700">ConferenceHub</strong>.
                                Si vous n'êtes pas à l'origine de cette action, ignorez ce message.
                            </Text>
                            <Text className="m-0 mt-3 text-[12px] leading-relaxed text-slate-400">
                                © {new Date().getFullYear()} ConferenceHub ·{" "}
                                <Link
                                    href="https://conferencehub.fr/mentions-legales"
                                    className="text-slate-500 underline"
                                >
                                    Mentions légales
                                </Link>{" "}
                                ·{" "}
                                <Link
                                    href="https://conferencehub.fr/contact"
                                    className="text-slate-500 underline"
                                >
                                    Nous contacter
                                </Link>
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}