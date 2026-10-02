import { useI18n } from "../../../shared/i18n/I18nContext";
import { theme } from "../../../shared/theme/theme";

/** Indicador mientras se descarga el código de las estadísticas (solo si no se precargó a tiempo). */
export function StatsLoading({ onClose }: { onClose: () => void }) {
    const { t } = useI18n();
    return (
        <>
            <div className={`fixed inset-0 ${theme.overlay} z-50`} onClick={onClose} aria-hidden="true" />
            <div
                role="status"
                className={`fixed left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl ${theme.cardSolid} ${theme.text}`}
            >
                <span className="h-5 w-5 rounded-full border-2 border-line border-t-accent motion-safe:animate-spin" aria-hidden="true" />
                <span className="text-sm font-medium">{t("stats.loading")}</span>
            </div>
        </>
    );
}

/** Huecos con la forma de las gráficas mientras se dibujan por primera vez. */
export function StatsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-6" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className={`rounded-xl border ${theme.border} p-4 bg-chart-card`}>
                    <div className="mb-4 h-5 w-48 rounded bg-subtle motion-safe:animate-pulse" />
                    <div className="h-[250px] rounded-lg bg-subtle motion-safe:animate-pulse" />
                </div>
            ))}
        </div>
    );
}
