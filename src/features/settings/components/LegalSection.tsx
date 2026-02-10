import type { ThemeClasses } from "../../../shared/types/theme";

interface LegalSectionProps {
    theme: Pick<ThemeClasses, "inputAlt" | "border" | "text" | "textLight">;
}

export function LegalSection({ theme }: LegalSectionProps) {
    return (
        <div className={`mb-2 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className={`text-sm font-medium ${theme.text}`}>Aviso legal y privacidad</div>
            <p className={`text-xs ${theme.textLight} mt-2 leading-relaxed`}>
                Esta web es gratuita y no realiza trafico de datos personales hacia servidores del titular.
                No se usan cookies de analitica, publicidad ni perfiles de terceros.
            </p>
            <p className={`text-xs ${theme.textLight} mt-2 leading-relaxed`}>
                En la UE/EEE, la aplicacion utiliza unicamente almacenamiento local del navegador
                (localStorage, tecnologia similar a cookies tecnicas) para guardar tu configuracion y tus registros.
                Estos datos permanecen en tu dispositivo y solo se usan para mostrarte tus estadisticas.
            </p>
            <p className={`text-xs ${theme.textLight} mt-2 leading-relaxed`}>
                Si en el futuro se incorporan servicios de terceros o analitica no esencial, se solicitara
                consentimiento previo conforme al RGPD y la normativa ePrivacy aplicable.
            </p>
        </div>
    );
}
