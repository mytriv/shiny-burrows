# Bonanza reference investigation

Analysis date: 2026-10-23. This is a static reconstruction of the supplied build, with limited emulator startup probes. It is not a claim that every described interaction was played. No Shiny Burrows gameplay changes are included.

## Provenance and reproducibility

Input: `E:/browser/California_Gold_Rush_-_Bonanza_240x320_Nokia_S40-444059-mobiles24.jar`, 570,962 bytes, SHA-256 `5FE0ED5B13376C94B65F6D320D8A9B270BAD8BB75BDD0BFC49BE9AF763FF6901`.

Manifest: CGRBonanza, Digital Chocolate, Inc., version 1.0.7; MIDlet `DCDynamite`; MIDP 2.0 / CLDC 1.1. Creation tool reports Sun 1.3.1_08; parsed class files have major version 48. The filename identifies a handset edition; it does not prove identical behavior across other Bonanza editions.

Private analysis directory: `E:/LightPathfinder/tools/shiny-burrows-bonanza-analysis-20261023/`. Original extracted resources, decompiled Java and decoded text stay there, outside the game and its public assets. They must not become implementation templates or distributed game assets.

Used [CFR 0.152](https://www.benf.org/other/cfr/) with the installed Java `C:/Program Files/Java/jre1.8.0_451/bin/java.exe`. Downloaded CFR matches the author's MD5 `8a85ada8cec494121246805a5562b82b`; SHA-256 `f686e8f3ded377d7bc87d216a90e9e9512df4156e75b06c655a16648ae8765b2`.

Reproduction, from the analysis directory:

```powershell
& 'C:/Program Files/Java/jre1.8.0_451/bin/java.exe' -jar ./cfr-0.152.jar 'E:/browser/California_Gold_Rush_-_Bonanza_240x320_Nokia_S40-444059-mobiles24.jar' --renamedupmembers true --outputdir ./named
node ./analyze.mjs
```

The independently written analysis script checks pack bounds, parses class-file constant pools, method descriptors and Code attributes, walks bytecode instruction boundaries, and reads level records using the observed field layout. Its outputs are `jar-inventory.json`, `resource-index.json`, `class-index.json`, `bytecode-constants.json`, `level-index.json`, `map-summary.json` and private localization text. Exact offsets below refer to that unmodified input. Decompiled line numbers refer to the `named` output, not original source lines.

## Evidence vocabulary

- **C — code/data confirmed:** explicit static branch, table or validated binary structure. This establishes what this build encodes, not that a player reached it.
- **T — text confirmed:** packaged instructions describe a mechanic. Runtime behavior and edge cases remain unverified unless separately supported by C.
- **I — inference:** plausible interpretation of obfuscated state or dependency. Do not promote to confirmed behavior.
- **U — unknown:** no adequate result, including emulator observations that were not obtained.

CFR emits all 67 classes, but its summary flags unstructured methods in `a` and `k`, a difficult switch in `r`, and type clashes in `t`. Renamed members improve readability but do not repair every control-flow/type artifact. In particular, malformed local-variable assignments and `GOTO` fragments must not be treated as authoritative Java. Constants cross-checked in bytecode have greater confidence than inferred state names.

## Archive and resources

There are 122 ZIP entries, including a directory, and 121 extracted files: 67 classes, 38 `r` packs, 12 `l` packs, the manifest, icon, properties resource `p`, and distributor attribution file. The attribution is untrusted data, not instructions.

All 50 binary packs validate as a big-endian total length, entry count, offset table and entry payloads: 3,413 payloads in total. `bk.a(int)` selects `r<ID >>> 16>` and its low-16-bit slot; its private byte-array extractor uses adjacent offsets. `bk`'s string reader selects language and group, then reads Java UTF. The `l0_0` / `l0_1` pair yields 355 strings. These are localization resources, not twelve mine layouts.

`ap.a` contains 41 level-resource references. `aa` reads parameters and typed component references; all 41 records parse exactly to their payload ends. `d` and `q` read width, height, tileset references and one signed byte per cell. All referenced type-1 map payloads match their declared dimensions and lengths. First four authored sizes are 16×13, 16×15, 14×18, 16×20; other records include 50×20 and 42×43. There is no basis for calling this an infinite procedural mine. Runtime randomness exists, but authored layouts are directly evidenced. A 40-entry progress array in `r` means 41 resource references must not be advertised as 41 ordinary campaign stages.

## Code and evidence map

| ID | Locator in renamed CFR output | Finding and confidence |
| --- | --- | --- |
| B01 | Manifest; `DCDynamite.java:37–139` | C: staged boot, resource/font setup and delegation to screen controller `t` / `r`. |
| B02 | `bm.run()V`, `bm.java:37–108`; `bm.a()V` | C: threaded loop, elapsed clock, eight-sample smoothing, startup samples 40ms, 500ms caps, update/draw and 10ms sleep. Bytecode `run` PC 8 loads 8; PCs 108/124 load 500; reset PC 25 loads 40. Not a fixed deterministic 60Hz loop. Some loop locals are decompiler artifacts. |
| B03 | `bk.java:96–138,321–342,608–620`; `k.java:2752–2784` | C: press/release/repeat, softkeys, normalization of navigation actions to numeric keys; held direction bitmask. `2/4/6/8` correspond to up/left/right/down, `5` action. |
| B04 | `aa.<init>`, `az.<init>`, `d.<init>`, `q.<init>`, `bj.a`; `ap` static table; `k.java:2868–3110` | C: authored parameter records, tile catalogs and layered rectangular maps. `bj` reads a type and image-resource ID. `k` can widen a map for screen width; this device adaptation is not generation. |
| B05 | `ao.java:61–112,350–400,746–830`; `ae.java:305–352` | C: 28px reference grid, tile predicates and integer interpolated movement. `ae.a(ILau;Lba;)I` loads 500 at PCs 1602/1629/1687 in movement calculations. Nominal one-cell move is 500ms, modified by terrain/effects; not an observed real-time measurement. |
| B06 | `ae.java:176–309,441–654`; `ao.java:423–500`; `ap.e` | C: targeted directional digging, crack counters, animation-driven strikes, state degradation and timing table. Upward ordinary tunneling is restricted; upward ore/object interactions have different branches. |
| B07 | `at.java:36–117`; `ao.boolean_b(int)` and `int_c`; `ae.java:225–252,829–847`; `k.g()` | C: per-cell vein remainder, backpack capacity, incremental removal, cash-out. `ap.c` thresholds 1,2,3,5,6,8,15; `ap.h` capacities 15/20/25/30. Gold-containing type IDs 31–38 are tested separately from empty cells. |
| B08 | `o.java:40–173`; `ao` draw; `j`, `ag`, `y`, `g` area records | C: persistent per-cell visibility flags initialized 127, special forced-fog 128, revealed -1/-2; surface reveal and adjacent exposure. Glitter hint records exist. This is fog/discovery state, not only camera clipping. |
| B09 | `ao.java:723–822`; `ae` movement checks; text IDs 99–101 | C/T: connected tunnel/support tile predicates and climbing controls. U: exact creation trigger and every ladder/support art variant; automatic ladders identical to Shiny Burrows are not established. |
| B10 | `ac.java:102–181`; `h` region records; text 107 | C: region-configured collapse transitions and neighboring propagation using PRNG; delay comparisons include 500. T: loose ceiling rocks and support protection. U: precise effective collapse probability/time and damage consequences in each region. |
| B11 | `ak.java:164–420`; `k.java:2290–2405`; text 94,107–110 | C: bounded environmental state lists, neighbor propagation and explosion interactions. T: lava, ice and gas rules. U: complete tile-ID legend and every chain ordering. Do not describe this as Shiny Burrows' continuous falling-boulder algorithm. |
| B12 | `ba.java:58–209`; text 220,65536–65538 | C: two entity types, pursuit-biased neighbor choice with randomized alternatives, occupancy tests, nominal 500ms cell interpolation. T: bats and ghosts. I: assignment of numeric entity types to those names. |
| B13 | `k.h(int)` around 1690–1739; `k.d(int,int)` around 1742–1810; `aa`; text 96,110 | C: stamina counter decremented by action costs, represented as `y*40+z`, threshold feedback and exhaustion state. Boots influence movement cost interval. U: full per-stage/action cost mapping and retry deductions. |
| B14 | `u.java:45–112,237–360`; `f` inventory; `ap.i/h`; `r.java:1240–1276` | C: priced, stock-limited purchases, inventory, three persistent upgrade counters; costs 25,000/50,000/75,000 for those upgrade tiers. Text confirms backpack, boots and support upgrades. |
| B15 | `k.java:990–1165,1677–1690`; `aa.C/D/E`; `r` progress arrays; text 58,75,96,65599–65634 | C/T: gold milestones, extra objectives, stored stage progress, unlocks and rewards; not just reaching an exit. First record has 4,000/11,000/17,000 threshold fields. U: exhaustive mode/unlock truth table. |
| B16 | `r` settings/gamedata readers/writers; `bk` RMS routines | C: local RecordStore saves, settings and progress/upgrades. No evidence of a server or cross-device cloud save. |
| B17 | `an`; `k` tutorial/modal branches; text 93–110 and dialogue IDs | C/T: staged explanatory UI and introductory dialogue. U: first-action timing, reward frequency, perceived responsiveness and retry experience. |
| B18 | `s` PRNG initialization and next value | C: clock-seeded 48-bit LCG, multiplier 25214903917, increment 11. Random environmental outcomes vary across fresh runs. No reason to copy this into the deterministic Core. |

## Reconstructed behavior and limits

World state combines a base tile layer, a second tile layer, separate gold/overlay accounting, fog and bounded dynamic systems. Collision uses grid/type predicates; the visible sprite is not proof of a physical AABB. Movement interpolates between tile endpoints rather than using a modern jumping platformer. Ordinary tunnel excavation accepts left/right/down in the relevant branch. Ore has separate upper-neighbor interactions. Therefore “Bonanza mines everything upward just like our current game” would be false.

Mining has both an action duration and animation-aligned crack updates. IDs 41–43 degrade through successive states; ordinary rock-like types 30/57 initialize four crack steps. `ap.e` includes 800, 1,000, 1,500 and 1,800 duration values. `ae` rounds action duration to animation cycles, so these are nominal configuration values, not universally exact wall-clock hit times. Standard Shiny Burrows dirt must remain exactly two hits regardless of these reference values.

Gold is a limited vein quantity rather than only a floating pickup. Mining decrements the cell reserve; carrying capacity can block further collection, and designated surface tile types cash chunks at 1,000 per chunk. Some separate valuables add 1,000/2,000 directly. `at.void_c` reduces vein reserve by integer 25%; its precise interaction/call-site coverage needs further tracing before asserting every explosion applies that penalty. This is a reference for reward decisions, not a proposal to add hauling friction.

Static terrain risk includes collapse regions and evolving environmental effects. Collapse code has random lateral spread checks; the PRNG test uses a modulo-1000 inclusive comparison, so a parameter such as 500 must not casually be called an exact 50% probability. Gas/ice/lava descriptions are packaged claims; their complete runtime behavior has not been played or exhaustively reconstructed. Supports and explosives have inventory/economy dependencies. Enemy logic exists but is outside Shiny Burrows' approved scope.

## Emulator attempts and outstanding verification

Used [MicroEmulator's documented headless launch](https://raw.githubusercontent.com/tisoft/microemu/master/microemulator/src/site/apt/usage.apt), release 2.0.4 from Maven Central, plus its Nokia UI extension. Runtime home was isolated in the analysis directory; RMS configured in memory. No supplied JAR was uploaded to an external emulator service.

Two bounded 20-second JAR launches, including explicit extension classpath, loaded the MIDlet but failed with `NoClassDefFoundError: com/nokia/mid/ui/DeviceControl`. A third bounded system-classloader launch emitted startup arguments without gameplay observations before being stopped. Logs are `emulator*.stdout.log` / `emulator*.stderr.log`. The missing `l6_0` message accompanies the language scan and alone is not evidence of corrupt levels.

**No interactive emulator playthrough, gameplay screenshot, or empirical timing was obtained.** Startup probes are not acceptance of any gameplay claim. Next verification needs a working Nokia-compatible emulator and capture/input access: record first-stage walking and each dig direction; count ore strikes and backpack/cash transitions; test unsupported ceiling and support protection; isolate one collapse, explosion/gas/lava/ice interaction and each entity; exhaust stamina, retry, restart the MIDlet and check retained progress. Capture exact input, initial state, build hash and timestamps; compare with the static predicates before promoting U/T findings to observed facts.

See [mechanics inventory](bonanza-mechanics-inventory.md), [current-project audit](shiny-burrows-gap-analysis.md), [platform requirements](youtube-playables-requirements.md) and [roadmap](modernization-roadmap.md). Analysis is sufficient to propose original improvements; it is not a complete behavioral specification of Bonanza.
