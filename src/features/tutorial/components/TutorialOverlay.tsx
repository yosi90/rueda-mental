import type { ThemeClasses } from "../../../shared/types/theme";

interface TutorialOverlayProps {
    tutorialStep: number;
    isTouchDevice: boolean;
    tutorialSectorName?: string;
    theme: Pick<ThemeClasses, "text">;
}

export function TutorialOverlay({
    tutorialStep,
    isTouchDevice,
    tutorialSectorName,
    theme,
}: TutorialOverlayProps) {
    return (
        <>
            {tutorialStep === 1 && (
                <div className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-sm" style={{ top: "200px", left: "50%", transform: "translateX(-50%)" }}>
                    <p className={`${theme.text} text-sm sm:text-lg text-center`}>
                        Bienvenido a Día a día.
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        Esta web te ayudará a llevar un histórico de tu desempeño diario en distintas áreas. Para comenzar, ¿Cómo crees que te ha ido hoy con <b>{tutorialSectorName}</b>?
                    </p>
                    <p className="text-xs text-center mt-4">
                        Puntúa <b>{tutorialSectorName}?</b> para seguir adelante.
                    </p>
                </div>
            )}

            {tutorialStep === 2 && (
                <div className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-sm" style={{ top: "200px", left: "50%", transform: "translateX(-50%)" }}>
                    <p className={`${theme.text} text-sm sm:text-lg text-center`}>
                        ¡Bien hecho!
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        Ahora, si {isTouchDevice ? "mantienes pulsado" : "haces clic derecho"} sobre el sector, podrás abrir su menú.
                    </p>
                    <p className="text-xs text-center mt-4">
                        Abré el menú de <b>{tutorialSectorName}?</b> para seguir adelante.
                    </p>
                </div>
            )}

            {tutorialStep === 3 && (
                <div className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-sm left-1/2" style={{ top: isTouchDevice ? "150px" : "200px", left: "50%", transform: "translateX(-50%)" }}>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify`}>
                        Perfecto, aquí podrás modificar su nombre y la puntuación, añadirle una nota para ese día y hasta eliminarlo.
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        Recuerda que puedes acceder también a la configuración general con el botón de arriba a la derecha y gestionar desde ahí todos los sectores.
                        Ahora puedes cerrar el menú {isTouchDevice ? "tocando fuera" : "haciendo clic fuera"} de él.
                    </p>
                    <p className="text-xs text-center mt-4">
                        {isTouchDevice ? "Pulsa fuera" : "haz clic fuera"} del menú para cerrarlo.
                    </p>
                </div>
            )}

            {tutorialStep === 4 && (
                <div
                    className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-sm"
                    style={isTouchDevice ? { top: "84px", left: "50%", transform: "translateX(-50%)" } : { top: "84px", right: "16px" }}
                >
                    <p className={`${theme.text} text-sm sm:text-lg text-center`}>
                        Seguimos.
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        Ahora pulsa el botón de <b>Resumen del día</b> (arriba a la derecha) para abrir el panel donde podrás registrar cómo te fue hoy.
                    </p>
                    <div className="mt-4 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-white text-black p-2 sm:px-4 sm:py-2 shadow-lg border border-black/20">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="3" width="16" height="18" rx="2" />
                                <line x1="8" y1="8" x2="16" y2="8" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                                <line x1="8" y1="16" x2="14" y2="16" />
                            </svg>
                            <span className="text-xs sm:text-sm font-medium">Resumen del día</span>
                        </div>
                    </div>
                    <p className="text-xs text-center mt-4">
                        Abre el resumen para continuar.
                    </p>
                </div>
            )}

            {tutorialStep === 5 && (
                <div
                    className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-md left-1/2 -translate-x-1/2"
                    style={{ top: isTouchDevice ? "86px" : "96px" }}
                >
                    <p className={`${theme.text} text-sm sm:text-lg text-center`}>
                        Este es tu resumen diario.
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        Aquí puedes guardar <b>lo bueno</b>, <b>lo malo</b> y <b>cómo afrontaste lo malo</b>. Se guarda automáticamente para la fecha seleccionada.
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        Para seguir, ciérralo con la equis, con el botón <b>Cerrar</b> o {isTouchDevice ? "tocando fuera de la ventana" : "haciendo clic fuera de la ventana"}.
                    </p>
                </div>
            )}

            {tutorialStep === 6 && (
                <div className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-sm left-1/2 bottom-24 -translate-x-1/2">
                    <p className={`${theme.text} text-sm sm:text-lg text-center`}>
                        ¡Enhorabuena! Has finalizado el tutorial.
                    </p>
                    <p className={`${theme.text} text-sm sm:text-base text-justify mt-3`}>
                        Antes de que comiences a usar la web, recuerda que tus datos se guardan únicamente en tu dispositivo, de forma 100% privada y solo se usan localmente para mostrarte estadísticas sobre tu rendimiento.
                    </p>
                </div>
            )}
        </>
    );
}
