import { useI18n } from "../../../shared/i18n/I18nContext";

interface TutorialOverlayProps {
    tutorialStep: number;
    isTouchDevice: boolean;
    tutorialSectorName?: string;
    onSkip: () => void;
}

export function TutorialOverlay({
    tutorialStep,
    isTouchDevice,
    tutorialSectorName,
    onSkip,
}: TutorialOverlayProps) {
    const { t } = useI18n();
    const sectorName = tutorialSectorName ?? "...";
    // Las burbujas no capturan el puntero (pointer-events-none); solo este botón sí.
    const skipButton = (
        <div className="mt-3 flex justify-end">
            <button
                type="button"
                onClick={onSkip}
                className="pointer-events-auto min-h-8 rounded-md px-2 text-xs font-semibold text-accent-fg underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-fg"
            >
                {t("tutorial.skip")}
            </button>
        </div>
    );

    return (
        <>
            {tutorialStep === 1 && (
                <div role="status" className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-accent-strong text-accent-fg shadow-lg w-[90%] max-w-sm" style={{ top: "200px", left: "50%", transform: "translateX(-50%)" }}>
                    <p className={`text-sm sm:text-lg text-center`}>
                        {t("tutorial.step1.title")}
                    </p>
                    <p className={`text-sm sm:text-lg text-justify mt-3`}>
                        {t("tutorial.step1.body")} <b>{sectorName}</b>?
                    </p>
                    <p className="text-xs text-center mt-4">
                        {t("tutorial.step1.cta", { sectorName })}
                    </p>
                    {skipButton}
                </div>
            )}

            {tutorialStep === 2 && (
                <div role="status" className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-accent-strong text-accent-fg shadow-lg w-[90%] max-w-sm" style={{ top: "200px", left: "50%", transform: "translateX(-50%)" }}>
                    <p className={`text-sm sm:text-lg text-center`}>
                        {t("tutorial.step2.title")}
                    </p>
                    <p className={`text-sm sm:text-lg text-justify mt-3`}>
                        {isTouchDevice ? t("tutorial.step2.bodyTouch") : t("tutorial.step2.bodyMouse")}
                    </p>
                    <p className="text-xs text-center mt-4">
                        {t("tutorial.step2.cta", { sectorName })}
                    </p>
                    {skipButton}
                </div>
            )}

            {tutorialStep === 3 && (
                <div role="status" className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-accent-strong text-accent-fg shadow-lg w-[90%] max-w-sm left-1/2" style={{ top: isTouchDevice ? "150px" : "200px", left: "50%", transform: "translateX(-50%)" }}>
                    <p className={`text-sm sm:text-lg text-justify`}>
                        {t("tutorial.step3.p1")}
                    </p>
                    <p className={`text-sm sm:text-lg text-justify mt-3`}>
                        {isTouchDevice ? t("tutorial.step3.p2Touch") : t("tutorial.step3.p2Mouse")}
                    </p>
                    <p className="text-xs text-center mt-4">
                        {isTouchDevice ? t("tutorial.step3.ctaTouch") : t("tutorial.step3.ctaMouse")}
                    </p>
                    {skipButton}
                </div>
            )}

            {tutorialStep === 4 && (
                <div
                    role="status" className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-accent-strong text-accent-fg shadow-lg w-[90%] max-w-sm"
                    style={isTouchDevice ? { top: "84px", left: "50%", transform: "translateX(-50%)" } : { top: "84px", right: "16px" }}
                >
                    <p className={`text-sm sm:text-lg text-center`}>
                        {t("tutorial.step4.title")}
                    </p>
                    <p className={`text-sm sm:text-lg text-justify mt-3`}>
                        {t("tutorial.step4.body")}
                    </p>
                    <div className="mt-4 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-fg p-2 sm:px-4 sm:py-2 shadow-lg border border-line">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="3" width="16" height="18" rx="2" />
                                <line x1="8" y1="8" x2="16" y2="8" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                                <line x1="8" y1="16" x2="14" y2="16" />
                            </svg>
                            <span className="text-xs sm:text-sm font-medium">{t("tutorial.step4.buttonLabel")}</span>
                        </div>
                    </div>
                    <p className="text-xs text-center mt-4">
                        {t("tutorial.step4.cta")}
                    </p>
                    {skipButton}
                </div>
            )}

            {tutorialStep === 5 && (
                <div
                    role="status" className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-accent-strong text-accent-fg shadow-lg w-[90%] max-w-md left-1/2 -translate-x-1/2"
                    style={{ top: isTouchDevice ? "86px" : "96px" }}
                >
                    <p className={`text-sm sm:text-lg text-center`}>
                        {t("tutorial.step5.title")}
                    </p>
                    <p className={`text-sm sm:text-lg text-justify mt-3`}>
                        {t("tutorial.step5.body1")}
                    </p>
                    <p className={`text-sm sm:text-lg text-justify mt-3`}>
                        {isTouchDevice ? t("tutorial.step5.body2Touch") : t("tutorial.step5.body2Mouse")}
                    </p>
                    {skipButton}
                </div>
            )}

            {tutorialStep === 6 && (
                <div role="status" className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-accent-strong text-accent-fg shadow-lg w-[90%] max-w-sm left-1/2 bottom-24 -translate-x-1/2">
                    <p className={`text-sm sm:text-lg text-center`}>
                        {t("tutorial.step6.title")}
                    </p>
                    <p className={`text-sm sm:text-base text-justify mt-3`}>
                        {t("tutorial.step6.body")}
                    </p>
                </div>
            )}
        </>
    );
}
