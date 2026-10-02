import {
    Activity, Anchor, Apple, Award, Baby, Banana, Banknote, Bath, Bed, Beer, Bell, BicepsFlexed, Bike, Bird, Book,
    BookHeart, BookOpen, Brain, Briefcase, BriefcaseBusiness, Brush, Building2, Bus, Cake, Calculator, Calendar,
    Camera, Car, Carrot, Castle, Cat, ChartLine, ChefHat, Cherry, Church, Citrus, Clapperboard, ClipboardList, Clock,
    CloudSun, Clover, Code, Coffee, Coins, Compass, Cookie, CreditCard, Croissant, Crown, CupSoda, Dice5, Dog, Drama,
    Droplet, Drum, Dumbbell, Earth, Egg, Eye, Feather, Film, Fish, Flag, FlaskConical, Flame, Flower, Flower2,
    Footprints, Frown, Fuel, Gamepad2, Gem, Gift, Globe, Goal, GraduationCap, Grape, Guitar, Hammer, HandCoins,
    HandHeart, HandHelping, Handshake, Headphones, Heart, HeartHandshake, HeartPulse, Hospital, Hotel, Hourglass, House,
    IceCreamCone, Infinity as InfinityIcon, Joystick, Key, Lamp, Languages, Laptop, Laugh, Leaf, Library, Lightbulb,
    Luggage, Map as MapIcon, MapPin, Medal, Meh, MessageCircle, Mic, Microscope, Milk, Monitor, Moon, Mountain, MountainSnow,
    Music, Newspaper, NotebookPen, Palette, PartyPopper, PawPrint, Pen, PenTool, Pencil, PersonStanding, Phone, Piano,
    PiggyBank, Pill, Pizza, Plane, Popcorn, Presentation, Puzzle, Radio, Rainbow, Receipt, Recycle, Rocket, Sailboat,
    Salad, Sandwich, Scale, School, Shell, Shield, ShieldPlus, Ship, Shirt, ShoppingBag, ShoppingCart, Skull,
    Smartphone, Smile, Snowflake, Sofa, Soup, Sparkles, Sprout, Star, Stethoscope, Store, Sun, Sunrise, Sunset,
    Swords, Syringe, Target, Telescope, Tent, Thermometer, Ticket, Timer, Tractor, Train, TreePalm, TreePine, Trees,
    Trophy, Tv, Umbrella, User, Users, UsersRound, Utensils, Vegan, Volleyball, Wallet, WashingMachine, Waves, Wind,
    Wine, Wrench, Zap,
    type LucideIcon,
} from "lucide-react";

export const ICON_CATEGORIES = [
    "people", "health", "sport", "mind", "work", "home", "leisure", "nature", "food", "other",
] as const;

export type IconCategory = (typeof ICON_CATEGORIES)[number];

export interface SectorIconDefinition {
    id: string;
    Icon: LucideIcon;
    category: IconCategory;
    /** Palabras de búsqueda (es/en), sin tildes. */
    keywords: string;
}

type Entry = [id: string, Icon: LucideIcon, keywords: string];

const BY_CATEGORY: Record<IconCategory, Entry[]> = {
    people: [
        ["house", House, "familia hogar casa family home"],
        ["users", Users, "amigos grupo gente friends group people"],
        ["users-round", UsersRound, "comunidad equipo community team"],
        ["user", User, "yo persona me person self"],
        ["baby", Baby, "bebe hijos crianza baby kids parenting"],
        ["heart-handshake", HeartHandshake, "apoyo cuidado support care"],
        ["handshake", Handshake, "acuerdo relaciones networking deal"],
        ["person-standing", PersonStanding, "persona postura person posture"],
        ["message-circle", MessageCircle, "conversacion hablar chat talk"],
        ["phone", Phone, "llamar telefono call phone"],
        ["gift", Gift, "regalo detalle gift present"],
        ["party-popper", PartyPopper, "fiesta celebrar party celebrate"],
        ["cake", Cake, "cumpleanos tarta birthday cake"],
        ["dog", Dog, "perro mascota dog pet"],
        ["cat", Cat, "gato mascota cat pet"],
        ["paw-print", PawPrint, "mascotas animales pets animals"],
    ],
    health: [
        ["heart-pulse", HeartPulse, "salud corazon pulso health heart"],
        ["activity", Activity, "actividad energia activity energy"],
        ["stethoscope", Stethoscope, "medico revision doctor checkup"],
        ["pill", Pill, "medicacion pastilla medication pill"],
        ["syringe", Syringe, "vacuna inyeccion vaccine injection"],
        ["hospital", Hospital, "hospital clinica clinic"],
        ["brain", Brain, "mente cerebro salud mental mind brain mental health"],
        ["eye", Eye, "vista ojos sight eyes"],
        ["bed", Bed, "sueno dormir descanso sleep rest"],
        ["moon", Moon, "noche sueno night sleep"],
        ["droplet", Droplet, "agua hidratacion water hydration"],
        ["apple", Apple, "fruta alimentacion fruit nutrition"],
        ["salad", Salad, "dieta comida sana diet healthy food"],
        ["scale", Scale, "peso equilibrio weight balance"],
        ["thermometer", Thermometer, "fiebre temperatura fever temperature"],
        ["shield-plus", ShieldPlus, "prevencion proteccion prevention protection"],
        ["smile", Smile, "feliz animo happy mood"],
        ["meh", Meh, "neutral animo neutral mood"],
        ["frown", Frown, "triste animo sad mood"],
        ["laugh", Laugh, "risa humor laugh"],
    ],
    sport: [
        ["dumbbell", Dumbbell, "gimnasio pesas gym weights"],
        ["biceps-flexed", BicepsFlexed, "fuerza musculo strength muscle"],
        ["bike", Bike, "bici ciclismo bicycle cycling"],
        ["footprints", Footprints, "caminar pasos correr walk steps run"],
        ["mountain", Mountain, "montana senderismo mountain hiking"],
        ["mountain-snow", MountainSnow, "esqui nieve ski snow"],
        ["waves", Waves, "natacion surf mar swimming sea"],
        ["volleyball", Volleyball, "voleibol pelota volleyball ball"],
        ["goal", Goal, "futbol porteria football soccer goal"],
        ["trophy", Trophy, "logro competicion trophy competition"],
        ["medal", Medal, "medalla reto medal challenge"],
        ["timer", Timer, "cronometro entreno timer training"],
        ["flame", Flame, "calorias intensidad racha calories streak"],
        ["zap", Zap, "energia potencia energy power"],
    ],
    mind: [
        ["sparkles", Sparkles, "bienestar magia wellbeing magic"],
        ["leaf", Leaf, "calma naturaleza calm nature"],
        ["flower", Flower, "flor autocuidado flower selfcare"],
        ["flower-2", Flower2, "meditacion flor meditation"],
        ["wind", Wind, "respiracion aire breathing air"],
        ["feather", Feather, "ligereza escritura lightness writing"],
        ["star", Star, "favorito estrella favorite star"],
        ["lightbulb", Lightbulb, "ideas creatividad ideas creativity"],
        ["target", Target, "metas objetivos goals"],
        ["compass", Compass, "rumbo proposito direction purpose"],
        ["hourglass", Hourglass, "tiempo paciencia time patience"],
        ["book-heart", BookHeart, "diario gratitud journal gratitude"],
        ["notebook-pen", NotebookPen, "diario notas journal notes"],
        ["hand-heart", HandHeart, "amabilidad voluntariado kindness volunteering"],
        ["sunrise", Sunrise, "manana rutina morning routine"],
        ["sunset", Sunset, "tarde desconexion evening unwind"],
        ["infinity", InfinityIcon, "constancia infinito consistency infinity"],
        ["church", Church, "espiritualidad religion spirituality faith"],
        ["clover", Clover, "suerte optimismo luck optimism"],
    ],
    work: [
        ["briefcase", Briefcase, "trabajo empleo work job"],
        ["briefcase-business", BriefcaseBusiness, "negocio empresa business company"],
        ["laptop", Laptop, "ordenador portatil computer"],
        ["monitor", Monitor, "pantalla oficina screen office"],
        ["code", Code, "programar codigo programming code"],
        ["graduation-cap", GraduationCap, "aprendizaje estudios universidad learning studies"],
        ["book-open", BookOpen, "lectura estudiar reading study"],
        ["book", Book, "libro lectura book reading"],
        ["library", Library, "biblioteca libros library books"],
        ["school", School, "colegio escuela school"],
        ["languages", Languages, "idiomas lenguas languages"],
        ["pen-tool", PenTool, "diseno dibujo design"],
        ["pencil", Pencil, "escribir tareas write tasks"],
        ["calculator", Calculator, "calculo cuentas math"],
        ["clipboard-list", ClipboardList, "tareas lista tasks todo"],
        ["calendar", Calendar, "agenda planificacion calendar planning"],
        ["clock", Clock, "horario puntualidad schedule time"],
        ["presentation", Presentation, "reuniones presentacion meeting presentation"],
        ["rocket", Rocket, "proyecto lanzamiento project launch"],
        ["chart-line", ChartLine, "progreso crecimiento progress growth"],
        ["microscope", Microscope, "ciencia investigacion science research"],
        ["flask-conical", FlaskConical, "laboratorio experimento lab experiment"],
        ["newspaper", Newspaper, "noticias actualidad news"],
    ],
    home: [
        ["piggy-bank", PiggyBank, "dinero ahorro money savings"],
        ["wallet", Wallet, "cartera gastos wallet expenses"],
        ["banknote", Banknote, "dinero billete money cash"],
        ["coins", Coins, "monedas finanzas coins finance"],
        ["hand-coins", HandCoins, "ingresos donar income donate"],
        ["credit-card", CreditCard, "tarjeta pagos card payments"],
        ["receipt", Receipt, "facturas recibos bills receipts"],
        ["shopping-cart", ShoppingCart, "compra supermercado shopping groceries"],
        ["shopping-bag", ShoppingBag, "compras tienda shopping store"],
        ["store", Store, "tienda negocio shop"],
        ["building-2", Building2, "ciudad oficina city office"],
        ["sofa", Sofa, "salon descanso couch rest"],
        ["lamp", Lamp, "hogar decoracion home decor"],
        ["key", Key, "llaves vivienda keys housing"],
        ["hammer", Hammer, "bricolaje reparar diy repair"],
        ["wrench", Wrench, "mantenimiento arreglos maintenance fix"],
        ["washing-machine", WashingMachine, "colada tareas laundry chores"],
        ["bath", Bath, "bano relax bath"],
        ["shirt", Shirt, "ropa armario clothes"],
        ["car", Car, "coche conducir car drive"],
        ["fuel", Fuel, "gasolina combustible fuel"],
        ["bus", Bus, "autobus transporte bus transport"],
        ["train", Train, "tren viaje train"],
        ["smartphone", Smartphone, "movil pantallas phone screens"],
        ["recycle", Recycle, "reciclar sostenible recycle sustainable"],
    ],
    leisure: [
        ["gamepad-2", Gamepad2, "ocio videojuegos leisure games"],
        ["joystick", Joystick, "juegos retro games"],
        ["dice-5", Dice5, "juegos de mesa dados board games dice"],
        ["puzzle", Puzzle, "puzle rompecabezas puzzle"],
        ["music", Music, "musica canciones music songs"],
        ["headphones", Headphones, "escuchar podcast listen"],
        ["guitar", Guitar, "guitarra tocar guitar play"],
        ["piano", Piano, "piano teclado keyboard"],
        ["drum", Drum, "bateria tambor drums"],
        ["mic", Mic, "cantar karaoke sing"],
        ["radio", Radio, "radio emisora"],
        ["film", Film, "cine peliculas cinema movies"],
        ["clapperboard", Clapperboard, "series rodaje shows filming"],
        ["tv", Tv, "television series tv shows"],
        ["popcorn", Popcorn, "palomitas cine popcorn movies"],
        ["ticket", Ticket, "eventos entradas events tickets"],
        ["drama", Drama, "teatro arte theatre"],
        ["camera", Camera, "fotografia fotos photography"],
        ["palette", Palette, "pintura arte painting art"],
        ["brush", Brush, "manualidades crafts"],
        ["swords", Swords, "rol fantasia roleplay fantasy"],
        ["castle", Castle, "fantasia historia fantasy history"],
        ["skull", Skull, "rock terror horror"],
        ["crown", Crown, "logros reina rey achievements"],
    ],
    nature: [
        ["tree-pine", TreePine, "bosque pino forest"],
        ["trees", Trees, "parque naturaleza park nature"],
        ["sprout", Sprout, "crecimiento jardin growth garden"],
        ["tent", Tent, "acampada camping camp"],
        ["map", MapIcon, "viajes ruta travel route"],
        ["map-pin", MapPin, "lugar destino place destination"],
        ["globe", Globe, "mundo viajar world travel"],
        ["earth", Earth, "planeta ecologia planet ecology"],
        ["plane", Plane, "avion vacaciones plane holidays"],
        ["luggage", Luggage, "maleta viaje suitcase trip"],
        ["ship", Ship, "barco crucero ship cruise"],
        ["sailboat", Sailboat, "vela navegar sailing"],
        ["anchor", Anchor, "mar puerto sea harbour"],
        ["tree-palm", TreePalm, "playa vacaciones beach holidays"],
        ["umbrella", Umbrella, "lluvia playa rain beach"],
        ["shell", Shell, "playa concha beach shell"],
        ["sun", Sun, "sol verano sun summer"],
        ["cloud-sun", CloudSun, "tiempo clima weather"],
        ["snowflake", Snowflake, "invierno nieve winter snow"],
        ["rainbow", Rainbow, "arcoiris esperanza rainbow hope"],
        ["fish", Fish, "pesca peces fishing fish"],
        ["bird", Bird, "aves pajaros birds"],
        ["tractor", Tractor, "campo huerto farm countryside"],
        ["telescope", Telescope, "astronomia estrellas astronomy stars"],
    ],
    food: [
        ["utensils", Utensils, "comer comida eat food"],
        ["chef-hat", ChefHat, "cocinar recetas cook recipes"],
        ["coffee", Coffee, "cafe desayuno coffee breakfast"],
        ["soup", Soup, "sopa cena soup dinner"],
        ["sandwich", Sandwich, "bocadillo almuerzo sandwich lunch"],
        ["pizza", Pizza, "pizza comida rapida fast food"],
        ["vegan", Vegan, "vegano vegetal vegan plant"],
        ["carrot", Carrot, "verdura hortalizas vegetables"],
        ["cherry", Cherry, "fruta cereza fruit cherry"],
        ["citrus", Citrus, "citricos naranja citrus orange"],
        ["grape", Grape, "uvas fruta grapes"],
        ["banana", Banana, "platano fruta banana"],
        ["egg", Egg, "huevo proteina egg protein"],
        ["milk", Milk, "leche lacteos milk dairy"],
        ["croissant", Croissant, "desayuno bolleria breakfast pastry"],
        ["cookie", Cookie, "dulces galleta sweets cookie"],
        ["ice-cream-cone", IceCreamCone, "helado postre ice cream dessert"],
        ["cup-soda", CupSoda, "refresco bebida soda drink"],
        ["wine", Wine, "vino copa wine"],
        ["beer", Beer, "cerveza bar beer"],
    ],
    other: [
        ["heart", Heart, "amor pareja love partner"],
        ["gem", Gem, "valor especial value special"],
        ["award", Award, "premio reconocimiento award recognition"],
        ["flag", Flag, "meta reto goal challenge"],
        ["shield", Shield, "seguridad limites safety boundaries"],
        ["bell", Bell, "recordatorio aviso reminder"],
        ["pen", Pen, "firmar escribir sign write"],
        ["hand-helping", HandHelping, "ayudar servicio help service"],
        ["hotel", Hotel, "hotel alojamiento lodging"],
    ],
};

export const SECTOR_ICONS: readonly SectorIconDefinition[] = ICON_CATEGORIES.flatMap((category) =>
    BY_CATEGORY[category].map(([id, Icon, keywords]) => ({ id, Icon, category, keywords }))
);

const ICONS_BY_ID = new Map(SECTOR_ICONS.map((icon) => [icon.id, icon]));

export function getSectorIcon(id: string | undefined): SectorIconDefinition | undefined {
    return id ? ICONS_BY_ID.get(id) : undefined;
}

/** Iconos de los sectores predefinidos, en el mismo orden que sus nombres. */
export const DEFAULT_SECTOR_ICONS = [
    "house", "users", "piggy-bank", "heart", "briefcase", "heart-pulse", "gamepad-2", "graduation-cap",
] as const;

function normalize(text: string): string {
    return text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function searchSectorIcons(query: string, category?: IconCategory | null): SectorIconDefinition[] {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return SECTOR_ICONS.filter((icon) =>
        (!category || icon.category === category)
        && terms.every((term) => icon.keywords.includes(term) || icon.id.includes(term))
    );
}
