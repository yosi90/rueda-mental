interface ThemeToggleProps {
    darkMode: boolean;
    onToggle: () => void;
}

export function ThemeToggle({ darkMode, onToggle }: ThemeToggleProps) {
    return (
        <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-300'} border`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className={`text-sm font-medium ${darkMode ? 'text-neutral-100' : 'text-neutral-900'}`}>
                        Tema
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                        {darkMode ? 'Modo oscuro activado' : 'Modo claro activado'}
                    </div>
                </div>

                <button
                    onClick={onToggle}
                    className={`padding-esp relative inline-flex h-8 w-14 items-center justify-start rounded-full transition-colors ${darkMode ? 'bg-neutral-600' : 'bg-neutral-300'
                        }`}
                >
                    <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'
                            }`}
                    >
                        {darkMode ? (
                            <svg className="h-6 w-6 p-1 text-neutral-900" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                        ) : (
                            <svg className="h-6 w-6 p-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                    </span>
                </button>
            </div>
        </div>
    );
}