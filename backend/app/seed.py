"""Fills the reference tables. Safe to run again: rows are matched and updated, never duplicated."""

from datetime import date, timedelta

from .auth import hash_password
from .database import Base, SessionLocal, engine
from .models import Activity, City, Stop, StopActivity, Trip, User

DEMO_EMAIL = "demo@globetrotter.app"
DEMO_PASSWORD = "Demo@1234"

SAMPLE_TRIP = "Rajasthan in a week"

# city, nights, transport to reach it, and the activities to plan there (day offset from arrival)
SAMPLE_STOPS = [
    ("Delhi", 2, 4500, [("Old Delhi food trail", 0, "10:00"), ("Humayun's Tomb guided visit", 1, "15:30")]),
    ("Jaipur", 3, 1800, [("Amber Fort and Sheesh Mahal", 0, "09:00"), ("Rajasthani thali at a haveli", 1, "20:00")]),
    ("Udaipur", 2, 2200, [("Lake Pichola sunset boat ride", 0, "17:30"), ("City Palace and Crystal Gallery", 1, "11:00")]),
]

# name, country, region, cost_index, popularity, stay per day, meals per day (INR)
CITIES = [
    ("Mumbai", "India", "Asia", 3, 86, 4200, 900),
    ("Delhi", "India", "Asia", 2, 88, 3600, 800),
    ("Jaipur", "India", "Asia", 2, 82, 3000, 700),
    ("Goa", "India", "Asia", 3, 90, 4500, 950),
    ("Udaipur", "India", "Asia", 2, 74, 3200, 750),
    ("Varanasi", "India", "Asia", 1, 70, 2000, 500),
    ("Kochi", "India", "Asia", 2, 68, 2800, 700),
    ("Rishikesh", "India", "Asia", 1, 66, 1800, 500),
    ("Darjeeling", "India", "Asia", 1, 60, 2200, 550),
    ("Bengaluru", "India", "Asia", 3, 64, 4000, 900),
    ("Bangkok", "Thailand", "Asia", 2, 92, 3800, 900),
    ("Singapore", "Singapore", "Asia", 5, 85, 11000, 2200),
    ("Tokyo", "Japan", "Asia", 5, 94, 10500, 2400),
    ("Kyoto", "Japan", "Asia", 4, 84, 8800, 2000),
    ("Ubud", "Indonesia", "Asia", 2, 91, 4200, 1000),
    ("Kathmandu", "Nepal", "Asia", 1, 65, 2400, 700),
    ("Colombo", "Sri Lanka", "Asia", 2, 58, 3400, 900),
    ("Dubai", "United Arab Emirates", "Asia", 4, 89, 9500, 2200),
    ("Hong Kong", "China", "Asia", 4, 80, 9800, 1900),
    ("Seoul", "South Korea", "Asia", 4, 83, 7800, 1700),
    ("Paris", "France", "Europe", 5, 96, 12500, 2800),
    ("London", "United Kingdom", "Europe", 5, 95, 13500, 3000),
    ("Rome", "Italy", "Europe", 4, 90, 9500, 2400),
    ("Barcelona", "Spain", "Europe", 4, 88, 8800, 2200),
    ("Amsterdam", "Netherlands", "Europe", 4, 84, 11000, 2600),
    ("Prague", "Czechia", "Europe", 3, 79, 6000, 1500),
    ("Vienna", "Austria", "Europe", 4, 76, 8500, 2100),
    ("Lisbon", "Portugal", "Europe", 3, 82, 7000, 1700),
    ("Santorini", "Greece", "Europe", 4, 87, 11500, 2500),
    ("Zurich", "Switzerland", "Europe", 5, 72, 16000, 3600),
    ("Istanbul", "Turkiye", "Europe", 2, 86, 5200, 1300),
    ("New York", "United States", "Americas", 5, 95, 18000, 3600),
    ("San Francisco", "United States", "Americas", 5, 81, 17000, 3400),
    ("Toronto", "Canada", "Americas", 4, 74, 11500, 2600),
    ("Mexico City", "Mexico", "Americas", 2, 78, 5000, 1300),
    ("Rio de Janeiro", "Brazil", "Americas", 3, 80, 6200, 1500),
    ("Buenos Aires", "Argentina", "Americas", 2, 71, 4800, 1200),
    ("Cusco", "Peru", "Americas", 2, 73, 4000, 1100),
    ("Cairo", "Egypt", "Africa", 2, 77, 4200, 1000),
    ("Marrakech", "Morocco", "Africa", 2, 75, 4600, 1100),
    ("Cape Town", "South Africa", "Africa", 3, 79, 6500, 1500),
    ("Nairobi", "Kenya", "Africa", 2, 62, 5200, 1300),
    ("Zanzibar City", "Tanzania", "Africa", 2, 63, 4800, 1200),
    ("Sydney", "Australia", "Oceania", 5, 87, 12500, 2900),
    ("Melbourne", "Australia", "Oceania", 4, 78, 11000, 2600),
    ("Auckland", "New Zealand", "Oceania", 4, 70, 10000, 2400),
    ("Queenstown", "New Zealand", "Oceania", 4, 72, 11500, 2600),
]

# city -> (activity, category, cost INR, hours, description)
ACTIVITIES = {
    "Mumbai": [
        ("Gateway of India and Colaba walk", "sightseeing", 0, 2, "Waterfront arch, Taj facade and the lanes behind Colaba Causeway."),
        ("Elephanta Caves ferry trip", "culture", 1200, 5, "Boat to the island and a climb to the rock-cut Shiva temples."),
        ("Bandra street food crawl", "food", 900, 3, "Vada pav, kebabs and cutting chai around Hill Road."),
        ("Marine Drive sunset cycle", "adventure", 700, 2, "Rented cycle along the sea face as the lights come on."),
        ("Colaba Causeway market", "shopping", 500, 2, "Bargain stalls for silver, fabric and souvenirs."),
    ],
    "Delhi": [
        ("Red Fort and Chandni Chowk", "sightseeing", 650, 3, "Mughal fort, then the spice lanes of the old city."),
        ("Humayun's Tomb guided visit", "culture", 600, 2, "The garden tomb that set the pattern for the Taj Mahal."),
        ("Old Delhi food trail", "food", 1100, 3, "Parathe wali gali, kebabs at Jama Masjid and jalebi to finish."),
        ("Qutub Minar evening visit", "sightseeing", 600, 2, "Twelfth-century minaret and the rust-free iron pillar."),
        ("Dilli Haat crafts market", "shopping", 300, 2, "State-wise handicraft stalls and regional food counters."),
    ],
    "Jaipur": [
        ("Amber Fort and Sheesh Mahal", "sightseeing", 700, 4, "Hilltop fort with mirrored halls above Maota lake."),
        ("City Palace and Jantar Mantar", "culture", 900, 3, "Royal courtyards and the giant stone observatory next door."),
        ("Hot air balloon over Amer", "adventure", 9500, 3, "Sunrise flight above forts, step wells and village fields."),
        ("Rajasthani thali at a haveli", "food", 1400, 2, "Dal baati churma and laal maas served in a heritage courtyard."),
        ("Johari Bazaar jewellery hunt", "shopping", 500, 2, "Kundan, lac bangles and block-printed cloth in the old bazaar."),
    ],
    "Goa": [
        ("Dudhsagar Falls jeep safari", "adventure", 3200, 6, "Forest track ride to the four-tier waterfall and a swim."),
        ("Old Goa churches walk", "culture", 400, 3, "Basilica of Bom Jesus and the cathedrals around it."),
        ("Anjuna flea market", "shopping", 300, 3, "Wednesday stalls of clothes, records and trinkets near the cliff."),
        ("Beach shack seafood dinner", "food", 1600, 2, "Grilled kingfish and prawn balchao with your feet in the sand."),
        ("Mandovi sunset cruise", "nightlife", 1200, 2, "River cruise with live folk music and a lit-up skyline."),
    ],
    "Udaipur": [
        ("City Palace and Crystal Gallery", "culture", 800, 3, "Lakeside palace museum with the royal crystal collection."),
        ("Lake Pichola sunset boat ride", "sightseeing", 700, 2, "Slow loop past Jag Mandir with the ghats turning gold."),
        ("Bagore Ki Haveli folk show", "culture", 250, 2, "Rajasthani dance and puppetry in a restored haveli courtyard."),
        ("Home cooking class", "food", 1800, 3, "Learn gatte ki sabzi and fresh masala from a local family."),
        ("Monsoon Palace viewpoint", "sightseeing", 600, 2, "Hilltop drive for the widest view over the lakes."),
    ],
    "Varanasi": [
        ("Ganga Aarti at Dashashwamedh", "culture", 0, 2, "Evening fire ritual performed on the main ghat."),
        ("Sunrise boat ride on the ghats", "sightseeing", 800, 2, "Row past bathers and burning ghats in first light."),
        ("Sarnath half-day trip", "culture", 900, 4, "Where the Buddha gave his first sermon, plus the museum."),
        ("Banarasi silk weaving visit", "shopping", 400, 2, "Watch handloom brocade being woven, then buy at the source."),
        ("Kachori and chaat walk", "food", 700, 3, "Morning kachori sabzi, tamatar chaat and a clay-cup lassi."),
    ],
    "Kochi": [
        ("Fort Kochi heritage walk", "sightseeing", 0, 2, "Chinese fishing nets, Dutch cemetery and colonial streets."),
        ("Kathakali performance", "culture", 500, 2, "Arrive early to watch the make-up go on before the story."),
        ("Backwater houseboat cruise", "adventure", 3500, 6, "Day boat through Alleppey canals with lunch on board."),
        ("Mattancherry spice market", "shopping", 200, 2, "Pepper and cardamom godowns, then the antique shops of Jew Town."),
        ("Kerala seafood cooking class", "food", 2000, 3, "Buy from the fish market, then cook it in coconut and curry leaf."),
    ],
    "Rishikesh": [
        ("Ganga white water rafting", "adventure", 1500, 4, "Sixteen kilometres of grade two and three rapids."),
        ("Sunrise riverside yoga", "culture", 600, 2, "Open-air hatha session on a ghat before the town wakes."),
        ("Beatles Ashram and Ram Jhula", "sightseeing", 300, 3, "Painted meditation domes and the suspension bridges."),
        ("Bungee jump at Mohan Chatti", "adventure", 3700, 2, "Eighty-three metre jump from a cantilever platform."),
        ("Parmarth Niketan aarti", "culture", 0, 2, "Chanting and lamps by the river at dusk."),
    ],
    "Darjeeling": [
        ("Tiger Hill sunrise", "sightseeing", 500, 3, "Pre-dawn drive for first light on Kanchenjunga."),
        ("Toy train joy ride", "culture", 1600, 3, "Steam ride on the Darjeeling Himalayan Railway to Ghum."),
        ("Tea estate tour and tasting", "food", 400, 2, "Plucking, withering and a flight of first and second flush."),
        ("Batasia Loop and war memorial", "sightseeing", 100, 2, "Spiral railway loop with a garden and mountain view."),
        ("Singalila ridge day trek", "adventure", 2500, 7, "Rhododendron forest walk along the Nepal border ridge."),
    ],
    "Bengaluru": [
        ("Lalbagh morning walk", "sightseeing", 100, 2, "Glasshouse, rock outcrop and the city's oldest trees."),
        ("Bangalore Palace tour", "culture", 500, 2, "Tudor-style palace with an audio guide through the royal rooms."),
        ("Craft brewery evening", "nightlife", 2200, 3, "Taproom hopping around Church Street and Indiranagar."),
        ("Nandi Hills sunrise drive", "adventure", 1800, 5, "Early drive out of town for cloud-level views."),
        ("Commercial Street shopping", "shopping", 400, 3, "Street-side fashion, silk and silver in one busy stretch."),
    ],
    "Bangkok": [
        ("Grand Palace and Wat Phra Kaew", "culture", 1600, 3, "Gilded throne halls and the Emerald Buddha."),
        ("Chao Phraya dinner cruise", "food", 2800, 3, "Thai buffet as the temples slide past, lit up."),
        ("Chatuchak weekend market", "shopping", 300, 4, "Fifteen thousand stalls, from plants to vintage denim."),
        ("Thai cooking class", "food", 2500, 4, "Market shopping then green curry and tom yum from scratch."),
        ("Khao San Road bar hop", "nightlife", 1800, 3, "Street bars, live bands and late night pad thai."),
    ],
    "Singapore": [
        ("Gardens by the Bay domes", "sightseeing", 1800, 3, "Cloud Forest waterfall and the Supertree light show."),
        ("Universal Studios Sentosa", "adventure", 5200, 7, "Full day of rides and shows on the island."),
        ("Hawker dinner at Lau Pa Sat", "food", 900, 2, "Satay street, chicken rice and chilli crab under iron arches."),
        ("Night Safari", "adventure", 3200, 4, "Tram ride through nocturnal animal habitats."),
        ("Orchard Road shopping", "shopping", 800, 3, "Two kilometres of malls end to end."),
    ],
    "Tokyo": [
        ("Senso-ji and Nakamise street", "culture", 0, 3, "Tokyo's oldest temple and the snack lane leading to it."),
        ("teamLab digital art museum", "culture", 2600, 3, "Room-scale projections you walk straight into."),
        ("Tsukiji outer market food walk", "food", 2200, 3, "Tamagoyaki, uni and knife shops at the old fish market."),
        ("Shibuya and Shinjuku by night", "nightlife", 0, 3, "Scramble crossing, Golden Gai alleys and neon backstreets."),
        ("Tokyo Skytree deck", "sightseeing", 1900, 2, "Three hundred and fifty metres up, Fuji on a clear day."),
    ],
    "Kyoto": [
        ("Fushimi Inari torii hike", "sightseeing", 0, 3, "Thousands of vermilion gates up the shrine mountain."),
        ("Kinkaku-ji golden pavilion", "culture", 400, 2, "Gold-leaf pavilion reflected in its mirror pond."),
        ("Arashiyama bamboo and monkeys", "sightseeing", 700, 4, "Bamboo grove walk plus the hilltop macaque park."),
        ("Tea ceremony in Gion", "culture", 3000, 2, "Matcha whisked for you in a machiya tea room."),
        ("Nishiki Market tasting walk", "food", 1800, 2, "Pickles, soy doughnuts and tofu down the covered arcade."),
    ],
    "Ubud": [
        ("Uluwatu temple and Kecak dance", "culture", 900, 4, "Clifftop temple at sunset with the fire-and-chant performance."),
        ("Rice terrace cycling", "adventure", 2400, 5, "Downhill ride through Tegallalang villages and paddy."),
        ("Mount Batur sunrise trek", "adventure", 4200, 8, "Two-hour climb in the dark for sunrise above the caldera."),
        ("Balinese cooking class", "food", 2600, 4, "Grind your own spice paste, then cook sate lilit and lawar."),
        ("Seminyak beach club evening", "nightlife", 2800, 4, "Day beds, DJ sets and the sunset over the strait."),
    ],
    "Kathmandu": [
        ("Pashupatinath and Boudhanath", "culture", 1200, 4, "Riverside cremation ghats and the great white stupa."),
        ("Swayambhunath stupa climb", "sightseeing", 400, 2, "Three hundred and sixty-five steps to the valley view."),
        ("Nagarkot sunrise viewpoint", "sightseeing", 2200, 6, "Ridge drive for the Himalayan skyline at dawn."),
        ("Thamel handicraft shopping", "shopping", 500, 2, "Pashmina, singing bowls and trekking gear."),
        ("Newari tasting in Patan", "food", 1400, 3, "Bara, choila and chatamari in the old Durbar Square lanes."),
    ],
    "Colombo": [
        ("Galle Face Green evening", "sightseeing", 0, 2, "Sea-front promenade with kite sellers and isso wade carts."),
        ("Colombo National Museum", "culture", 600, 2, "Royal regalia, masks and Kandyan-era bronzes."),
        ("Pettah bazaar walk", "shopping", 200, 2, "Street-by-street trade lanes and the Red Mosque."),
        ("Crab curry dinner", "food", 2200, 2, "Lagoon crab in pepper gravy with string hoppers."),
        ("Old Dutch Hospital evening", "nightlife", 1500, 3, "Colonial courtyard turned into bars and restaurants."),
    ],
    "Dubai": [
        ("Burj Khalifa At The Top", "sightseeing", 4200, 2, "Level 124 observation deck over the gulf and desert."),
        ("Desert safari with dune bashing", "adventure", 5500, 6, "Four-wheel drive over the dunes, camp dinner after."),
        ("Dubai Mall and fountain show", "shopping", 500, 4, "Aquarium, souk section and the fountain from the bridge."),
        ("Old Dubai souks and abra", "culture", 300, 3, "Gold and spice souks either side of a one-dirham creek crossing."),
        ("Marina dhow dinner cruise", "food", 3800, 3, "Traditional wooden boat, buffet and the skyline lit up."),
    ],
    "Hong Kong": [
        ("Victoria Peak tram", "sightseeing", 1200, 3, "Steep funicular to the harbour view from the terrace."),
        ("Star Ferry and Symphony of Lights", "sightseeing", 300, 2, "Harbour crossing timed for the nightly light show."),
        ("Dim sum lunch in Central", "food", 1600, 2, "Trolley service: har gow, siu mai and rice rolls."),
        ("Big Buddha cable car", "culture", 2600, 5, "Glass-floor cable car to the Tian Tan Buddha and monastery."),
        ("Temple Street night market", "shopping", 400, 3, "Stalls, fortune tellers and clay-pot rice after dark."),
    ],
    "Seoul": [
        ("Gyeongbokgung Palace in hanbok", "culture", 1200, 3, "Guard-changing ceremony; hanbok rental waives the entry fee."),
        ("Bukchon Hanok Village walk", "sightseeing", 0, 2, "Six hundred year old lanes of tiled-roof houses."),
        ("Korean BBQ in Hongdae", "food", 2000, 2, "Samgyeopsal grilled at the table with soju."),
        ("N Seoul Tower observatory", "sightseeing", 1400, 3, "Cable car up Namsan for the city at night."),
        ("Myeongdong street shopping", "shopping", 700, 3, "Skincare flagships and the street food carts between them."),
    ],
    "Paris": [
        ("Louvre Museum", "culture", 1800, 4, "Denon wing first: Mona Lisa, Venus de Milo, the Egyptian rooms."),
        ("Eiffel Tower summit", "sightseeing", 2600, 3, "Lift to the second floor, then the summit for the wider view."),
        ("Seine river cruise", "sightseeing", 1500, 2, "One hour past Notre-Dame, the Louvre and the Musee d'Orsay."),
        ("Montmartre and Sacre-Coeur", "sightseeing", 0, 3, "Hill village lanes, artists' square and the basilica steps."),
        ("Le Marais food tasting walk", "food", 4500, 3, "Falafel, fromagerie, patisserie and a wine stop."),
    ],
    "London": [
        ("Tower of London", "culture", 3200, 3, "Yeoman warder tour, the Crown Jewels and the White Tower."),
        ("British Museum", "culture", 0, 3, "Rosetta Stone, Parthenon sculptures and the Great Court."),
        ("West End theatre show", "nightlife", 5500, 3, "Evening performance in a Shaftesbury Avenue house."),
        ("Borough Market food crawl", "food", 2200, 2, "Cheese toasties, oysters and salt beef under the railway arches."),
        ("London Eye flight", "sightseeing", 3400, 2, "Half-hour rotation over the Thames and Westminster."),
    ],
    "Rome": [
        ("Colosseum and Roman Forum", "culture", 1900, 4, "Arena floor, then the ruins of the old city centre."),
        ("Vatican Museums and Sistine Chapel", "culture", 2600, 4, "Gallery of Maps, Raphael Rooms and the ceiling."),
        ("Trastevere food tour", "food", 5200, 4, "Suppli, carbonara and a tiramisu across four family places."),
        ("Trevi and Pantheon walk", "sightseeing", 0, 2, "Fountain, dome and the piazzas between them."),
        ("Pasta making class", "food", 4800, 3, "Roll cacio e pepe tonnarelli, then eat what you made."),
    ],
    "Barcelona": [
        ("Sagrada Familia", "culture", 2800, 2, "Gaudi's basilica with the stained glass at its best mid-morning."),
        ("Park Guell", "sightseeing", 1500, 2, "Mosaic terrace and the view down to the sea."),
        ("Gothic Quarter tapas crawl", "food", 4200, 3, "Four bars, pan con tomate to jamon iberico."),
        ("Camp Nou stadium tour", "sightseeing", 2900, 3, "Pitchside, dressing room and the club museum."),
        ("Sunset sailing off Barceloneta", "adventure", 4500, 3, "Catamaran along the coast with a swim stop."),
    ],
    "Amsterdam": [
        ("Van Gogh Museum", "culture", 2200, 3, "The largest collection of his work, in painting order."),
        ("Canal cruise", "sightseeing", 1800, 2, "Glass-top boat through the seventeenth-century ring."),
        ("Anne Frank House", "culture", 1400, 2, "The secret annexe; book the timed slot well ahead."),
        ("Jordaan cycling tour", "adventure", 3200, 3, "Guided ride through markets, courtyards and the canal belt."),
        ("Cheese and stroopwafel tasting", "food", 2000, 2, "Aged goudas with mustard, warm syrup waffles after."),
    ],
    "Prague": [
        ("Prague Castle complex", "culture", 1400, 3, "St Vitus Cathedral, Golden Lane and the palace courtyards."),
        ("Charles Bridge and Old Town", "sightseeing", 0, 2, "Baroque statues at first light, then the square."),
        ("Astronomical Clock tower", "sightseeing", 900, 2, "The hourly apostles, then the roof view from the tower."),
        ("Vltava dinner cruise", "food", 2600, 3, "Czech buffet with the castle lit above the river."),
        ("Beer cellar tasting tour", "nightlife", 2000, 3, "Pilsner, dark lager and unfiltered beer in three cellars."),
    ],
    "Vienna": [
        ("Schonbrunn Palace and gardens", "culture", 2400, 4, "Imperial apartments, the Gloriette and the maze."),
        ("Concert at the Musikverein", "culture", 4500, 3, "Mozart and Strauss in the Golden Hall."),
        ("Naschmarkt food walk", "food", 2200, 2, "Cheese, olives and schnitzel down the long market aisle."),
        ("Belvedere Museum", "culture", 1800, 2, "Klimt's The Kiss in a baroque palace."),
        ("Prater ferris wheel", "sightseeing", 1200, 2, "The 1897 wheel and the funfair around it."),
    ],
    "Lisbon": [
        ("Belem Tower and Jeronimos", "culture", 1800, 4, "Manueline stonework by the river, monastery cloisters after."),
        ("Tram 28 ride", "sightseeing", 350, 2, "Wooden tram up through Alfama's hairpin streets."),
        ("Fado dinner in Alfama", "nightlife", 4200, 3, "Two singers, a guitarra and bacalhau between sets."),
        ("Pastel de nata tasting walk", "food", 1500, 2, "Original Belem custard tarts and three bakeries after."),
        ("Sintra day trip", "sightseeing", 3800, 7, "Pena Palace and the Moorish castle in the hills."),
    ],
    "Santorini": [
        ("Oia sunset walk", "sightseeing", 0, 2, "Caldera path from Fira, blue domes and the famous sunset."),
        ("Caldera catamaran cruise", "adventure", 9500, 5, "Hot springs, red beach and dinner on deck."),
        ("Akrotiri excavations", "culture", 1400, 2, "Bronze age town buried by the eruption, roofed and walkable."),
        ("Winery tasting tour", "food", 5200, 4, "Assyrtiko from vines trained in baskets against the wind."),
        ("Red Beach and Perissa swim", "adventure", 800, 3, "Volcanic sand and clear water on the south coast."),
    ],
    "Zurich": [
        ("Lake Zurich boat cruise", "sightseeing", 2200, 2, "Round trip with the Alps behind the far shore."),
        ("Old Town and Grossmunster", "sightseeing", 900, 3, "Guild houses, the Chagall windows and the tower climb."),
        ("Swiss chocolate workshop", "food", 5500, 3, "Temper and mould your own bars with a chocolatier."),
        ("Uetliberg hike", "adventure", 600, 4, "Train to the ridge and walk the panorama trail."),
        ("Bahnhofstrasse stroll", "shopping", 0, 2, "Watches, chocolate and department stores to the lake."),
    ],
    "Istanbul": [
        ("Hagia Sophia and Blue Mosque", "culture", 1600, 3, "Byzantine dome and Ottoman tiles, five minutes apart."),
        ("Topkapi Palace", "culture", 2000, 3, "Sultans' courtyards, the harem and the treasury."),
        ("Bosphorus ferry cruise", "sightseeing", 700, 3, "Public ferry between two continents, tea on deck."),
        ("Grand Bazaar", "shopping", 500, 3, "Four thousand shops: carpets, lamps and gold."),
        ("Meze and raki dinner", "food", 2400, 3, "A meyhane table of small plates with grilled fish."),
    ],
    "New York": [
        ("Statue of Liberty and Ellis Island", "sightseeing", 2600, 5, "Ferry, pedestal access and the immigration museum."),
        ("Metropolitan Museum of Art", "culture", 2500, 3, "Egyptian temple, European paintings and the roof garden."),
        ("Broadway show", "nightlife", 9500, 3, "Evening performance in the theatre district."),
        ("Central Park bike ride", "adventure", 2200, 3, "Loop past Bethesda Terrace and the reservoir."),
        ("Brooklyn food tour", "food", 5500, 3, "Pizza, bagels and cheesecake with a bridge walk between."),
    ],
    "San Francisco": [
        ("Golden Gate Bridge cycle", "adventure", 3500, 3, "Ride the span to Sausalito and ferry back."),
        ("Alcatraz Island tour", "culture", 4200, 4, "Ferry and the cellhouse audio tour in inmates' voices."),
        ("Fisherman's Wharf and sea lions", "sightseeing", 0, 2, "Pier 39 colony, sourdough and the bay view."),
        ("Muir Woods redwoods", "adventure", 5500, 6, "Old-growth coast redwoods an hour north."),
        ("Mission taqueria crawl", "food", 3200, 3, "Burritos, tacos and the murals on Balmy Alley."),
    ],
    "Toronto": [
        ("CN Tower lookout", "sightseeing", 3200, 2, "Glass floor and the LookOut level over the lake."),
        ("Niagara Falls day trip", "sightseeing", 7500, 9, "Coach out, boat under the Horseshoe Falls, winery stop."),
        ("Royal Ontario Museum", "culture", 2000, 3, "Dinosaurs, First Nations galleries and the crystal wing."),
        ("St Lawrence Market food walk", "food", 2600, 2, "Peameal bacon sandwich and the cheese counters."),
        ("Kensington Market stroll", "shopping", 500, 3, "Vintage shops, spice stores and Chinatown next door."),
    ],
    "Mexico City": [
        ("Teotihuacan pyramids", "culture", 3800, 7, "Avenue of the Dead between the Sun and Moon pyramids."),
        ("Frida Kahlo Museum", "culture", 1600, 2, "The Blue House in Coyoacan, her studio kept as it was."),
        ("Xochimilco trajinera boat", "sightseeing", 2200, 4, "Painted barge through the canals with mariachi alongside."),
        ("Taco and mezcal tour", "food", 3000, 3, "Al pastor, suadero and a mezcaleria to finish."),
        ("Chapultepec Castle", "culture", 700, 3, "Hilltop castle and the anthropology museum below."),
    ],
    "Rio de Janeiro": [
        ("Christ the Redeemer", "sightseeing", 3200, 4, "Cog train up Corcovado for the statue and the bay."),
        ("Sugarloaf cable car", "sightseeing", 2800, 3, "Two-stage ride, best an hour before sunset."),
        ("Copacabana and Ipanema day", "adventure", 500, 4, "Beach chairs, footvolley and a walk between the two."),
        ("Samba night in Lapa", "nightlife", 2400, 4, "Live roda de samba under the arches."),
        ("Tijuca rainforest hike", "adventure", 3600, 5, "Urban rainforest trail to the Pedra Bonita view."),
    ],
    "Buenos Aires": [
        ("Tango show in San Telmo", "nightlife", 5200, 4, "Dinner, orchestra and a couple who have danced for decades."),
        ("Recoleta and Palermo walk", "culture", 800, 3, "Cemetery mausoleums, then the parks and street art."),
        ("Parrilla steak dinner", "food", 3000, 2, "Bife de chorizo over wood coals with a malbec."),
        ("La Boca and Caminito", "sightseeing", 600, 3, "Painted tin houses and the old port lane."),
        ("Tigre delta boat trip", "adventure", 3400, 6, "Train north, then a launch through the delta channels."),
    ],
    "Cusco": [
        ("Machu Picchu day trip", "culture", 16000, 12, "Train to Aguas Calientes and a guided circuit of the citadel."),
        ("Sacred Valley tour", "sightseeing", 4200, 8, "Pisac terraces, Ollantaytambo fortress and a weavers' village."),
        ("Rainbow Mountain trek", "adventure", 5500, 10, "High-altitude walk to the striped ridge at 5,000 metres."),
        ("San Pedro market walk", "food", 1200, 2, "Fruit juices, cheese stalls and a bowl of caldo."),
        ("Cathedral and Qorikancha", "culture", 1800, 3, "Colonial cathedral built straight onto Inca stonework."),
    ],
    "Cairo": [
        ("Pyramids of Giza and Sphinx", "culture", 2600, 5, "Three pyramids, the panorama point and a camel if you want."),
        ("Egyptian Museum", "culture", 1800, 3, "Tutankhamun's gold and the royal mummies."),
        ("Nile felucca dinner", "food", 2200, 3, "Sail boat at sunset with mezze on board."),
        ("Khan el-Khalili bazaar", "shopping", 400, 3, "Lantern makers, perfume oils and a coffee at El Fishawy."),
        ("Saqqara and Memphis", "culture", 3200, 5, "The step pyramid and the old capital's colossi."),
    ],
    "Marrakech": [
        ("Jemaa el-Fnaa at dusk", "sightseeing", 0, 2, "Storytellers, snake charmers and the food stalls setting up."),
        ("Bahia Palace and Saadian Tombs", "culture", 1200, 3, "Carved cedar ceilings and the rediscovered royal tombs."),
        ("Medina souk shopping", "shopping", 600, 3, "Leather, lamps and spices; haggling expected."),
        ("Tagine cooking class", "food", 3200, 4, "Souk shop, then chicken with preserved lemon in a riad kitchen."),
        ("Agafay desert sunset", "adventure", 4200, 5, "Camel ride over the stony desert with dinner at camp."),
    ],
    "Cape Town": [
        ("Table Mountain cableway", "sightseeing", 2600, 3, "Rotating car to the plateau; go early for clear air."),
        ("Cape Peninsula drive", "adventure", 5200, 8, "Chapman's Peak, Cape Point and the Boulders penguins."),
        ("Robben Island tour", "culture", 3400, 4, "Ferry and a former prisoner as your guide."),
        ("Constantia wine tasting", "food", 3800, 4, "Three estates in the oldest wine valley in the country."),
        ("V and A Waterfront evening", "shopping", 500, 3, "Craft market, harbour seals and the wheel."),
    ],
    "Nairobi": [
        ("Nairobi National Park safari", "adventure", 6500, 5, "Rhino, lion and giraffe with the skyline behind them."),
        ("Elephant orphanage visit", "sightseeing", 1200, 2, "The eleven o'clock feed and mud bath at Sheldrick."),
        ("Giraffe Centre", "sightseeing", 1400, 2, "Feed the Rothschild's giraffes from the raised platform."),
        ("Karen Blixen Museum", "culture", 1200, 2, "The farmhouse from Out of Africa at the foot of the Ngong hills."),
        ("Nyama choma dinner", "food", 2000, 3, "Charcoal-grilled goat and ugali in Karen."),
    ],
    "Zanzibar City": [
        ("Stone Town heritage walk", "culture", 1500, 3, "Carved doors, the old fort and the former slave market."),
        ("Spice farm tour", "food", 2200, 4, "Clove, nutmeg and vanilla straight off the plant, lunch included."),
        ("Prison Island snorkelling", "adventure", 3600, 5, "Giant tortoises and a reef stop on the way back."),
        ("Forodhani night market", "food", 900, 2, "Grilled seafood skewers and Zanzibar pizza by the sea wall."),
        ("Sunset dhow cruise", "sightseeing", 2800, 3, "Traditional sail boat off the old town waterfront."),
    ],
    "Sydney": [
        ("Opera House tour", "culture", 3600, 2, "Inside the shells, concert hall and the story of the build."),
        ("Bondi to Coogee coast walk", "adventure", 0, 3, "Six kilometres of cliff path, beaches and rock pools."),
        ("Harbour Bridge climb", "adventure", 12000, 4, "Catwalk to the summit arch, 134 metres over the water."),
        ("Taronga Zoo by ferry", "sightseeing", 4200, 4, "Harbour crossing and Australian animals with a skyline view."),
        ("Darling Harbour dinner cruise", "food", 5500, 3, "Three courses as the bridge and Opera House go past."),
    ],
    "Melbourne": [
        ("Laneway art and coffee walk", "culture", 2200, 3, "Hosier Lane murals with three specialty roasters."),
        ("Great Ocean Road day trip", "sightseeing", 7800, 11, "Twelve Apostles, Loch Ard Gorge and the rainforest walk."),
        ("Queen Victoria Market tour", "food", 3200, 3, "Deli hall tasting, borek and a hot jam doughnut."),
        ("MCG stadium tour", "sightseeing", 2600, 2, "Members' pavilion, the ground and the sports museum."),
        ("CBD rooftop bar evening", "nightlife", 2800, 3, "Two rooftops with city views and a wine list."),
    ],
    "Auckland": [
        ("Sky Tower deck", "sightseeing", 2400, 2, "Glass-floor panels 220 metres above the harbour."),
        ("Waiheke Island wine tasting", "food", 6500, 7, "Ferry across and three vineyard tastings with lunch."),
        ("Rangitoto volcano hike", "adventure", 3800, 6, "Ferry and a lava-field climb to the crater rim."),
        ("Auckland Museum and Maori show", "culture", 3000, 3, "Waka and carvings plus a live cultural performance."),
        ("Viaduct Harbour evening", "sightseeing", 0, 2, "Waterfront walk past the yachts and the bridge."),
    ],
    "Queenstown": [
        ("Shotover Jet boat", "adventure", 8200, 2, "Canyon walls at 85 kmh with full 360 spins."),
        ("Milford Sound day cruise", "sightseeing", 12500, 12, "Coach through Fiordland, then a boat under Mitre Peak."),
        ("Skyline gondola and luge", "adventure", 4500, 3, "Gondola to Bob's Peak and three luge runs down."),
        ("Fergburger and lakefront", "food", 1200, 2, "The queue is part of it; eat it by Lake Wakatipu."),
        ("Central Otago wine tour", "food", 7500, 5, "Pinot noir across four Gibbston Valley cellar doors."),
    ],
}


def seed_cities(db):
    existing = {(c.name, c.country): c for c in db.query(City).all()}
    added = 0
    for name, country, region, cost_index, popularity, stay, meal in CITIES:
        city = existing.get((name, country))
        if city is None:
            city = City(name=name, country=country)
            db.add(city)
            added += 1
        city.region = region
        city.cost_index = cost_index
        city.popularity = popularity
        city.avg_stay_cost_per_day = stay
        city.avg_meal_cost_per_day = meal
    db.flush()
    return added


def seed_activities(db):
    cities = {c.name: c for c in db.query(City).all()}
    existing = {(a.city_id, a.name): a for a in db.query(Activity).all()}
    added = 0
    for city_name, rows in ACTIVITIES.items():
        city = cities.get(city_name)
        if city is None:
            raise RuntimeError(f"Activity list refers to an unknown city: {city_name}")
        for name, category, cost, hours, description in rows:
            activity = existing.get((city.id, name))
            if activity is None:
                activity = Activity(city_id=city.id, name=name)
                db.add(activity)
                added += 1
            activity.category = category
            activity.cost = cost
            activity.duration_hours = hours
            activity.description = description
    db.flush()
    return added


def seed_demo_user(db):
    """The account the app is demonstrated with. Its password is reset on every run so the login always works."""
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    created = user is None
    if created:
        user = User(name="Demo Traveller", email=DEMO_EMAIL)
        db.add(user)
    user.password_hash = hash_password(DEMO_PASSWORD)
    db.flush()
    return user, created


def seed_sample_trip(db, user):
    """One finished trip on the demo account so the app is never demonstrated from an empty screen."""
    if db.query(Trip).filter(Trip.user_id == user.id, Trip.name == SAMPLE_TRIP).first():
        return False

    start = date.today() + timedelta(days=14)
    total_nights = sum(nights for _, nights, _, _ in SAMPLE_STOPS)
    trip = Trip(
        user_id=user.id,
        name=SAMPLE_TRIP,
        description="Forts, lakes and a lot of food, from Delhi down to Udaipur.",
        start_date=start,
        end_date=start + timedelta(days=total_nights),
        total_budget=90000,
    )
    db.add(trip)
    db.flush()

    arrival = start
    for order, (city_name, nights, transport, planned) in enumerate(SAMPLE_STOPS):
        city = db.query(City).filter(City.name == city_name, City.country == "India").one()
        stop = Stop(
            trip_id=trip.id,
            city_id=city.id,
            order_index=order,
            arrival_date=arrival,
            departure_date=arrival + timedelta(days=nights),
            transport_cost=transport,
        )
        db.add(stop)
        db.flush()

        for activity_name, day_offset, start_time in planned:
            activity = db.query(Activity).filter(Activity.city_id == city.id, Activity.name == activity_name).one()
            db.add(
                StopActivity(
                    stop_id=stop.id,
                    activity_id=activity.id,
                    scheduled_date=arrival + timedelta(days=day_offset),
                    start_time=start_time,
                )
            )
        arrival = stop.departure_date

    db.flush()
    return True


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        new_cities = seed_cities(db)
        new_activities = seed_activities(db)
        demo_user, demo_created = seed_demo_user(db)
        sample_created = seed_sample_trip(db, demo_user)
        db.commit()
        print(f"Cities: {db.query(City).count()} total, {new_cities} added")
        print(f"Activities: {db.query(Activity).count()} total, {new_activities} added")
        print(f"Demo user: {DEMO_EMAIL} {'created' if demo_created else 'already present'}")
        print(f"Sample trip: {'created' if sample_created else 'already present'}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
