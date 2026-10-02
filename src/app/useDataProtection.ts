import { useEffect, useRef } from "react";
import { useFeedback } from "../shared/feedback/FeedbackProvider";
import { useI18n } from "../shared/i18n/I18nContext";
import {
    loadBackupReminderAt,
    loadLastBackupAt,
    loadPersistRequestedAt,
    saveBackupReminderAt,
    savePersistRequestedAt,
} from "../shared/services/storage/mentalWheelStorage";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Días con datos a partir de los que se recuerda hacer copia. */
const MIN_DAYS_WITH_DATA = 7;
/** Antigüedad de la última copia que dispara el recordatorio. */
const BACKUP_MAX_AGE_DAYS = 30;
/** Como mucho un recordatorio cada semana. */
const REMINDER_INTERVAL_DAYS = 7;

export function daysSince(time: number | null, now = Date.now()): number | null {
    return time === null ? null : Math.floor((now - time) / DAY_MS);
}

/** Decide si toca recordar la copia de seguridad (función pura, testeable). */
export function shouldRemindBackup(
    daysWithData: number,
    lastBackupAt: number | null,
    lastReminderAt: number | null,
    now = Date.now()
): boolean {
    if (daysWithData < MIN_DAYS_WITH_DATA) return false;
    const reminderAge = daysSince(lastReminderAt, now);
    if (reminderAge !== null && reminderAge < REMINDER_INTERVAL_DAYS) return false;
    const backupAge = daysSince(lastBackupAt, now);
    return backupAge === null || backupAge >= BACKUP_MAX_AGE_DAYS;
}

/**
 * Protección de los datos guardados en el navegador:
 * - pide almacenamiento persistente (para que el navegador no los borre) cuando ya hay datos;
 * - recuerda de vez en cuando exportar una copia de seguridad.
 */
export function useDataProtection(daysWithData: number, onExport: () => void): void {
    const { t } = useI18n();
    const { notify } = useFeedback();
    const remindedRef = useRef(false);
    const onExportRef = useRef(onExport);
    useEffect(() => {
        onExportRef.current = onExport;
    });

    useEffect(() => {
        if (daysWithData === 0 || loadPersistRequestedAt() !== null || !navigator.storage?.persist) return;
        savePersistRequestedAt();
        void navigator.storage.persisted().then((persisted) => {
            if (!persisted) void navigator.storage.persist();
        });
    }, [daysWithData]);

    useEffect(() => {
        if (remindedRef.current || !shouldRemindBackup(daysWithData, loadLastBackupAt(), loadBackupReminderAt())) return;
        const timer = window.setTimeout(() => {
            remindedRef.current = true;
            saveBackupReminderAt();
            const age = daysSince(loadLastBackupAt());
            notify({
                message: age === null ? t("backup.reminderNever") : t("backup.reminder", { days: age }),
                actionLabel: t("backup.export"),
                onAction: () => onExportRef.current(),
                persistent: true,
            });
        }, 2500);
        return () => window.clearTimeout(timer);
    }, [daysWithData, notify, t]);
}
