import type { ThemeClasses } from "../../../shared/types/theme";
import { useI18n } from "../../../shared/i18n/I18nContext";

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
    const { t } = useI18n();
    const sectorName = tutorialSectorName ?? "...";

    return (
        <>
            {tutorialStep === 1 && (
                <div className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-sm" style={{ top: "200px", left: "50%", transform: "translateX(-50%)" }}>
                    <p className={`${theme.text} text-sm sm:text-lg text-center`}>
                        {t("tutorial.step1.title")}
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        {t("tutorial.step1.body")} <b>{sectorName}</b>?
                    </p>
                    <p className="text-xs text-center mt-4">
                        {t("tutorial.step1.cta", { sectorName })}
                    </p>
                </div>
            )}

            {tutorialStep === 2 && (
                <div className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-sm" style={{ top: "200px", left: "50%", transform: "translateX(-50%)" }}>
                    <p className={`${theme.text} text-sm sm:text-lg text-center`}>
                        {t("tutorial.step2.title")}
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        {isTouchDevice ? t("tutorial.step2.bodyTouch") : t("tutorial.step2.bodyMouse")}
                    </p>
                    <p className="text-xs text-center mt-4">
                        {t("tutorial.step2.cta", { sectorName })}
                    </p>
                </div>
            )}

            {tutorialStep === 3 && (
                <div className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-sm left-1/2" style={{ top: isTouchDevice ? "150px" : "200px", left: "50%", transform: "translateX(-50%)" }}>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify`}>
                        {t("tutorial.step3.p1")}
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        {isTouchDevice ? t("tutorial.step3.p2Touch") : t("tutorial.step3.p2Mouse")}
                    </p>
                    <p className="text-xs text-center mt-4">
                        {isTouchDevice ? t("tutorial.step3.ctaTouch") : t("tutorial.step3.ctaMouse")}
                    </p>
                </div>
            )}

            {tutorialStep === 4 && (
                <div
                    className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-sm"
                    style={isTouchDevice ? { top: "84px", left: "50%", transform: "translateX(-50%)" } : { top: "84px", right: "16px" }}
                >
                    <p className={`${theme.text} text-sm sm:text-lg text-center`}>
                        {t("tutorial.step4.title")}
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        {t("tutorial.step4.body")}
                    </p>
                    <div className="mt-4 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-white text-black p-2 sm:px-4 sm:py-2 shadow-lg border border-black/20">
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
                </div>
            )}

            {tutorialStep === 5 && (
                <div
                    className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-md left-1/2 -translate-x-1/2"
                    style={{ top: isTouchDevice ? "86px" : "96px" }}
                >
                    <p className={`${theme.text} text-sm sm:text-lg text-center`}>
                        {t("tutorial.step5.title")}
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        {t("tutorial.step5.body1")}
                    </p>
                    <p className={`${theme.text} text-sm sm:text-lg text-justify mt-3`}>
                        {isTouchDevice ? t("tutorial.step5.body2Touch") : t("tutorial.step5.body2Mouse")}
                    </p>
                </div>
            )}

            {tutorialStep === 6 && (
                <div className="fixed z-[70] pointer-events-none p-4 rounded-xl bg-red-500 shadow-lg w-[90%] max-w-sm left-1/2 bottom-24 -translate-x-1/2">
                    <p className={`${theme.text} text-sm sm:text-lg text-center`}>
                        {t("tutorial.step6.title")}
                    </p>
                    <p className={`${theme.text} text-sm sm:text-base text-justify mt-3`}>
                        {t("tutorial.step6.body")}
                    </p>
                </div>
            )}
        </>
    );
}
