import type { Card, Domain } from "../types";
import type { CardInstance, GameState, PlayerId } from "../../game/state";
import type { SpecialCaseContext, SpecialCaseHandler } from "./types";
import { battlefieldPseudoInstance, legendPseudoInstance } from "../../game/pseudoInstance";
import { dangerousDuo } from "./dangerous-duo";
import { doomedRecruit } from "./doomed-recruit";
import { stunningBlow } from "./stunning-blow";
import { empoweredChampionBonus } from "./empowered-champion";
import { tacticalBanner } from "./tactical-banner";
import { ancientRuins } from "./ancient-ruins";
import { cleave } from "./cleave";
import { disintegrate } from "./disintegrate";
import { captainFarron } from "./captain-farron";
import { thermoBeam } from "./thermo-beam";
import { magmaWurm } from "./magma-wurm";
import { adaptatron } from "./adaptatron";
import { dravenShowboat } from "./draven-showboat";
import { wielderOfWater } from "./wielder-of-water";
import { stunAnyUnit } from "./stun-any-unit";
import { ragingSoul } from "./raging-soul";
import { dariusTrifarian } from "./darius-trifarian";
import { caitlynPatrolling } from "./caitlyn-patrolling";
import { wizenedElder } from "./wizened-elder";
import { ravenbloomStudent } from "./ravenbloom-student";
import { pitCrew } from "./pit-crew";
import { luxIlluminated } from "./lux-illuminated";
import { dianaNoLongerHuman } from "./diana-no-longer-human";
import { revnaTheLorekeeper } from "./revna-the-lorekeeper";
import { eclipseHerald } from "./eclipse-herald";
import { brazenBuccaneer } from "./brazen-buccaneer";
import { getExcited } from "./get-excited";
import { noxusHopeful } from "./noxus-hopeful";
import { skySplitter } from "./sky-splitter";
import { scrapyardChampion } from "./scrapyard-champion";
import { sunDisc } from "./sun-disc";
import { blindFury } from "./blind-fury";
import { brynhirThundersong } from "./brynhir-thundersong";
import { fallingStar } from "./falling-star";
import { ragingFirebrand } from "./raging-firebrand";
import { tryndamere } from "./tryndamere";
import { viDestructive } from "./vi-destructive";
import { immortalPhoenix } from "./immortal-phoenix";
import { kadregrin } from "./kadregrin";
import { volibear } from "./volibear";
import { charm } from "./charm";
import { enGarde } from "./en-garde";
import { findYourCenter } from "./find-your-center";
import { maskOfForesight } from "./mask-of-foresight";
import { poroHerder } from "./poro-herder";
import { spiritsRefuge } from "./spirits-refuge";
import { ravenbornTome } from "./ravenborn-tome";
import { blitzcrank } from "./blitzcrank";
import { lastStand } from "./last-stand";
import { solariShrine } from "./solari-shrine";
import { sona } from "./sona";
import { taric } from "./taric";
import { tastyFaefolk } from "./tasty-faefolk";
import { watchfulSentry } from "./watchful-sentry";
import { leeSin } from "./lee-sin";
import { yasuo } from "./yasuo";
import { leona } from "./leona";
import { eagerApprentice } from "./eager-apprentice";
import { garbageGrabber } from "./garbage-grabber";
import { gemcraftSeer } from "./gemcraft-seer";
import { portalRescue } from "./portal-rescue";
import { retreat } from "./retreat";
import { singularity } from "./singularity";
import { spriteMother } from "./sprite-mother";
import { drMundo } from "./dr-mundo";
import { wraithOfEchoes } from "./wraith-of-echoes";
import { viktor } from "./viktor";
import { thousandTailedWatcher } from "./thousand-tailed-watcher";
import { timeWarp } from "./time-warp";
import { uncheckedPower } from "./unchecked-power";
import { arenaBar } from "./arena-bar";
import { bilgewaterBully } from "./bilgewater-bully";
import { confront } from "./confront";
import { duneDrake } from "./dune-drake";
import { firstMate } from "./first-mate";
import { flurryOfBlades } from "./flurry-of-blades";
import { mobilize } from "./mobilize";
import { pitRookie } from "./pit-rookie";
import { catalystOfAeons } from "./catalyst-of-aeons";
import { cithriaOfCloudfield } from "./cithria-of-cloudfield";
import { kinkouMonk } from "./kinkou-monk";
import { spoilsOfWar } from "./spoils-of-war";
import { carnivorousSnapvine } from "./carnivorous-snapvine";
import { leeSinCentered } from "./lee-sin-centered";
import { sabotage } from "./sabotage";
import { qiyana } from "./qiyana";
import { heraldOfScales } from "./herald-of-scales";
import { warwickHunter } from "./warwick-hunter";
import { settBrawler } from "./sett-brawler";
import { cemeteryAttendant } from "./cemetery-attendant";
import { morbidReturn } from "./morbid-return";
import { gust } from "./gust";
import { acceptableLosses } from "./acceptable-losses";
import { fadingMemories } from "./fading-memories";
import { undercoverAgent } from "./undercover-agent";
import { deadbloomPredator } from "./deadbloom-predator";
import { saiScout } from "./sai-scout";
import { sneakyDeckhand } from "./sneaky-deckhand";
import { missFortuneBuccaneer } from "./miss-fortune-buccaneer";
import { rideTheWind } from "./ride-the-wind";
import { stackedDeck } from "./stacked-deck";
import { theSyren } from "./the-syren";
import { treasureTrove } from "./treasure-trove";
import { zauniteBouncer } from "./zaunite-bouncer";
import { kogmawCaustic } from "./kogmaw-caustic";
import { maddenedMarauder } from "./maddened-marauder";
import { mindsplitter } from "./mindsplitter";
import { rhasaTheSunderer } from "./rhasa-the-sunderer";
import { scrapheap } from "./scrapheap";
import { dazzlingAurora } from "./dazzling-aurora";
import { packOfWonders } from "./pack-of-wonders";
import { invertTimelines } from "./invert-timelines";
import { jinxRebel } from "./jinx-rebel";
import { possession } from "./possession";
import { cullTheWeak } from "./cull-the-weak";
import { faithfulManufactor } from "./faithful-manufactor";
import { forgeOfTheFuture } from "./forge-of-the-future";
import { soaringScout } from "./soaring-scout";
import { trifarianGloryseeker } from "./trifarian-gloryseeker";
import { vanguardCaptain } from "./vanguard-captain";
import { noxianDrummer } from "./noxian-drummer";
import { peakGuardian } from "./peak-guardian";
import { solariChief } from "./solari-chief";
import { vanguardHelm } from "./vanguard-helm";
import { fioraVictorious } from "./fiora-victorious";
import { grandStrategem } from "./grand-strategem";
import { backToBack } from "./back-to-back";
import { flameChompers } from "./flame-chompers";
import { vayneHunter } from "./vayne-hunter";
import { reinforce } from "./reinforce";
import { ekkoRecurrent } from "./ekko-recurrent";
import { soulgorger } from "./soulgorger";
import { theHarrowing } from "./the-harrowing";
import { cruelPatron } from "./cruel-patron";
import { spectralMatron } from "./spectral-matron";
import { leonaDetermined } from "./leona-determined";
import { machineEvangel } from "./machine-evangel";
import { settKingpin } from "./sett-kingpin";
import { dariusExecutioner } from "./darius-executioner";
import { viktorLeader } from "./viktor-leader";
import { icathianRain } from "./icathian-rain";
import { stormbringer } from "./stormbringer";
import { altarToUnity } from "./altar-to-unity";
import { aspirantsClimb } from "./aspirants-climb";
import { navoriFightingPit } from "./navori-fighting-pit";
import { obeliskOfPower } from "./obelisk-of-power";
import { reckonersArena } from "./reckoners-arena";
import { sigilOfTheStorm } from "./sigil-of-the-storm";
import { theArenasGreatest } from "./the-arenas-greatest";
import { theGrandPlaza } from "./the-grand-plaza";
import { trifarianWarCamp } from "./trifarian-war-camp";
import { voidGate } from "./void-gate";
import { windsweptHillock } from "./windswept-hillock";
import { zaunWarrens } from "./zaun-warrens";
import { monasteryOfHirana } from "./monastery-of-hirana";
import { fortifiedPosition } from "./fortified-position";
import { targonsPeak } from "./targons-peak";
import { lastBreath } from "./last-breath";
import { zenithBlade } from "./zenith-blade";
import { showstopper } from "./showstopper";
import { twistedFateGambler } from "./twisted-fate-gambler";
import { annieFiery } from "./annie-fiery";
import { annieStubborn } from "./annie-stubborn";
import { decisiveStrike } from "./decisive-strike";
import { flash } from "./flash";
import { garenCommander } from "./garen-commander";
import { recruitTheVanguard } from "./recruit-the-vanguard";
import { tibbers } from "./tibbers";
import { vanguardAttendant } from "./vanguard-attendant";
import { yiHoned } from "./yi-honed";
import { yiMeditative } from "./yi-meditative";
import { detonate } from "./detonate";
import { eagerDrakehound } from "./eager-drakehound";
import { gemJammer } from "./gem-jammer";
import { ferrousForerunner } from "./ferrous-forerunner";
import { poroSnax } from "./poro-snax";
import { aspiringEngineer } from "./aspiring-engineer";
import { plunderingPoro } from "./plundering-poro";
import { laurentBladekeeper } from "./laurent-bladekeeper";
import { yordleExplorer } from "./yordle-explorer";
import { treasureHunter } from "./treasure-hunter";
import { factoryRecall } from "./factory-recall";
import { eminentBenefactor } from "./eminent-benefactor";
import { honestBroker } from "./honest-broker";
import { sandshifter } from "./sandshifter";
import { trustyRamhound } from "./trusty-ramhound";
import { ribbonDancer } from "./ribbon-dancer";
import { jaxUnrelenting } from "./jax-unrelenting";
import { lucianMerciless } from "./lucian-merciless";
import { ornnForgeGod } from "./ornn-forge-god";
import { sivirAmbitious } from "./sivir-ambitious";
import { yoneBlademaster } from "./yone-blademaster";
import { shurelyasRequiem } from "./shurelyas-requiem";
import { batteringRam } from "./battering-ram";
import { dunebreaker } from "./dunebreaker";
import { lucianGunslinger } from "./lucian-gunslinger";
import { guardianOfThePassage } from "./guardian-of-the-passage";
import { lonelyPoro } from "./lonely-poro";
import { apprenticeSmith } from "./apprentice-smith";
import { legionQuartermaster } from "./legion-quartermaster";
import { ornnBlacksmith } from "./ornn-blacksmith";
import { bubbleBot } from "./bubble-bot";
import { dropboarder } from "./dropboarder";
import { pickpocket } from "./pickpocket";
import { productionSurge } from "./production-surge";
import { cardSharp } from "./card-sharp";
import { jayceManOfProgress } from "./jayce-man-of-progress";
import { rumbleScrapper } from "./rumble-scrapper";
import { buhruCaptain } from "./buhru-captain";
import { dauntlessVanguard } from "./dauntless-vanguard";
import { direwing } from "./direwing";
import { seaMonkey } from "./sea-monkey";
import { blastCorpsCadet } from "./blast-corps-cadet";
import { frostcoatCub } from "./frostcoat-cub";
import { royalGuard } from "./royal-guard";
import { unsungHero } from "./unsung-hero";
import { vanguardArmory } from "./vanguard-armory";
import { troveGolem } from "./trove-golem";
import { onTheHunt } from "./on-the-hunt";
import { arise } from "./arise";
import { renataGlascIndustrialist } from "./renata-glasc-industrialist";
import { emperorsDais } from "./emperors-dais";
import { minefield } from "./minefield";
import { ravenbloomConservatory } from "./ravenbloom-conservatory";
import { rockfallPath } from "./rockfall-path";
import { seatOfPower } from "./seat-of-power";
import { sunkenTemple } from "./sunken-temple";
import { thePapertree } from "./the-papertree";
import { treasureHoard } from "./treasure-hoard";
import { veiledTemple } from "./veiled-temple";
import { assemblyRig } from "./assembly-rig";
import { rellMagnetic } from "./rell-magnetic";
import { tiannaCrownguard } from "./tianna-crownguard";
import { forgottenMonument } from "./forgotten-monument";
import { strikeDown } from "./strike-down";
import { beastBelow } from "./beast-below";
import { fizzTrickster } from "./fizz-trickster";
import { ezrealProdigy } from "./ezreal-prodigy";
import { zaunPunk } from "./zaun-punk";
import { xinZhaoVigilant } from "./xin-zhao-vigilant";
import { arenaKingpin } from "./arena-kingpin";
import { smite } from "./smite";
import { vaultBreaker } from "./vault-breaker";
import { rightOfConquest } from "./right-of-conquest";
import { scorchclaw } from "./scorchclaw";
import { gustwalker } from "./gustwalker";
import { gemhandHunter } from "./gemhand-hunter";
import { targonianVisionary } from "./targonian-visionary";
import { bandleSoldier } from "./bandle-soldier";
import { masterYiUnstoppable } from "./master-yi-unstoppable";
import { concentrate } from "./concentrate";
import { mosstomper } from "./mosstomper";
import { masterYiTempered } from "./master-yi-tempered";
import { spriteBurst } from "./sprite-burst";
import { turnToDust } from "./turn-to-dust";
import { spriteQueen } from "./sprite-queen";
import { soulHarvest } from "./soul-harvest";
import { soulShepherd } from "./soul-shepherd";
import { viciousSnapjaws } from "./vicious-snapjaws";
import { spectralCentaur } from "./spectral-centaur";
import { blackRoseDignitary } from "./black-rose-dignitary";
import { carrionDredger } from "./carrion-dredger";
import { loyalPoro } from "./loyal-poro";
import { scrutinizingSergeant } from "./scrutinizing-sergeant";
import { starhound } from "./starhound";
import { leblancFragmented } from "./leblanc-fragmented";
import { friskyHunter } from "./frisky-hunter";
import { fateWeaver } from "./fate-weaver";
import { ruinedRex } from "./ruined-rex";
import { petalPixie } from "./petal-pixie";
import { kinkouInitiate } from "./kinkou-initiate";
import { gentleGemdragon } from "./gentle-gemdragon";
import { elderDragon } from "./elder-dragon";
import { bewitchingSpirit } from "./bewitching-spirit";
import { walkingRoost } from "./walking-roost";
import { anglerBeast } from "./angler-beast";
import { crimsonPigeons } from "./crimson-pigeons";
import { riftHerald } from "./rift-herald";
import { deathFromBelow } from "./death-from-below";
import { alphaStrike } from "./alpha-strike";
import { keepersVerdict } from "./keepers-verdict";
import { duskRoseLab } from "./dusk-rose-lab";
import { frozenFortress } from "./frozen-fortress";
import { trappingGrounds } from "./trapping-grounds";
import { xerathFreed } from "./xerath-freed";
import { monch } from "./monch";
import { shadowWatcher } from "./shadow-watcher";
import { enthusiasticPromoter } from "./enthusiastic-promoter";
import { trevorSnoozebottom } from "./trevor-snoozebottom";
import { vexMocking } from "./vex-mocking";
import { ivernNurturer } from "./ivern-nurturer";
import { crescentStrike } from "./crescent-strike";
import { spriteFountain } from "./sprite-fountain";
import { hweiBroodingPainter } from "./hwei-brooding-painter";
import { gutterPalace } from "./gutter-palace";
import { leblancEverywhere } from "./leblanc-everywhere";
import { crowdFavorite } from "./crowd-favorite";
import { poppyParagon } from "./poppy-paragon";
import { crescentGuardian } from "./crescent-guardian";
import { megatusk } from "./megatusk";
import { ultrasoftPoro } from "./ultrasoft-poro";
import { diviningShells } from "./divining-shells";
import { shadowsCall } from "./shadows-call";
import { galioIndefatigable } from "./galio-indefatigable";
import { shardOfUndoing } from "./shard-of-undoing";
import { theRuination } from "./the-ruination";
import { maduliTheGatekeeper } from "./maduli-the-gatekeeper";
import { shadow } from "./shadow";
import { daisy } from "./daisy";
import { moonfall } from "./moonfall";
import { isolate } from "./isolate";
import { heroicCharge } from "./heroic-charge";
import { vexApathetic } from "./vex-apathetic";
import { preparedNeophyte } from "./prepared-neophyte";
import { lordBroadmane } from "./lord-broadmane";
import { monsterHarpoon } from "./monster-harpoon";
import { yetiBrawler } from "./yeti-brawler";
import { combatExperience } from "./combat-experience";
import { friendship } from "./friendship";
import { scuttleCrab } from "./scuttle-crab";
import { yuumiMagicalCat } from "./yuumi-magical-cat";
import { lilliaProtectorOfDreams } from "./lillia-protector-of-dreams";
import { vilemaw } from "./vilemaw";
import { eclipse } from "./eclipse";
import { chakramDancer } from "./chakram-dancer";
import { deadlyFlourish } from "./deadly-flourish";
import { sumpworksMap } from "./sumpworks-map";
import { nidaleeCatForm } from "./nidalee-cat-form";
import { rengarTrophyHunter } from "./rengar-trophy-hunter";
import { khazixMutatingHorror } from "./khazix-mutating-horror";
import { pykeReturned } from "./pyke-returned";
import { grimResolve } from "./grim-resolve";
import { stareDown } from "./stare-down";
import { irresistibleFaefolk } from "./irresistible-faefolk";
import { viPeacekeeper } from "./vi-peacekeeper";
import { poppyDefenderOfTheMeek } from "./poppy-defender-of-the-meek";
import { pridestalker } from "./pridestalker";
import { thrillOfTheHunt } from "./thrill-of-the-hunt";
import { bloodharborRipper } from "./bloodharbor-ripper";
import { wujuMaster } from "./wuju-master";
import { iterativeDesign } from "./iterative-design";
import { desertsCall } from "./deserts-call";
import { kinkouTemple } from "./kinkou-temple";
import { bloodRush } from "./blood-rush";
import { twilightReveler } from "./twilight-reveler";
import { eclipseDragon } from "./eclipse-dragon";
import { hiddenBlade } from "./hidden-blade";
import { reluctantLeader } from "./reluctant-leader";
import { squareUp } from "./square-up";
import { shadowAssassin } from "./shadow-assassin";
import { shadowbladeLurker } from "./shadowblade-lurker";
import { appliedResearchers } from "./applied-researchers";
import { determinedSentry } from "./determined-sentry";
import { minotaurReckoner } from "./minotaur-reckoner";
import { vilemawsLair } from "./vilemaws-lair";
import { fightOrFlight } from "./fight-or-flight";
import { decreeOfUnity } from "./decree-of-unity";
import { downwell } from "./downwell";
import { plazaGuardian } from "./plaza-guardian";
import { decreeOfRage } from "./decree-of-rage";
import { fioraPeerless } from "./fiora-peerless";
import { toweringPairofant } from "./towering-pairofant";
import { forsakenBaccai } from "./forsaken-baccai";
import { decreeOfStrength } from "./decree-of-strength";
import { corruptEnforcer } from "./corrupt-enforcer";
import { heraldOfTheArcane } from "./herald-of-the-arcane";
import { bountyHunter } from "./bounty-hunter";
import { eyeOfTwilight } from "./eye-of-twilight";
import { defenderOfTomorrow } from "./defender-of-tomorrow";
import { shadowTemple } from "./shadow-temple";
import { patchedPorobot } from "./patched-porobot";
import { renektonRageFueled } from "./renekton-rage-fueled";
import { rivenShattered } from "./riven-shattered";
import { keeperOfLaw } from "./keeper-of-law";
import { gutturalRoar } from "./guttural-roar";
import { shenLeaderOfKinkouOrder } from "./shen-leader-of-kinkou-order";
import { shenScourgeOfShadows } from "./shen-scourge-of-shadows";
import { blackFlameAltar } from "./black-flame-altar";
import { lacerate } from "./lacerate";
import { publicExecution } from "./public-execution";
import { noxianDemolitionist } from "./noxian-demolitionist";
import { corinaVeraza } from "./corina-veraza";
import { brutalHunter } from "./brutal-hunter";
import { ancientWarmonger } from "./ancient-warmonger";
import { baccaiReaper } from "./baccai-reaper";
import { aurokGeneral } from "./aurok-general";
import { dragUnder } from "./drag-under";
import { faePorter } from "./fae-porter";
import { imposingChallenger } from "./imposing-challenger";
import { forbiddingWaste } from "./forbidding-waste";
import { affectionatePoro } from "./affectionate-poro";
import { kinkouLifeblade } from "./kinkou-lifeblade";
import { chemtechCask } from "./chemtech-cask";
import { shadowFiend } from "./shadow-fiend";
import { repairSpecialist } from "./repair-specialist";
import { sacredProtector } from "./sacred-protector";
import { royalEntourage } from "./royal-entourage";
import { morganaVindictive } from "./morgana-vindictive";
import { shockBlast } from "./shock-blast";
import { shadowOrderDisciple } from "./shadow-order-disciple";
import { upFromTheDeep } from "./up-from-the-deep";
import { viHotheaded } from "./vi-hotheaded";
import { toolsOfEmpire } from "./tools-of-empire";
import { siphoningStrike } from "./siphoning-strike";
import { ravenbloomPrefect } from "./ravenbloom-prefect";
import { pakaaProtector } from "./pakaa-protector";
import { perfectExecution } from "./perfect-execution";
import { rageAmplifier } from "./rage-amplifier";
import { sinisterPoro } from "./sinister-poro";
import { steelPaws } from "./steel-paws";
import { tombRaiderBarbara } from "./tomb-raider-barbara";
import { viktorInnovator } from "./viktor-innovator";
import { windAndGhosts } from "./wind-and-ghosts";
import { protectiveSands } from "./protective-sands";
import { punchingPoro } from "./punching-poro";
import { breakneckMech } from "./breakneck-mech";
import { corruptedDragon } from "./corrupted-dragon";
import { dravenAudacious } from "./draven-audacious";
import { jaullFish } from "./jaull-fish";
import { sereneAscetic } from "./serene-ascetic";
import { solariSunhawk } from "./solari-sunhawk";
import { zedFromTheShadows } from "./zed-from-the-shadows";
import { baccaiWitherclaw } from "./baccai-witherclaw";
import { bloodMoney } from "./blood-money";
import { kennenStormOfShuriken } from "./kennen-storm-of-shuriken";
import { missFortuneCaptain } from "./miss-fortune-captain";
import { ruthlessStrike } from "./ruthless-strike";
import { mirrorImage } from "./mirror-image";
import { oasisRaider } from "./oasis-raider";
import { zedWithoutASound } from "./zed-without-a-sound";
import { noxianEmissary } from "./noxian-emissary";
import { forgottenRelic } from "./forgotten-relic";
import { ambessaTheWolf } from "./ambessa-the-wolf";
import { ambessaRespectedAndFeared } from "./ambessa-respected-and-feared";
import { baccaiSandspinner } from "./baccai-sandspinner";
import { frostcoatMother } from "./frostcoat-mother";
import { grumpyRockbear } from "./grumpy-rockbear";
import { olPoro } from "./ol-poro";
import { altarOfMemories } from "./altar-of-memories";
import { esteemedHierophant } from "./esteemed-hierophant";
import { arachnoidHorror } from "./arachnoid-horror";
import { accelerationGate } from "./acceleration-gate";
import { oceanDrake } from "./ocean-drake";
import { sandstoneChimera } from "./sandstone-chimera";
import { challenge } from "./challenge";
import { gentlemensDuel } from "./gentlemens-duel";
import { marchingOrders } from "./marching-orders";
import { cataclysmicDuel } from "./cataclysmic-duel";
import { bladeTwirler } from "./blade-twirler";
import { glascMixologist } from "./glasc-mixologist";
import { kingsEdict } from "./kings-edict";
import { rampage } from "./rampage";
import { redBrambleback } from "./red-brambleback";
import { rallyTheTroops } from "./rally-the-troops";
import { undertitan } from "./undertitan";
import { overtOperation } from "./overt-operation";
import { shadowsOfThePast } from "./shadows-of-the-past";
import { undyingLoyalty } from "./undying-loyalty";
import { wallop } from "./wallop";
import { partyFavors } from "./party-favors";
import { tailCloakedMatriarch } from "./tail-cloaked-matriarch";
import { otterpus } from "./otterpus";
import { voidRush } from "./void-rush";
import { escapedGrayback } from "./escaped-grayback";
import { kharox } from "./kharox";
import { consumingCurse } from "./consuming-curse";
import { legionMarauder } from "./legion-marauder";
import { mournfulWitness } from "./mournful-witness";
import { superMegaDeathRocket } from "./super-mega-death-rocket";
import { harpoonSquad } from "./harpoon-squad";
import { katoTheArm } from "./kato-the-arm";
import { conscription } from "./conscription";
import { skywardStrike } from "./skyward-strike";
import { wildclawShaman } from "./wildclaw-shaman";
import { dragonsRage } from "./dragons-rage";
import { decreeOfDiscord } from "./decree-of-discord";
import { gustMonk } from "./gust-monk";
import { minahSwiftfoot } from "./minah-swiftfoot";
import { rocketBarrage } from "./rocket-barrage";
import { piercingLight } from "./piercing-light";
import { helmOfSuppression } from "./helm-of-suppression";
import { faeDragon } from "./fae-dragon";
import { safetyInspector } from "./safety-inspector";
import { skyCruiser } from "./sky-cruiser";
import { endlessRiches } from "./endless-riches";
import { darkChildStarter } from "./dark-child-starter";
import { gloriousExecutioner } from "./glorious-executioner";
import { ladyOfLuminosityStarter } from "./lady-of-luminosity-starter";
import { mightOfDemaciaStarter } from "./might-of-demacia-starter";
import { theBoss } from "./the-boss";
import { voidreaver } from "./voidreaver";
import { looseCannon } from "./loose-cannon";
import { mechanizedMenace } from "./mechanized-menace";
import { wujuBladesmanStarter } from "./wuju-bladesman-starter";
import { gloomist } from "./gloomist";
import { radiantDawn } from "./radiant-dawn";
import { keeperOfTheHammer } from "./keeper-of-the-hammer";
import { chemBaroness } from "./chem-baroness";
import { curatorOfTheSands } from "./curator-of-the-sands";
import { piltoverEnforcer } from "./piltover-enforcer";
import { purifier } from "./purifier";
import { relentlessStorm } from "./relentless-storm";
import { unforgiven } from "./unforgiven";
import { bashfulBloom } from "./bashful-bloom";
import { emperorOfTheSands } from "./emperor-of-the-sands";
import { nineTailedFox } from "./nine-tailed-fox";
import { voidBurrower } from "./void-burrower";
import { bladeDancer } from "./blade-dancer";
import { akaliSilent } from "./akali-silent";
import { akaliDeadlyWeapon } from "./akali-deadly-weapon";
import { dravenVanquisher } from "./draven-vanquisher";
import { zileanTimeMage } from "./zilean-time-mage";
import { illaoiProphetOfTheGreatKraken } from "./illaoi-prophet-of-the-great-kraken";
import { jannaSavior } from "./janna-savior";
import { renataGlascMastermind } from "./renata-glasc-mastermind";
import { hallOfLegends } from "./hall-of-legends";
import { amateurRecital } from "./amateur-recital";
import { clashOfGiants } from "./clash-of-giants";
import { dragonForm } from "./dragon-form";
import { lightningRush } from "./lightning-rush";
import { twilightShroud } from "./twilight-shroud";
import { twilightStep } from "./twilight-step";
import { insightfulInvestigator } from "./insightful-investigator";
import { profiteer } from "./profiteer";
import { renektonBrute } from "./renekton-brute";
import { melNewlyAwakened } from "./mel-newly-awakened";
import { rumbleHotheaded } from "./rumble-hotheaded";
import { ireliaGraceful } from "./irelia-graceful";
import { arcaneShift } from "./arcane-shift";
import { akshanMischievous } from "./akshan-mischievous";
import { allayEagerAdmirer } from "./allay-eager-admirer";
import { angleShot } from "./angle-shot";
import { apheliosExalted } from "./aphelios-exalted";
import { apprenticeMage } from "./apprentice-mage";
import { astralHeron } from "./astral-heron";
import { azirSovereign } from "./azir-sovereign";
import { blastCone } from "./blast-cone";
import { block } from "./block";
import { bellowsBreath } from "./bellows-breath";
import { avaAchiever } from "./ava-achiever";
import { baronNashor } from "./baron-nashor";
import { againstTheOdds } from "./against-the-odds";
import { backOff } from "./back-off";
import { bondsOfStrength } from "./bonds-of-strength";
import { bloodRose } from "./blood-rose";
import { bushwhack } from "./bushwhack";
import { callToBattle } from "./call-to-battle";
import { blueSentinel } from "./blue-sentinel";
import { bardMercurial } from "./bard-mercurial";
import { calledShot } from "./called-shot";
import { clairvoyance } from "./clairvoyance";
import { clockworkKeeper } from "./clockwork-keeper";
import { convergentMutation } from "./convergent-mutation";
import { curtainCall } from "./curtain-call";
import { dameTheDespoiler } from "./dame-the-despoiler";
import { dangerZone } from "./danger-zone";
import { deathMark } from "./death-mark";
import { deathgrip } from "./deathgrip";
import { decreeOfInsight } from "./decree-of-insight";
import { decreeOfFocus } from "./decree-of-focus";
import { dianaLunari } from "./diana-lunari";
import { defiantDance } from "./defiant-dance";
import { discipleOfShen } from "./disciple-of-shen";
import { disposalOrder } from "./disposal-order";
import { dominus } from "./dominus";
import { doubleTrouble } from "./double-trouble";
import { dramaticVisionary } from "./dramatic-visionary";
import { emperorsDivide } from "./emperors-divide";
import { edgeOfNight } from "./edge-of-night";
import { existentialDread } from "./existential-dread";
import { facebreaker } from "./facebreaker";
import { forecaster } from "./forecaster";
import { freshBeans } from "./fresh-beans";
import { guards } from "./guards";
import { guerillaWarfare } from "./guerilla-warfare";
import { heedlessResurrection } from "./heedless-resurrection";
import { evelynnEntrancing } from "./evelynn-entrancing";
import { ezrealDashing } from "./ezreal-dashing";
import { flurryOfFeathers } from "./flurry-of-feathers";
import { foxFire } from "./fox-fire";
import { hextechFormula } from "./hextech-formula";
import { hextechDisc } from "./hextech-disc";
import { iascylla } from "./iascylla";
import { icevaleArcher } from "./icevale-archer";
import { hostileTakeover } from "./hostile-takeover";
import { keeperOfMasks } from "./keeper-of-masks";
import { lilliaFaeFawn } from "./lillia-fae-fawn";
import { loyalPup } from "./loyal-pup";
import { jayceBrilliantInventor } from "./jayce-brilliant-inventor";
import { jhinMurderousArtist } from "./jhin-murderous-artist";
import { kaisaEvolutionary } from "./kaisa-evolutionary";
import { kennenKeeperOfBalance } from "./kennen-keeper-of-balance";
import { masaCrashingThunder } from "./masa-crashing-thunder";
import { maskMother } from "./mask-mother";
import { meditation } from "./meditation";
import { mesmerize } from "./mesmerize";
import { khaZixEvolvingHunter } from "./kha-zix-evolving-hunter";
import { namiHeadstrong } from "./nami-headstrong";
import { noxianGuillotine } from "./noxian-guillotine";
import { overzealousFan } from "./overzealous-fan";
import { pykeDocksideButcher } from "./pyke-dockside-butcher";
import { questionableTome } from "./questionable-tome";
import { reksaiSwarmQueen } from "./reksai-swarm-queen";
import { relentlessPursuit } from "./relentless-pursuit";
import { resonatingStrike } from "./resonating-strike";
import { sacrifice } from "./sacrifice";
import { reksaiBreacher } from "./reksai-breacher";
import { ruinRunner } from "./ruin-runner";
import { rengarPouncing } from "./rengar-pouncing";
import { scryersBloom } from "./scryers-bloom";
import { shadowDash } from "./shadow-dash";
import { shakedown } from "./shakedown";
import { showOfStrength } from "./show-of-strength";
import { shurikenFlip } from "./shuriken-flip";
import { siphonPower } from "./siphon-power";
import { sanction } from "./sanction";
import { spriteCall } from "./sprite-call";
import { starCrossed } from "./star-crossed";
import { spiderling } from "./spiderling";
import { smokeAndMirrors } from "./smoke-and-mirrors";
import { standUnited } from "./stand-united";
import { suddenStorm } from "./sudden-storm";
import { switcheroo } from "./switcheroo";
import { temporalBreach } from "./temporal-breach";
import { temptation } from "./temptation";
import { thwonk } from "./thwonk";
import { tideturner } from "./tideturner";
import { tornadoWarrior } from "./tornado-warrior";
import { temporalPortal } from "./temporal-portal";
import { unyieldingSpirit } from "./unyielding-spirit";
import { teemoStrategist } from "./teemo-strategist";
import { tricksyTentacles } from "./tricksy-tentacles";
import { udyrWildman } from "./udyr-wildman";
import { voidDrone } from "./void-drone";
import { wagesOfPain } from "./wages-of-pain";
import { whirlwind } from "./whirlwind";
import { wildClaw } from "./wild-claw";
import { windsinger } from "./windsinger";
import { swainVisionary } from "./swain-visionary";
import { swiftScout } from "./swift-scout";
import { candlelitSanctum } from "./candlelit-sanctum";
import { reaversRow } from "./reavers-row";
import { heishoShellOfTheWorld } from "./heisho-shell-of-the-world";
import { thresholdOfTheGray } from "./threshold-of-the-gray";
import { theAcademy } from "./the-academy";
import { albusFerros } from "./albus-ferros";
import { callToGlory } from "./call-to-glory";
import { grandmasterAtArms } from "./grandmaster-at-arms";
import { cursedSarcophagus } from "./cursed-sarcophagus";
import { forgottenSignpost } from "./forgotten-signpost";
import { backAlleyBar } from "./back-alley-bar";
import { counterStrike } from "./counter-strike";
import { kiBarrier } from "./ki-barrier";
import { lotusTrap } from "./lotus-trap";
import { voidAssault } from "./void-assault";
import { highlander } from "./highlander";
import { tacticalRetreat } from "./tactical-retreat";
import { sorakaWanderer } from "./soraka-wanderer";
import { unlicensedArmory } from "./unlicensed-armory";
import { zhonyasHourglass } from "./zhonyas-hourglass";
import { forgottenLibrary } from "./forgotten-library";
import { stealthyPursuer } from "./stealthy-pursuer";
import { nasusGuardianOfKnowledge } from "./nasus-guardian-of-knowledge";
import { powerNexus } from "./power-nexus";
import { vaultsOfHelia } from "./vaults-of-helia";
import { rippersBay } from "./rippers-bay";
import { ornsForge } from "./orns-forge";
import { petriciteMonument } from "./petricite-monument";
import { duneSurfer } from "./dune-surfer";
import { prizeOfProgress } from "./prize-of-progress";
import { valleyOfIdols } from "./valley-of-idols";
import { melDefiantSoul } from "./mel-defiant-soul";
import { battleMistress } from "./battle-mistress";
import { abandon } from "./abandon";
import { crumblingSands } from "./crumbling-sands";
import { defy } from "./defy";
import { hardBargain } from "./hard-bargain";
import { liltingLullaby } from "./lilting-lullaby";
import { notSoFast } from "./not-so-fast";
import { repulse } from "./repulse";
import { windWall } from "./wind-wall";
import { mysticReversal } from "./mystic-reversal";
import { rebuttal } from "./rebuttal";
import { riposte } from "./riposte";
import { imperialDecree } from "./imperial-decree";
import { ancientHenge } from "./ancient-henge";
import { butcherOfTheSands } from "./butcher-of-the-sands";
import { daughterOfTheVoid } from "./daughter-of-the-void";
import { dragonsoulSage } from "./dragonsoul-sage";
import { energyConduit } from "./energy-conduit";
import { fireBelowTheMountain } from "./fire-below-the-mountain";
import { handOfNoxus } from "./hand-of-noxus";
import { hextechAnomaly } from "./hextech-anomaly";
import { honeyfruit } from "./honeyfruit";
import { luxCrownguard } from "./lux-crownguard";
import { malzaharFanatic } from "./malzahar-fanatic";
import { platewyrmEgg } from "./platewyrm-egg";
import { scornOfTheMoon } from "./scorn-of-the-moon";
import { fioraWorthy } from "./fiora-worthy";
import { grandDuelist } from "./grand-duelist";
import { hallowedTomb } from "./hallowed-tomb";
import { jaeMedarda } from "./jae-medarda";
import { theList } from "./the-list";
import { mageseekerInvestigator } from "./mageseeker-investigator";
import { ivernFriendToAll } from "./ivern-friend-to-all";
import { dancingGrenade } from "./dancing-grenade";
import { symbolOfTheSolari } from "./symbol-of-the-solari";
import { mysticVortex } from "./mystic-vortex";
import { perchedGrimwyrm } from "./perched-grimwyrm";
import { heimerdingerInventor } from "./heimerdinger-inventor";
import { svellsongur } from "./svellsongur";
import { shadySpectacles } from "./shady-spectacles";
import { theZeroDrive } from "./the-zero-drive";
import { kayleJustified } from "./kayle-justified";
import { karthusEternal } from "./karthus-eternal";
import { virtuoso } from "./virtuoso";
import { undyingLegion } from "./undying-legion";
import { mageseekerWarden } from "./mageseeker-warden";
import { volibearImposing } from "./volibear-imposing";
import { spiritWheel } from "./spirit-wheel";
import { theDreamingTree } from "./the-dreaming-tree";
import { gardensOfBecoming } from "./gardens-of-becoming";
import { bottledConstellation } from "./bottled-constellation";
import { bulletTime } from "./bullet-time";
import { jhinMeticulousKiller } from "./jhin-meticulous-killer";
import { karmaChanneler } from "./karma-channeler";
import { maraiSpire } from "./marai-spire";
import { piltovanForge } from "./piltovan-forge";
import { mushroomPouch } from "./mushroom-pouch";
import { noxusSaboteur } from "./noxus-saboteur";
import { syndraTranscendent } from "./syndra-transcendent";
import { wilyNewtfish } from "./wily-newtfish";
import { starSpring } from "./star-spring";
import { sandsweptTomb } from "./sandswept-tomb";
import { risenAltar } from "./risen-altar";
import { vexCheerless } from "./vex-cheerless";

const handlers: SpecialCaseHandler[] = [
  dangerousDuo,
  doomedRecruit,
  stunningBlow,
  empoweredChampionBonus,
  tacticalBanner,
  ancientRuins,
  cleave,
  disintegrate,
  captainFarron,
  thermoBeam,
  magmaWurm,
  adaptatron,
  dravenShowboat,
  wielderOfWater,
  stunAnyUnit,
  ragingSoul,
  dariusTrifarian,
  caitlynPatrolling,
  wizenedElder,
  ravenbloomStudent,
  pitCrew,
  luxIlluminated,
  dianaNoLongerHuman,
  revnaTheLorekeeper,
  eclipseHerald,
  brazenBuccaneer,
  getExcited,
  noxusHopeful,
  skySplitter,
  scrapyardChampion,
  sunDisc,
  blindFury,
  brynhirThundersong,
  fallingStar,
  ragingFirebrand,
  tryndamere,
  viDestructive,
  immortalPhoenix,
  kadregrin,
  volibear,
  charm,
  enGarde,
  findYourCenter,
  maskOfForesight,
  poroHerder,
  spiritsRefuge,
  ravenbornTome,
  blitzcrank,
  lastStand,
  solariShrine,
  sona,
  taric,
  tastyFaefolk,
  watchfulSentry,
  leeSin,
  yasuo,
  leona,
  eagerApprentice,
  garbageGrabber,
  gemcraftSeer,
  portalRescue,
  retreat,
  singularity,
  spriteMother,
  drMundo,
  wraithOfEchoes,
  viktor,
  thousandTailedWatcher,
  timeWarp,
  uncheckedPower,
  arenaBar,
  bilgewaterBully,
  confront,
  duneDrake,
  firstMate,
  flurryOfBlades,
  mobilize,
  pitRookie,
  catalystOfAeons,
  cithriaOfCloudfield,
  kinkouMonk,
  spoilsOfWar,
  carnivorousSnapvine,
  leeSinCentered,
  sabotage,
  qiyana,
  heraldOfScales,
  warwickHunter,
  settBrawler,
  cemeteryAttendant,
  morbidReturn,
  gust,
  acceptableLosses,
  fadingMemories,
  undercoverAgent,
  deadbloomPredator,
  saiScout,
  sneakyDeckhand,
  missFortuneBuccaneer,
  rideTheWind,
  stackedDeck,
  theSyren,
  treasureTrove,
  zauniteBouncer,
  kogmawCaustic,
  maddenedMarauder,
  mindsplitter,
  rhasaTheSunderer,
  scrapheap,
  dazzlingAurora,
  packOfWonders,
  invertTimelines,
  jinxRebel,
  possession,
  cullTheWeak,
  faithfulManufactor,
  forgeOfTheFuture,
  soaringScout,
  trifarianGloryseeker,
  vanguardCaptain,
  noxianDrummer,
  peakGuardian,
  solariChief,
  vanguardHelm,
  fioraVictorious,
  grandStrategem,
  backToBack,
  flameChompers,
  vayneHunter,
  reinforce,
  ekkoRecurrent,
  soulgorger,
  theHarrowing,
  cruelPatron,
  spectralMatron,
  leonaDetermined,
  machineEvangel,
  settKingpin,
  dariusExecutioner,
  viktorLeader,
  icathianRain,
  stormbringer,
  altarToUnity,
  aspirantsClimb,
  navoriFightingPit,
  obeliskOfPower,
  reckonersArena,
  sigilOfTheStorm,
  theArenasGreatest,
  theGrandPlaza,
  trifarianWarCamp,
  voidGate,
  windsweptHillock,
  zaunWarrens,
  monasteryOfHirana,
  fortifiedPosition,
  targonsPeak,
  lastBreath,
  zenithBlade,
  showstopper,
  twistedFateGambler,
  annieFiery,
  annieStubborn,
  decisiveStrike,
  flash,
  garenCommander,
  recruitTheVanguard,
  tibbers,
  vanguardAttendant,
  yiHoned,
  yiMeditative,
  detonate,
  eagerDrakehound,
  gemJammer,
  ferrousForerunner,
  poroSnax,
  aspiringEngineer,
  plunderingPoro,
  laurentBladekeeper,
  yordleExplorer,
  treasureHunter,
  factoryRecall,
  eminentBenefactor,
  honestBroker,
  sandshifter,
  trustyRamhound,
  ribbonDancer,
  jaxUnrelenting,
  lucianMerciless,
  ornnForgeGod,
  sivirAmbitious,
  yoneBlademaster,
  shurelyasRequiem,
  batteringRam,
  dunebreaker,
  lucianGunslinger,
  guardianOfThePassage,
  lonelyPoro,
  apprenticeSmith,
  legionQuartermaster,
  ornnBlacksmith,
  bubbleBot,
  dropboarder,
  pickpocket,
  productionSurge,
  cardSharp,
  jayceManOfProgress,
  rumbleScrapper,
  buhruCaptain,
  dauntlessVanguard,
  direwing,
  seaMonkey,
  blastCorpsCadet,
  frostcoatCub,
  royalGuard,
  unsungHero,
  vanguardArmory,
  troveGolem,
  onTheHunt,
  arise,
  renataGlascIndustrialist,
  emperorsDais,
  minefield,
  ravenbloomConservatory,
  rockfallPath,
  seatOfPower,
  sunkenTemple,
  thePapertree,
  treasureHoard,
  veiledTemple,
  assemblyRig,
  rellMagnetic,
  tiannaCrownguard,
  forgottenMonument,
  strikeDown,
  beastBelow,
  fizzTrickster,
  ezrealProdigy,
  zaunPunk,
  xinZhaoVigilant,
  arenaKingpin,
  smite,
  vaultBreaker,
  rightOfConquest,
  scorchclaw,
  gustwalker,
  gemhandHunter,
  targonianVisionary,
  bandleSoldier,
  masterYiUnstoppable,
  concentrate,
  mosstomper,
  masterYiTempered,
  spriteBurst,
  turnToDust,
  spriteQueen,
  soulHarvest,
  soulShepherd,
  viciousSnapjaws,
  spectralCentaur,
  blackRoseDignitary,
  carrionDredger,
  loyalPoro,
  scrutinizingSergeant,
  starhound,
  leblancFragmented,
  friskyHunter,
  fateWeaver,
  ruinedRex,
  petalPixie,
  kinkouInitiate,
  gentleGemdragon,
  elderDragon,
  bewitchingSpirit,
  walkingRoost,
  anglerBeast,
  crimsonPigeons,
  riftHerald,
  deathFromBelow,
  alphaStrike,
  keepersVerdict,
  duskRoseLab,
  frozenFortress,
  trappingGrounds,
  xerathFreed,
  monch,
  shadowWatcher,
  enthusiasticPromoter,
  trevorSnoozebottom,
  vexMocking,
  ivernNurturer,
  crescentStrike,
  spriteFountain,
  hweiBroodingPainter,
  gutterPalace,
  leblancEverywhere,
  crowdFavorite,
  poppyParagon,
  crescentGuardian,
  megatusk,
  ultrasoftPoro,
  diviningShells,
  shadowsCall,
  galioIndefatigable,
  shardOfUndoing,
  theRuination,
  maduliTheGatekeeper,
  shadow,
  daisy,
  moonfall,
  isolate,
  heroicCharge,
  vexApathetic,
  preparedNeophyte,
  lordBroadmane,
  monsterHarpoon,
  yetiBrawler,
  combatExperience,
  friendship,
  scuttleCrab,
  yuumiMagicalCat,
  lilliaProtectorOfDreams,
  vilemaw,
  eclipse,
  chakramDancer,
  deadlyFlourish,
  sumpworksMap,
  nidaleeCatForm,
  rengarTrophyHunter,
  khazixMutatingHorror,
  pykeReturned,
  grimResolve,
  stareDown,
  irresistibleFaefolk,
  viPeacekeeper,
  poppyDefenderOfTheMeek,
  pridestalker,
  thrillOfTheHunt,
  bloodharborRipper,
  wujuMaster,
  iterativeDesign,
  desertsCall,
  kinkouTemple,
  bloodRush,
  twilightReveler,
  eclipseDragon,
  hiddenBlade,
  reluctantLeader,
  squareUp,
  shadowAssassin,
  shadowbladeLurker,
  appliedResearchers,
  determinedSentry,
  minotaurReckoner,
  vilemawsLair,
  fightOrFlight,
  decreeOfUnity,
  downwell,
  plazaGuardian,
  decreeOfRage,
  fioraPeerless,
  toweringPairofant,
  forsakenBaccai,
  decreeOfStrength,
  corruptEnforcer,
  heraldOfTheArcane,
  bountyHunter,
  eyeOfTwilight,
  defenderOfTomorrow,
  shadowTemple,
  patchedPorobot,
  renektonRageFueled,
  rivenShattered,
  keeperOfLaw,
  gutturalRoar,
  shenLeaderOfKinkouOrder,
  shenScourgeOfShadows,
  blackFlameAltar,
  lacerate,
  publicExecution,
  noxianDemolitionist,
  corinaVeraza,
  brutalHunter,
  ancientWarmonger,
  baccaiReaper,
  aurokGeneral,
  dragUnder,
  faePorter,
  imposingChallenger,
  forbiddingWaste,
  affectionatePoro,
  kinkouLifeblade,
  chemtechCask,
  shadowFiend,
  repairSpecialist,
  sacredProtector,
  royalEntourage,
  morganaVindictive,
  shockBlast,
  shadowOrderDisciple,
  upFromTheDeep,
  viHotheaded,
  toolsOfEmpire,
  siphoningStrike,
  ravenbloomPrefect,
  pakaaProtector,
  perfectExecution,
  rageAmplifier,
  sinisterPoro,
  steelPaws,
  tombRaiderBarbara,
  viktorInnovator,
  windAndGhosts,
  protectiveSands,
  punchingPoro,
  breakneckMech,
  corruptedDragon,
  dravenAudacious,
  jaullFish,
  sereneAscetic,
  solariSunhawk,
  zedFromTheShadows,
  baccaiWitherclaw,
  bloodMoney,
  kennenStormOfShuriken,
  missFortuneCaptain,
  ruthlessStrike,
  mirrorImage,
  oasisRaider,
  zedWithoutASound,
  noxianEmissary,
  forgottenRelic,
  ambessaTheWolf,
  ambessaRespectedAndFeared,
  baccaiSandspinner,
  frostcoatMother,
  grumpyRockbear,
  olPoro,
  altarOfMemories,
  esteemedHierophant,
  arachnoidHorror,
  accelerationGate,
  oceanDrake,
  sandstoneChimera,
  challenge,
  gentlemensDuel,
  marchingOrders,
  cataclysmicDuel,
  bladeTwirler,
  glascMixologist,
  kingsEdict,
  rampage,
  redBrambleback,
  rallyTheTroops,
  undertitan,
  overtOperation,
  shadowsOfThePast,
  undyingLoyalty,
  wallop,
  partyFavors,
  tailCloakedMatriarch,
  otterpus,
  voidRush,
  escapedGrayback,
  kharox,
  consumingCurse,
  legionMarauder,
  mournfulWitness,
  superMegaDeathRocket,
  harpoonSquad,
  katoTheArm,
  conscription,
  skywardStrike,
  wildclawShaman,
  dragonsRage,
  decreeOfDiscord,
  gustMonk,
  minahSwiftfoot,
  rocketBarrage,
  piercingLight,
  helmOfSuppression,
  faeDragon,
  safetyInspector,
  skyCruiser,
  endlessRiches,
  darkChildStarter,
  gloriousExecutioner,
  ladyOfLuminosityStarter,
  mightOfDemaciaStarter,
  theBoss,
  voidreaver,
  looseCannon,
  mechanizedMenace,
  wujuBladesmanStarter,
  gloomist,
  radiantDawn,
  keeperOfTheHammer,
  chemBaroness,
  curatorOfTheSands,
  piltoverEnforcer,
  purifier,
  relentlessStorm,
  unforgiven,
  bashfulBloom,
  emperorOfTheSands,
  nineTailedFox,
  voidBurrower,
  bladeDancer,
  akaliSilent,
  akaliDeadlyWeapon,
  dravenVanquisher,
  zileanTimeMage,
  illaoiProphetOfTheGreatKraken,
  jannaSavior,
  renataGlascMastermind,
  hallOfLegends,
  amateurRecital,
  clashOfGiants,
  dragonForm,
  lightningRush,
  twilightShroud,
  twilightStep,
  insightfulInvestigator,
  profiteer,
  renektonBrute,
  melNewlyAwakened,
  rumbleHotheaded,
  ireliaGraceful,
  arcaneShift,
  akshanMischievous,
  allayEagerAdmirer,
  angleShot,
  apheliosExalted,
  apprenticeMage,
  astralHeron,
  azirSovereign,
  blastCone,
  block,
  bellowsBreath,
  avaAchiever,
  baronNashor,
  againstTheOdds,
  backOff,
  bondsOfStrength,
  bloodRose,
  bushwhack,
  callToBattle,
  blueSentinel,
  bardMercurial,
  calledShot,
  clairvoyance,
  clockworkKeeper,
  convergentMutation,
  curtainCall,
  dameTheDespoiler,
  dangerZone,
  deathMark,
  deathgrip,
  decreeOfInsight,
  decreeOfFocus,
  dianaLunari,
  defiantDance,
  discipleOfShen,
  disposalOrder,
  dominus,
  doubleTrouble,
  dramaticVisionary,
  emperorsDivide,
  edgeOfNight,
  existentialDread,
  facebreaker,
  forecaster,
  freshBeans,
  guards,
  guerillaWarfare,
  heedlessResurrection,
  evelynnEntrancing,
  ezrealDashing,
  flurryOfFeathers,
  foxFire,
  hextechFormula,
  hextechDisc,
  iascylla,
  icevaleArcher,
  hostileTakeover,
  keeperOfMasks,
  lilliaFaeFawn,
  loyalPup,
  jayceBrilliantInventor,
  jhinMurderousArtist,
  kaisaEvolutionary,
  kennenKeeperOfBalance,
  masaCrashingThunder,
  maskMother,
  meditation,
  mesmerize,
  khaZixEvolvingHunter,
  namiHeadstrong,
  noxianGuillotine,
  overzealousFan,
  pykeDocksideButcher,
  questionableTome,
  reksaiSwarmQueen,
  relentlessPursuit,
  resonatingStrike,
  sacrifice,
  reksaiBreacher,
  ruinRunner,
  rengarPouncing,
  scryersBloom,
  shadowDash,
  shakedown,
  showOfStrength,
  shurikenFlip,
  siphonPower,
  sanction,
  spriteCall,
  starCrossed,
  spiderling,
  smokeAndMirrors,
  standUnited,
  suddenStorm,
  switcheroo,
  temporalBreach,
  temptation,
  thwonk,
  tideturner,
  tornadoWarrior,
  temporalPortal,
  unyieldingSpirit,
  teemoStrategist,
  tricksyTentacles,
  udyrWildman,
  voidDrone,
  wagesOfPain,
  whirlwind,
  wildClaw,
  windsinger,
  swainVisionary,
  swiftScout,
  candlelitSanctum,
  reaversRow,
  heishoShellOfTheWorld,
  thresholdOfTheGray,
  theAcademy,
  albusFerros,
  callToGlory,
  grandmasterAtArms,
  cursedSarcophagus,
  forgottenSignpost,
  backAlleyBar,
  counterStrike,
  kiBarrier,
  lotusTrap,
  voidAssault,
  highlander,
  tacticalRetreat,
  sorakaWanderer,
  unlicensedArmory,
  zhonyasHourglass,
  forgottenLibrary,
  stealthyPursuer,
  nasusGuardianOfKnowledge,
  powerNexus,
  vaultsOfHelia,
  rippersBay,
  ornsForge,
  petriciteMonument,
  duneSurfer,
  prizeOfProgress,
  valleyOfIdols,
  melDefiantSoul,
  battleMistress,
  abandon,
  crumblingSands,
  defy,
  hardBargain,
  liltingLullaby,
  notSoFast,
  repulse,
  windWall,
  mysticReversal,
  rebuttal,
  riposte,
  imperialDecree,
  ancientHenge,
  butcherOfTheSands,
  daughterOfTheVoid,
  dragonsoulSage,
  energyConduit,
  fireBelowTheMountain,
  handOfNoxus,
  hextechAnomaly,
  honeyfruit,
  luxCrownguard,
  malzaharFanatic,
  platewyrmEgg,
  scornOfTheMoon,
  fioraWorthy,
  grandDuelist,
  hallowedTomb,
  jaeMedarda,
  theList,
  mageseekerInvestigator,
  ivernFriendToAll,
  dancingGrenade,
  symbolOfTheSolari,
  mysticVortex,
  perchedGrimwyrm,
  heimerdingerInventor,
  svellsongur,
  shadySpectacles,
  theZeroDrive,
  kayleJustified,
  karthusEternal,
  virtuoso,
  undyingLegion,
  mageseekerWarden,
  volibearImposing,
  spiritWheel,
  theDreamingTree,
  gardensOfBecoming,
  bottledConstellation,
  bulletTime,
  jhinMeticulousKiller,
  karmaChanneler,
  maraiSpire,
  piltovanForge,
  mushroomPouch,
  noxusSaboteur,
  syndraTranscendent,
  wilyNewtfish,
  starSpring,
  sandsweptTomb,
  risenAltar,
  vexCheerless,
];

const registry = new Map<string, SpecialCaseHandler>(handlers.map((h) => [h.cardId, h]));

export function getSpecialCaseHandler(card: Card): SpecialCaseHandler | undefined {
  if (!card.specialCaseId) return undefined;
  return registry.get(card.specialCaseId);
}

export function getSpecialCaseHandlerById(specialCaseId: string): SpecialCaseHandler | undefined {
  return registry.get(specialCaseId);
}

export function specialCaseNeedsPlayTarget(card: Card): boolean {
  return getSpecialCaseHandler(card)?.needsPlayTarget ?? false;
}

function ctxFor(game: GameState, card: Card, instance: CardInstance): SpecialCaseContext {
  return { game, card, instance };
}

export const SpecialCaseEngine = {
  onPlay: (game: GameState, card: Card, instance: CardInstance, targetInstanceId?: string) => {
    getSpecialCaseHandler(card)?.onPlay?.(ctxFor(game, card, instance), targetInstanceId);
  },

  onDestroy: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onDestroy?.(ctxFor(game, card, instance));
  },

  onConquer: (game: GameState, card: Card, instance: CardInstance, excessDamage: number) => {
    getSpecialCaseHandler(card)?.onConquer?.(ctxFor(game, card, instance), excessDamage);
  },

  onAttack: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onAttack?.(ctxFor(game, card, instance));
  },

  onMove: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onMove?.(ctxFor(game, card, instance));
  },

  /** `instance` is the wearer; `gearInstance` is the Equipment just attached to it. */
  onEquip: (game: GameState, card: Card, instance: CardInstance, gearInstance: CardInstance) => {
    getSpecialCaseHandler(card)?.onEquip?.(ctxFor(game, card, instance), gearInstance);
  },

  /** `undefined` means no handler offers a "pay extra for a bonus effect" option at all — distinct from a handler that offers one for 0 Energy (e.g. Frostcoat Cub, whose whole additional cost is a Domain Rune we don't charge). */
  additionalPlayCostEnergy: (game: GameState, card: Card, instance: CardInstance): number | undefined =>
    getSpecialCaseHandler(card)?.additionalPlayCostEnergy?.(ctxFor(game, card, instance)),

  onHold: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onHold?.(ctxFor(game, card, instance));
  },

  onEndOfTurn: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onEndOfTurn?.(ctxFor(game, card, instance));
  },

  /** Broadcasts the start of `player`'s Main Phase to every board instance they control with an `onMainPhaseStart` hook. See game/turnFlow.ts. */
  onMainPhaseStart: (game: GameState, getCard: (id: string) => Card, player: PlayerId): void => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== player) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onMainPhaseStart?.(ctxFor(game, card, instance));
    }
  },

  onMoveFromBattlefield: (
    game: GameState,
    getCard: (id: string) => Card,
    card: Card,
    instance: CardInstance,
    fromBattlefieldIndex: number,
  ) => {
    getSpecialCaseHandler(card)?.onMoveFromBattlefield?.(ctxFor(game, card, instance), fromBattlefieldIndex);
    const slot = game.battlefields[fromBattlefieldIndex];
    if (slot) {
      const battlefieldCard = getCard(slot.cardId);
      const handler = getSpecialCaseHandler(battlefieldCard);
      if (handler?.onMoveFromBattlefield) {
        handler.onMoveFromBattlefield(
          ctxFor(game, battlefieldCard, battlefieldPseudoInstance(slot.cardId, instance.controller, fromBattlefieldIndex)),
          fromBattlefieldIndex,
          instance,
        );
      }
      for (const siblingId of slot.units[instance.controller]) {
        const sibling = game.instances[siblingId];
        if (!sibling) continue;
        const siblingCard = getCard(sibling.cardId);
        const siblingHandler = getSpecialCaseHandler(siblingCard);
        siblingHandler?.onAllyUnitMovedFromMyLocation?.(ctxFor(game, siblingCard, sibling), fromBattlefieldIndex, instance);
      }
    }
  },

  /** Fires a Battlefield's own onUnitReturnedToHandHere hook. See bounce-helpers.ts returnInstanceToHand. */
  onUnitReturnedToHandHere: (game: GameState, card: Card, instance: CardInstance, returnedInstance: CardInstance) => {
    getSpecialCaseHandler(card)?.onUnitReturnedToHandHere?.(ctxFor(game, card, instance), returnedInstance);
  },

  activatedAbilityCost: (game: GameState, card: Card, instance: CardInstance) => {
    const cost = getSpecialCaseHandler(card)?.activatedAbilityCost;
    if (!cost) return undefined;
    return typeof cost === "function" ? cost(ctxFor(game, card, instance)) : cost;
  },

  empowerCost: (game: GameState, card: Card, instance: CardInstance) => {
    const cost = getSpecialCaseHandler(card)?.empowerCost;
    if (!cost) return undefined;
    return typeof cost === "function" ? cost(ctxFor(game, card, instance)) : cost;
  },

  additionalCostDiscardForReduction: (card: Card) =>
    getSpecialCaseHandler(card)?.additionalCostDiscardForReduction,

  additionalCostXPForReduction: (card: Card) => getSpecialCaseHandler(card)?.additionalCostXPForReduction,

  costReduction: (game: GameState, card: Card, instance: CardInstance): number =>
    getSpecialCaseHandler(card)?.costReduction?.(ctxFor(game, card, instance)) ?? 0,

  /** True if this card can't be played right now at all (e.g. Ol' Poro: "I can't be played on your first, second, or third turns."). */
  blocksSelfPlay: (game: GameState, card: Card, instance: CardInstance): boolean =>
    getSpecialCaseHandler(card)?.blocksSelfPlay?.(ctxFor(game, card, instance)) ?? false,

  banishSelfOnResolve: (game: GameState, card: Card, instance: CardInstance): boolean =>
    getSpecialCaseHandler(card)?.banishSelfOnResolve?.(ctxFor(game, card, instance)) ?? false,

  recycleSelfOnDestroy: (game: GameState, card: Card, instance: CardInstance): boolean =>
    getSpecialCaseHandler(card)?.recycleSelfOnDestroy?.(ctxFor(game, card, instance)) ?? false,

  /**
   * `undefined` means the card has no conditional-Ganking handler at all (fall back to the
   * printed keyword check). A defined `true`/`false` is authoritative and OVERRIDES the printed
   * keyword — needed because the bracket-import can't distinguish a conditionally-granted
   * keyword mention from a printed one (see docs/data-sourcing.md; same quirk as Raging Soul),
   * so cards like Bilgewater Bully ("While I'm buffed, I have Ganking") import with an
   * unconditional printed "ganking" that would otherwise always win.
   */
  hasConditionalGanking: (game: GameState, card: Card, instance: CardInstance): boolean | undefined =>
    getSpecialCaseHandler(card)?.hasConditionalGanking?.(ctxFor(game, card, instance)),

  hasConditionalBackline: (game: GameState, card: Card, instance: CardInstance): boolean =>
    Boolean(getSpecialCaseHandler(card)?.hasConditionalBackline?.(ctxFor(game, card, instance))),

  /**
   * True if `assigningPlayer` (whoever's splitting their damage total among targets — the
   * attacker for the attacker-deals-damage half of a Showdown, the defender for the other half)
   * ignores [Tank] here — either because they control the Battlefield with an `ignoresTankHere`
   * handler, or because they control a unit there with one (e.g. Dune Surfer, a unit: "You
   * ignore [Tank] while assigning combat damage here." — "you" is that unit's own controller).
   * See game/combat.ts orderForDamageAssignment.
   */
  ignoresTankHere: (game: GameState, getCard: (id: string) => Card, battlefieldIndex: number, assigningPlayer: PlayerId): boolean => {
    const slot = game.battlefields[battlefieldIndex];
    if (!slot) return false;
    if (slot.controller === assigningPlayer) {
      const battlefieldCard = getCard(slot.cardId);
      const battlefieldHandler = getSpecialCaseHandler(battlefieldCard);
      if (
        battlefieldHandler?.ignoresTankHere?.(
          ctxFor(game, battlefieldCard, battlefieldPseudoInstance(slot.cardId, assigningPlayer, battlefieldIndex)),
        )
      ) {
        return true;
      }
    }
    for (const instanceId of slot.units[assigningPlayer]) {
      const instance = game.instances[instanceId];
      if (!instance) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      if (handler?.ignoresTankHere?.(ctxFor(game, card, instance))) return true;
    }
    return false;
  },

  /**
   * True if any OTHER same-controller instance (anywhere — base, battlefield, or attached gear;
   * each handler decides its own location scoping, e.g. Soraka checks "here" itself, Zhonya's
   * Hourglass doesn't) passively redirects `dyingInstance` away from death.
   */
  preventsAllyDeath: (game: GameState, getCard: (id: string) => Card, dyingInstance: CardInstance): boolean => {
    for (const instance of Object.values(game.instances)) {
      if (instance.instanceId === dyingInstance.instanceId || instance.controller !== dyingInstance.controller) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      if (handler?.preventsAllyDeathHere?.(ctxFor(game, card, instance), dyingInstance)) return true;
    }
    return false;
  },

  allowsPlayToEnemyOccupiedBattlefield: (game: GameState, card: Card, instance: CardInstance): boolean =>
    getSpecialCaseHandler(card)?.allowsPlayToEnemyOccupiedBattlefield?.(ctxFor(game, card, instance)) ?? false,

  allowsPlayToOpenBattlefield: (game: GameState, card: Card, instance: CardInstance): boolean =>
    getSpecialCaseHandler(card)?.allowsPlayToOpenBattlefield?.(ctxFor(game, card, instance)) ?? false,

  /** Sum of Energy cost reductions every other special-case card the controller owns grants to the card about to be played. */
  costReductionFromAllies: (
    game: GameState,
    getCard: (cardId: string) => Card,
    playedInstance: CardInstance,
    playedCard: Card,
  ): number => {
    let total = 0;
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === playedInstance.instanceId) continue;
      if (sourceInstance.controller !== playedInstance.controller) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      const fn = handler?.costReductionForAlly;
      if (!fn) continue;
      total += fn(ctxFor(game, sourceCard, sourceInstance), playedCard);
    }
    game.battlefields.forEach((slot, index) => {
      if (slot.controller !== playedInstance.controller) return;
      const card = getCard(slot.cardId);
      const handler = getSpecialCaseHandler(card);
      const fn = handler?.costReductionForAlly;
      if (!fn) return;
      total += fn(ctxFor(game, card, battlefieldPseudoInstance(slot.cardId, playedInstance.controller, index)), playedCard);
    });
    return total;
  },

  costIncreaseFromEnemies: (
    game: GameState,
    getCard: (cardId: string) => Card,
    playedInstance: CardInstance,
    playedCard: Card,
  ): number => {
    let total = 0;
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.controller === playedInstance.controller) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      const fn = handler?.costIncreaseForEnemy;
      if (!fn) continue;
      total += fn(ctxFor(game, sourceCard, sourceInstance), playedCard);
    }
    return total;
  },

  /** Energy cost increase for `playedCard` from any Battlefield `playedInstance`'s controller controls with a `costIncreaseForControllerUnit` hook (e.g. Vaults of Helia). See game/moves.ts playCard. */
  costIncreaseFromControlledBattlefields: (
    game: GameState,
    getCard: (id: string) => Card,
    playedInstance: CardInstance,
    playedCard: Card,
  ): number => {
    let total = 0;
    game.battlefields.forEach((slot, index) => {
      if (slot.controller !== playedInstance.controller) return;
      const card = getCard(slot.cardId);
      const handler = getSpecialCaseHandler(card);
      const fn = handler?.costIncreaseForControllerUnit;
      if (!fn) return;
      total += fn(ctxFor(game, card, battlefieldPseudoInstance(slot.cardId, playedInstance.controller, index)), playedCard);
    });
    return total;
  },

  /** Energy cost reduction for `playedCard` if `targetInstanceId` is the spell's chosen target, that target is controlled by the same player casting the spell, and its handler grants a reduction for being chosen this way (e.g. Irelia, Graceful: "Your spells that choose me..."). See game/moves.ts playCard. */
  costReductionIfTargeted: (
    game: GameState,
    getCard: (cardId: string) => Card,
    targetInstanceId: string | undefined,
    playedCard: Card,
    playedInstance: CardInstance,
  ): number => {
    if (!targetInstanceId) return 0;
    const target = game.instances[targetInstanceId];
    if (!target || target.controller !== playedInstance.controller) return 0;
    const targetCard = getCard(target.cardId);
    return getSpecialCaseHandler(targetCard)?.costReductionIfTargetedBySpell?.(ctxFor(game, targetCard, target), playedCard) ?? 0;
  },

  activateNeedsTarget: (card: Card) => getSpecialCaseHandler(card)?.activateNeedsTarget ?? false,

  onActivate: (game: GameState, card: Card, instance: CardInstance, targetInstanceId?: string) => {
    getSpecialCaseHandler(card)?.onActivate?.(ctxFor(game, card, instance), targetInstanceId);
  },

  /** Broadcasts a gear's just-used activated ability to every OTHER same-controller instance with an `onAllyActivatedGearAbility` hook. See game/moves.ts activateAbility. */
  onAllyActivatedGearAbility: (
    game: GameState,
    getCard: (id: string) => Card,
    controller: PlayerId,
    activatedInstanceId: string,
  ): void => {
    for (const instance of Object.values(game.instances)) {
      if (instance.instanceId === activatedInstanceId || instance.controller !== controller) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onAllyActivatedGearAbility?.(ctxFor(game, card, instance));
    }
  },

  /** Broadcasts a just-played card to every board instance `player` controls with an `onAllyCardPlayed` hook. */
  onAllyCardPlayed: (
    game: GameState,
    getCard: (id: string) => Card,
    player: PlayerId,
    playedCard: Card,
    playCountThisTurn: number,
  ) => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== player) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onAllyCardPlayed?.(ctxFor(game, card, instance), playedCard, playCountThisTurn);
    }
    const legend = game.players[player].legend;
    if (legend) {
      const legendCard = getCard(legend.cardId);
      const handler = getSpecialCaseHandler(legendCard);
      if (handler?.onAllyCardPlayed) {
        handler.onAllyCardPlayed(
          ctxFor(game, legendCard, legendPseudoInstance(legend.cardId, player, legend.exhausted)),
          playedCard,
          playCountThisTurn,
        );
      }
    }
    game.battlefields.forEach((slot, index) => {
      if (slot.controller !== player) return;
      const card = getCard(slot.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onAllyCardPlayed?.(
        ctxFor(game, card, battlefieldPseudoInstance(slot.cardId, player, index)),
        playedCard,
        playCountThisTurn,
      );
    });
  },

  /** Fires a Battlefield's own onCardPlayedHere hook when a unit/gear is played directly to it. See game/moves.ts resolvePlayedCard. */
  onCardPlayedHere: (
    game: GameState,
    getCard: (id: string) => Card,
    battlefieldIndex: number,
    playedCard: Card,
    playedInstance: CardInstance,
    playingPlayer: PlayerId,
  ): void => {
    const slot = game.battlefields[battlefieldIndex];
    if (!slot) return;
    const card = getCard(slot.cardId);
    const handler = getSpecialCaseHandler(card);
    handler?.onCardPlayedHere?.(
      ctxFor(game, card, battlefieldPseudoInstance(slot.cardId, playingPlayer, battlefieldIndex)),
      playedCard,
      playedInstance,
      playingPlayer,
    );
  },

  /** Broadcasts a just-played card to every board instance the OPPONENT of `player` owns, for onEnemyCardPlayed hooks (e.g. Vex, Apathetic). */
  onEnemyCardPlayed: (
    game: GameState,
    getCard: (id: string) => Card,
    player: PlayerId,
    playedCard: Card,
    playedInstance: CardInstance,
  ) => {
    const opponentId: PlayerId = player === "0" ? "1" : "0";
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== opponentId) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onEnemyCardPlayed?.(ctxFor(game, card, instance), playedCard, playedInstance);
    }
  },

  /** Broadcasts a just-created token to every board instance `controller` owns, for onAllyTokenPlayed hooks (e.g. Lillia, Protector of Dreams). */
  onAllyTokenPlayed: (
    game: GameState,
    getCard: (id: string) => Card,
    controller: PlayerId,
    tokenCard: Card,
    tokenInstance: CardInstance,
  ) => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== controller) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onAllyTokenPlayed?.(ctxFor(game, card, instance), tokenCard, tokenInstance);
    }
  },

  /** Broadcasts a just-stunned enemy unit to every board instance `stunningController` controls with an `onAllyStun` hook. */
  onAllyStun: (
    game: GameState,
    getCard: (id: string) => Card,
    stunningController: PlayerId,
    stunnedInstance: CardInstance,
  ) => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== stunningController) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onAllyStun?.(ctxFor(game, card, instance), stunnedInstance);
    }
    const legend = game.players[stunningController].legend;
    if (legend) {
      const legendCard = getCard(legend.cardId);
      const handler = getSpecialCaseHandler(legendCard);
      if (handler?.onAllyStun) {
        handler.onAllyStun(
          ctxFor(game, legendCard, legendPseudoInstance(legend.cardId, stunningController, legend.exhausted)),
          stunnedInstance,
        );
      }
    }
  },

  /** Broadcasts a just-killed-by-spell enemy unit to every card in `controller`'s trash with an `onTrashKillWithSpell` hook. */
  onAllyKillWithSpell: (
    game: GameState,
    getCard: (id: string) => Card,
    controller: PlayerId,
    killedInstance: CardInstance,
  ) => {
    for (const cardId of game.players[controller].trash) {
      const card = getCard(cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onTrashKillWithSpell?.(game, controller, cardId, killedInstance);
    }
  },

  /** Offers a "you may pay X to Y" reactive decision to `playerId`, resolved by the `resolveOptionalCost` move. */
  offerOptionalCost: (
    game: GameState,
    playerId: PlayerId,
    specialCaseId: string,
    cost: { energy: number; runeDomain?: Domain },
    payload?: string,
  ) => {
    game.pendingOptionalCost = { playerId, specialCaseId, cost, payload };
  },

  onOptionalCostPaid: (game: GameState, specialCaseId: string, playerId: PlayerId, payload?: string) => {
    getSpecialCaseHandlerById(specialCaseId)?.onOptionalCostPaid?.(game, playerId, payload);
  },

  onSelfDiscarded: (game: GameState, getCard: (id: string) => Card, playerId: PlayerId, cardId: string) => {
    getSpecialCaseHandler(getCard(cardId))?.onSelfDiscarded?.(game, playerId);
  },

  /** Broadcasts a just-killed enemy unit to every board instance `killingController` controls with an `onAllyKillUnit` hook. */
  onAllyKillUnit: (
    game: GameState,
    getCard: (id: string) => Card,
    killingController: PlayerId,
    killedInstance: CardInstance,
  ) => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== killingController) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onAllyKillUnit?.(ctxFor(game, card, instance), killedInstance);
    }
  },

  /** Broadcasts to every board instance `discardingController` owns with an `onAllyDiscard` hook. */
  onAllyDiscard: (game: GameState, getCard: (id: string) => Card, discardingController: PlayerId) => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== discardingController) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onAllyDiscard?.(ctxFor(game, card, instance));
    }
  },

  onBeginningWhileHeld: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onBeginningWhileHeld?.(ctxFor(game, card, instance));
  },

  onBeginning: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onBeginning?.(ctxFor(game, card, instance));
  },

  onConquerHere: (
    game: GameState,
    card: Card,
    instance: CardInstance,
    conqueringUnitIds: string[],
    excessDamage: number,
  ) => {
    getSpecialCaseHandler(card)?.onConquerHere?.(ctxFor(game, card, instance), conqueringUnitIds, excessDamage);
  },

  onDefendHere: (game: GameState, card: Card, instance: CardInstance, defenderIds: string[]) => {
    getSpecialCaseHandler(card)?.onDefendHere?.(ctxFor(game, card, instance), defenderIds);
  },

  /** Sums every board instance the controller owns with a `staticSpellDamageBonus` hook. */
  spellDamageBonusFromAllies: (game: GameState, getCard: (id: string) => Card, controller: PlayerId): number => {
    let total = 0;
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== controller) continue;
      const card = getCard(instance.cardId);
      const fn = getSpecialCaseHandler(card)?.staticSpellDamageBonus;
      if (!fn) continue;
      total += fn(ctxFor(game, card, instance));
    }
    return total;
  },

  onFirstBeginningPhase: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onFirstBeginningPhase?.(ctxFor(game, card, instance));
  },

  onEveryBeginningPhase: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onEveryBeginningPhase?.(ctxFor(game, card, instance));
  },

  /** Sums every in-play Battlefield's `winScoreIncrease`, regardless of controller. */
  winScoreBonus: (game: GameState, getCard: (id: string) => Card): number => {
    let total = 0;
    for (const slot of game.battlefields) {
      const card = getCard(slot.cardId);
      const handler = getSpecialCaseHandler(card);
      if (!handler?.winScoreIncrease) continue;
      total += handler.winScoreIncrease(ctxFor(game, card, battlefieldPseudoInstance(slot.cardId, "0")));
    }
    return total;
  },

  /** Location-wide Might modifier from the Battlefield `targetInstance` is currently sitting at, regardless of controller. */
  staticMightModifierFromBattlefield: (
    game: GameState,
    getCard: (id: string) => Card,
    targetInstance: CardInstance,
  ): number => {
    if (targetInstance.zone !== "battlefield" || targetInstance.battlefieldIndex === null) return 0;
    const slot = game.battlefields[targetInstance.battlefieldIndex];
    const card = getCard(slot.cardId);
    const fn = getSpecialCaseHandler(card)?.staticMightModifierForUnitsHere;
    if (!fn) return 0;
    return fn(
      ctxFor(game, card, battlefieldPseudoInstance(slot.cardId, targetInstance.controller, targetInstance.battlefieldIndex)),
      targetInstance,
    );
  },

  /** Location-wide, defending-only Might modifier from the Battlefield `targetInstance` is currently sitting at. */
  defendingMightModifierFromBattlefield: (
    game: GameState,
    getCard: (id: string) => Card,
    targetInstance: CardInstance,
  ): number => {
    if (targetInstance.zone !== "battlefield" || targetInstance.battlefieldIndex === null) return 0;
    const slot = game.battlefields[targetInstance.battlefieldIndex];
    const card = getCard(slot.cardId);
    const fn = getSpecialCaseHandler(card)?.defendingMightModifierForUnitsHere;
    if (!fn) return 0;
    return fn(
      ctxFor(game, card, battlefieldPseudoInstance(slot.cardId, targetInstance.controller, targetInstance.battlefieldIndex)),
      targetInstance,
    );
  },

  /** True if the Battlefield `instance` is currently sitting at grants Ganking to every unit there. */
  grantsGankingFromBattlefield: (
    game: GameState,
    getCard: (id: string) => Card,
    instance: CardInstance,
  ): boolean => {
    if (instance.zone !== "battlefield" || instance.battlefieldIndex === null) return false;
    const slot = game.battlefields[instance.battlefieldIndex];
    const card = getCard(slot.cardId);
    return (
      getSpecialCaseHandler(card)?.grantsGankingToUnitsHere?.(
        ctxFor(game, card, battlefieldPseudoInstance(slot.cardId, instance.controller, instance.battlefieldIndex)),
      ) ?? false
    );
  },

  /** True if the Battlefield at `battlefieldIndex`, or any unit sitting there, blocks `controller` from playing units directly to it. */
  blocksUnitsPlayedHere: (
    game: GameState,
    getCard: (id: string) => Card,
    battlefieldIndex: number,
    controller: PlayerId,
  ): boolean => {
    const slot = game.battlefields[battlefieldIndex];
    const card = getCard(slot.cardId);
    if (
      getSpecialCaseHandler(card)?.blocksUnitsPlayedHere?.(
        ctxFor(game, card, battlefieldPseudoInstance(slot.cardId, controller, battlefieldIndex)),
      )
    ) {
      return true;
    }
    for (const side of ["0", "1"] as PlayerId[]) {
      for (const instanceId of slot.units[side]) {
        const instance = game.instances[instanceId];
        if (!instance) continue;
        const unitCard = getCard(instance.cardId);
        const handler = getSpecialCaseHandler(unitCard);
        if (handler?.blocksUnitsPlayedByOpponentHere?.(ctxFor(game, unitCard, instance), controller)) return true;
      }
    }
    return false;
  },

  /** True if `scoringPlayer` is blocked from scoring the point they'd otherwise get for holding the Battlefield at `battlefieldIndex`. */
  blocksScoringFor: (
    game: GameState,
    getCard: (id: string) => Card,
    battlefieldIndex: number,
    scoringPlayer: PlayerId,
  ): boolean => {
    const slot = game.battlefields[battlefieldIndex];
    const battlefieldCard = getCard(slot.cardId);
    if (
      getSpecialCaseHandler(battlefieldCard)?.blocksScoringHere?.(
        ctxFor(game, battlefieldCard, battlefieldPseudoInstance(slot.cardId, scoringPlayer, battlefieldIndex)),
      )
    ) {
      return true;
    }
    const opponentId: PlayerId = scoringPlayer === "0" ? "1" : "0";
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== opponentId) continue;
      const card = getCard(instance.cardId);
      if (getSpecialCaseHandler(card)?.blocksOpponentScoring?.(ctxFor(game, card, instance))) return true;
    }
    return false;
  },

  /** True if any instance the doomed Temporary instance's own controller owns prevents its death this Beginning Phase (e.g. LeBlanc, Everywhere at Once). */
  preventsTemporaryDeath: (game: GameState, getCard: (id: string) => Card, doomedInstance: CardInstance): boolean => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== doomedInstance.controller) continue;
      const card = getCard(instance.cardId);
      if (getSpecialCaseHandler(card)?.preventsTemporaryDeath?.(ctxFor(game, card, instance), doomedInstance)) {
        return true;
      }
    }
    return false;
  },

  preventsCombatDamage: (game: GameState, card: Card, instance: CardInstance): boolean =>
    Boolean(getSpecialCaseHandler(card)?.preventsCombatDamage?.(ctxFor(game, card, instance))),

  /** True if any ENEMY instance's static presence prevents `instance` from dealing combat damage (e.g. Vilemaw). */
  preventsCombatDamageForEnemy: (
    game: GameState,
    getCard: (id: string) => Card,
    instance: CardInstance,
  ): boolean => {
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.controller === instance.controller) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      if (handler?.preventsCombatDamageForEnemy?.(ctxFor(game, sourceCard, sourceInstance), instance)) {
        return true;
      }
    }
    return false;
  },

  onDefend: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onDefend?.(ctxFor(game, card, instance));
  },

  onSurviveCombat: (game: GameState, card: Card, instance: CardInstance) => {
    getSpecialCaseHandler(card)?.onSurviveCombat?.(ctxFor(game, card, instance));
  },

  /** Broadcasts a scoring event to every board instance the OPPONENT of `scoringPlayer` owns, for onOpponentScored hooks (e.g. Sumpworks Map). */
  onOpponentScored: (
    game: GameState,
    getCard: (id: string) => Card,
    scoringPlayer: PlayerId,
    scoredPoints: number,
  ) => {
    const opponentId: PlayerId = scoringPlayer === "0" ? "1" : "0";
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== opponentId) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onOpponentScored?.(ctxFor(game, card, instance), scoredPoints);
    }
  },

  preventsSelfReady: (game: GameState, card: Card, instance: CardInstance): boolean =>
    Boolean(getSpecialCaseHandler(card)?.preventsSelfReady?.(ctxFor(game, card, instance))),

  /** True if any in-play instance (self-restriction or ambient) prevents `target` from moving to base. */
  preventsMoveToBase: (game: GameState, getCard: (id: string) => Card, target: CardInstance): boolean => {
    for (const sourceInstance of Object.values(game.instances)) {
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      if (handler?.preventsMoveToBase?.(ctxFor(game, sourceCard, sourceInstance), target)) return true;
    }
    return false;
  },

  /** True if the Battlefield `target` currently sits at blocks moving to base from here. */
  blocksMoveToBaseFromBattlefield: (game: GameState, getCard: (id: string) => Card, target: CardInstance): boolean => {
    if (target.zone !== "battlefield" || target.battlefieldIndex === null) return false;
    const slot = game.battlefields[target.battlefieldIndex];
    const card = getCard(slot.cardId);
    return Boolean(
      getSpecialCaseHandler(card)?.blocksUnitsMovedToBaseFromHere?.(
        ctxFor(game, card, battlefieldPseudoInstance(slot.cardId, target.controller, target.battlefieldIndex)),
      ),
    );
  },

  /** Extra spell damage from the Battlefield `targetInstance` is currently sitting at. */
  spellDamageBonusFromBattlefield: (
    game: GameState,
    getCard: (id: string) => Card,
    targetInstance: CardInstance,
  ): number => {
    if (targetInstance.zone !== "battlefield" || targetInstance.battlefieldIndex === null) return 0;
    const slot = game.battlefields[targetInstance.battlefieldIndex];
    const card = getCard(slot.cardId);
    const fn = getSpecialCaseHandler(card)?.spellDamageBonusForUnitsHere;
    if (!fn) return 0;
    return fn(
      ctxFor(game, card, battlefieldPseudoInstance(slot.cardId, targetInstance.controller, targetInstance.battlefieldIndex)),
      targetInstance,
    );
  },

  /** Broadcasts a just-died unit to every OTHER board instance its own controller owns with an `onAllyUnitDied` hook. */
  onAllyUnitDied: (
    game: GameState,
    getCard: (id: string) => Card,
    controller: PlayerId,
    diedInstance: CardInstance,
  ) => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== controller) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onAllyUnitDied?.(ctxFor(game, card, instance), diedInstance);
    }
  },

  /** Broadcasts a just-died unit to every board instance the OPPOSING controller owns with an `onEnemyUnitDied` hook. */
  onEnemyUnitDied: (
    game: GameState,
    getCard: (id: string) => Card,
    diedController: PlayerId,
    diedInstance: CardInstance,
  ) => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller === diedController) continue;
      const card = getCard(instance.cardId);
      const handler = getSpecialCaseHandler(card);
      handler?.onEnemyUnitDied?.(ctxFor(game, card, instance), diedInstance);
    }
    for (const opponentId of ["0", "1"] as PlayerId[]) {
      if (opponentId === diedController) continue;
      const legend = game.players[opponentId].legend;
      if (!legend) continue;
      const legendCard = getCard(legend.cardId);
      const handler = getSpecialCaseHandler(legendCard);
      if (handler?.onEnemyUnitDied) {
        handler.onEnemyUnitDied(
          ctxFor(game, legendCard, legendPseudoInstance(legend.cardId, opponentId, legend.exhausted)),
          diedInstance,
        );
      }
    }
  },

  staticMightModifier: (game: GameState, card: Card, instance: CardInstance): number =>
    getSpecialCaseHandler(card)?.staticMightModifier?.(ctxFor(game, card, instance)) ?? 0,

  attackingMightModifier: (game: GameState, card: Card, instance: CardInstance): number =>
    getSpecialCaseHandler(card)?.attackingMightModifier?.(ctxFor(game, card, instance)) ?? 0,

  defendingMightModifier: (game: GameState, card: Card, instance: CardInstance): number =>
    getSpecialCaseHandler(card)?.defendingMightModifier?.(ctxFor(game, card, instance)) ?? 0,

  /** Sum of attacking-Might bonuses granted to `allyInstance` by every allied Gear/Battlefield special case currently in play, plus its controller's Legend if it grants one (e.g. Purifier). */
  attackingMightBonusFromAllies: (
    game: GameState,
    getCard: (cardId: string) => Card,
    allyInstance: CardInstance,
  ): number => {
    let total = 0;
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === allyInstance.instanceId) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      const fn = handler?.attackingMightBonusForAlly;
      if (!fn) continue;
      total += fn(ctxFor(game, sourceCard, sourceInstance), allyInstance);
    }
    const legend = game.players[allyInstance.controller].legend;
    if (legend) {
      const legendCard = getCard(legend.cardId);
      const fn = getSpecialCaseHandler(legendCard)?.attackingMightBonusForAlly;
      if (fn) total += fn(ctxFor(game, legendCard, legendPseudoInstance(legend.cardId, allyInstance.controller, legend.exhausted)), allyInstance);
    }
    return total;
  },

  /** Same as `attackingMightBonusFromAllies`, but while the ally defends. */
  defendingMightBonusFromAllies: (
    game: GameState,
    getCard: (cardId: string) => Card,
    allyInstance: CardInstance,
  ): number => {
    let total = 0;
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === allyInstance.instanceId) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      const fn = handler?.defendingMightBonusForAlly;
      if (!fn) continue;
      total += fn(ctxFor(game, sourceCard, sourceInstance), allyInstance);
    }
    const legend = game.players[allyInstance.controller].legend;
    if (legend) {
      const legendCard = getCard(legend.cardId);
      const fn = getSpecialCaseHandler(legendCard)?.defendingMightBonusForAlly;
      if (fn) total += fn(ctxFor(game, legendCard, legendPseudoInstance(legend.cardId, allyInstance.controller, legend.exhausted)), allyInstance);
    }
    return total;
  },

  /** Conditional self "enters ready" check for the card being played itself. */
  selfEntersReady: (game: GameState, card: Card, instance: CardInstance): boolean =>
    getSpecialCaseHandler(card)?.selfEntersReady?.(ctxFor(game, card, instance)) ?? false,

  /** Sum of static Might modifiers every enemy special-case card's presence applies to `targetInstance`, independent of role. */
  staticMightModifierFromEnemies: (
    game: GameState,
    getCard: (cardId: string) => Card,
    targetInstance: CardInstance,
  ): number => {
    let total = 0;
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === targetInstance.instanceId) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      const fn = handler?.staticMightModifierForEnemy;
      if (!fn) continue;
      total += fn(ctxFor(game, sourceCard, sourceInstance), targetInstance);
    }
    return total;
  },

  /** Sum of static Might modifiers every ally special-case card's presence applies to `targetInstance`, independent of role, plus its controller's Legend if it grants one (e.g. Wuju Master). */
  staticMightModifierFromAllies: (
    game: GameState,
    getCard: (cardId: string) => Card,
    targetInstance: CardInstance,
  ): number => {
    let total = 0;
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === targetInstance.instanceId) continue;
      if (sourceInstance.controller !== targetInstance.controller) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      const fn = handler?.staticMightModifierForAlly;
      if (!fn) continue;
      total += fn(ctxFor(game, sourceCard, sourceInstance), targetInstance);
    }
    const legend = game.players[targetInstance.controller].legend;
    if (legend) {
      const legendCard = getCard(legend.cardId);
      const fn = getSpecialCaseHandler(legendCard)?.staticMightModifierForAlly;
      if (fn) total += fn(ctxFor(game, legendCard, legendPseudoInstance(legend.cardId, targetInstance.controller, legend.exhausted)), targetInstance);
    }
    return total;
  },

  /** True if any other friendly special-case card (or the controller's Legend) tells `newInstance` to enter play ready instead of exhausted. */
  othersEnterReadyFor: (
    game: GameState,
    getCard: (cardId: string) => Card,
    newInstance: CardInstance,
  ): boolean => {
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === newInstance.instanceId) continue;
      if (sourceInstance.controller !== newInstance.controller) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      if (handler?.othersEnterReady?.(ctxFor(game, sourceCard, sourceInstance), newInstance)) return true;
    }
    const legend = game.players[newInstance.controller].legend;
    if (legend) {
      const legendCard = getCard(legend.cardId);
      const handler = getSpecialCaseHandler(legendCard);
      if (handler?.othersEnterReady?.(ctxFor(game, legendCard, legendPseudoInstance(legend.cardId, newInstance.controller, legend.exhausted)), newInstance)) {
        return true;
      }
    }
    return false;
  },

  /** True if any other friendly special-case card grants `newInstance` (a unit/champion) permission to play to an open Battlefield. */
  othersCanPlayToOpenBattlefield: (
    game: GameState,
    getCard: (cardId: string) => Card,
    newInstance: CardInstance,
  ): boolean => {
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.instanceId === newInstance.instanceId) continue;
      if (sourceInstance.controller !== newInstance.controller) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      if (handler?.grantsOthersPlayToOpenBattlefield?.(ctxFor(game, sourceCard, sourceInstance))) return true;
    }
    return false;
  },

  /**
   * True if `instance`'s card may be played to the Battlefield at `battlefieldIndex`, where the
   * opponent has EXACTLY ONE unit — checks the "alone" condition itself, then consults both the
   * card's own `allowsPlayToLoneEnemyBattlefield` and every ally's `grantsOthersPlayToLoneEnemyBattlefield`
   * (e.g. Arachnoid Horror grants both to itself and to its controller's other units).
   */
  allowsPlayToLoneEnemyBattlefield: (
    game: GameState,
    getCard: (cardId: string) => Card,
    card: Card,
    instance: CardInstance,
    battlefieldIndex: number,
  ): boolean => {
    const slot = game.battlefields[battlefieldIndex];
    const enemyId: PlayerId = instance.controller === "0" ? "1" : "0";
    if (slot.units[enemyId].length !== 1) return false;
    if (getSpecialCaseHandler(card)?.allowsPlayToLoneEnemyBattlefield?.(ctxFor(game, card, instance))) return true;
    for (const sourceInstance of Object.values(game.instances)) {
      if (sourceInstance.controller !== instance.controller) continue;
      const sourceCard = getCard(sourceInstance.cardId);
      const handler = getSpecialCaseHandler(sourceCard);
      if (handler?.grantsOthersPlayToLoneEnemyBattlefield?.(ctxFor(game, sourceCard, sourceInstance))) return true;
    }
    return false;
  },

  /** True if this instance is immune to damage from ENEMY spells/abilities right now (e.g. Esteemed Hierophant). Only consulted in spellDamage.ts when the damage source's controller differs from this instance's controller. */
  preventsEnemySpellDamage: (game: GameState, card: Card, instance: CardInstance): boolean =>
    getSpecialCaseHandler(card)?.preventsEnemySpellDamage?.(ctxFor(game, card, instance)) ?? false,

  /** Broadcasts a Showdown win to every board instance and the Legend pseudo-instance of `winner`. See combat.ts resolveCombat. */
  onWinCombat: (game: GameState, getCard: (id: string) => Card, winner: PlayerId): void => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== winner) continue;
      const card = getCard(instance.cardId);
      getSpecialCaseHandler(card)?.onWinCombat?.(ctxFor(game, card, instance));
    }
    const legend = game.players[winner].legend;
    if (legend) {
      const legendCard = getCard(legend.cardId);
      const handler = getSpecialCaseHandler(legendCard);
      if (handler?.onWinCombat) {
        handler.onWinCombat(ctxFor(game, legendCard, legendPseudoInstance(legend.cardId, winner, legend.exhausted)));
      }
    }
  },

  /** Broadcasts the start of a showdown to every instance (both controllers) sitting at `battlefieldIndex`. See game/moves.ts attackBattlefield. */
  onShowdownBegin: (game: GameState, getCard: (id: string) => Card, battlefieldIndex: number): void => {
    const slot = game.battlefields[battlefieldIndex];
    if (!slot) return;
    for (const instanceId of [...slot.units["0"], ...slot.units["1"]]) {
      const instance = game.instances[instanceId];
      if (!instance) continue;
      const card = getCard(instance.cardId);
      getSpecialCaseHandler(card)?.onShowdownBegin?.(ctxFor(game, card, instance));
    }
  },

  /** Broadcasts an attack on `defendingController`'s Battlefield to every board instance and the Legend they control. See game/moves.ts attackBattlefield. */
  onEnemyAttackHere: (
    game: GameState,
    getCard: (id: string) => Card,
    defendingController: PlayerId,
    attackingInstance: CardInstance,
  ): void => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== defendingController) continue;
      const card = getCard(instance.cardId);
      getSpecialCaseHandler(card)?.onEnemyAttackHere?.(ctxFor(game, card, instance), attackingInstance);
    }
    const legend = game.players[defendingController].legend;
    if (legend) {
      const legendCard = getCard(legend.cardId);
      const handler = getSpecialCaseHandler(legendCard);
      if (handler?.onEnemyAttackHere) {
        handler.onEnemyAttackHere(
          ctxFor(game, legendCard, legendPseudoInstance(legend.cardId, defendingController, legend.exhausted)),
          attackingInstance,
        );
      }
    }
    if (attackingInstance.battlefieldIndex !== null) {
      const slot = game.battlefields[attackingInstance.battlefieldIndex];
      const battlefieldCard = getCard(slot.cardId);
      const handler = getSpecialCaseHandler(battlefieldCard);
      if (handler?.onEnemyAttackHere) {
        handler.onEnemyAttackHere(
          ctxFor(game, battlefieldCard, battlefieldPseudoInstance(slot.cardId, defendingController, attackingInstance.battlefieldIndex)),
          attackingInstance,
        );
      }
    }
  },

  onBecomeEmpowered: (game: GameState, card: Card, instance: CardInstance): void => {
    getSpecialCaseHandler(card)?.onBecomeEmpowered?.(ctxFor(game, card, instance));
  },

  /** Lowest channelAmountCap found across every in-play instance (any controller), or `undefined` if none apply. See turnFlow.ts runChannel. */
  channelAmountCap: (game: GameState, getCard: (cardId: string) => Card): number | undefined => {
    let cap: number | undefined;
    for (const instance of Object.values(game.instances)) {
      const card = getCard(instance.cardId);
      const handlerCap = getSpecialCaseHandler(card)?.channelAmountCap?.(ctxFor(game, card, instance));
      if (handlerCap === undefined) continue;
      cap = cap === undefined ? handlerCap : Math.min(cap, handlerCap);
    }
    return cap;
  },

  /** True if `player` skips their own Draw Phase because some instance they control grants that (e.g. Endless Riches). See turnFlow.ts runDraw. */
  skipsOwnDrawPhase: (game: GameState, getCard: (cardId: string) => Card, player: PlayerId): boolean => {
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== player) continue;
      const card = getCard(instance.cardId);
      if (getSpecialCaseHandler(card)?.blocksOwnDrawPhase?.(ctxFor(game, card, instance))) return true;
    }
    return false;
  },

  /** True if `scoringPlayer` is on their first or second turn AND some in-play instance (either controller) grants the "score becomes a draw" effect (e.g. Otterpus). See turnFlow.ts runBeginning. */
  scoringConvertedToDraw: (game: GameState, getCard: (cardId: string) => Card, scoringPlayer: PlayerId): boolean => {
    if (game.players[scoringPlayer].turnsTaken > 2) return false;
    for (const instance of Object.values(game.instances)) {
      const card = getCard(instance.cardId);
      if (getSpecialCaseHandler(card)?.convertsScoringToDrawOnEarlyTurns?.(ctxFor(game, card, instance))) {
        return true;
      }
    }
    return false;
  },
};
